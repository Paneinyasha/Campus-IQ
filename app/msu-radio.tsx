import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert, Animated, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { WebView } from 'react-native-webview';

// ─────────────────────────────────────────────────────────────────────────────
// MSU STREAM STRATEGY (Updated)
// ─────────────────────────────────────────────────────────────────────────────
// The hidden WebView loads radio.msu.ac.zw exactly as a browser would.
// Once the page is fully loaded, we inject JS that:
//   1. Clicks the floating "Play" button in the bottom player widget
//   2. Falls back to clicking the "Listen Live" hero button
//   3. Falls back to clicking any audio element or known player selectors
//   4. Falls back to finding and dispatching a click on any play-like element
//
// We poll every 500 ms for up to 10 s because the player widget is often
// rendered by JS after the initial HTML paint.
//
// The WebView is hidden using the same overflow:'hidden'/height:0/width:0
// technique that fixed the split-screen issue.
//
// For non-MSU stations we keep the self-contained HTML audio approach
// (no external page load needed — direct MP3/AAC streams).
// ─────────────────────────────────────────────────────────────────────────────

// Injected after the MSU page finishes loading.
// Polls for the player button and clicks it.
const MSU_AUTOPLAY_JS = `
(function() {
  var maxTries = 20;   // 20 × 500ms = 10 seconds
  var tries = 0;
  var played = false;

  function tryPlay() {
    if (played) return;
    tries++;

    // ── Selector battery: covers known player patterns on radio.msu.ac.zw ──
    // 1. The floating player's Play button (bottom bar)
    var selectors = [
      // Text-based searches (most reliable across theme changes)
      null,  // placeholder — handled below via text scan
      // ID / class patterns seen on typical Laravel + Howler.js / jPlayer setups
      '#player-play',
      '#play-btn',
      '#playBtn',
      '.play-btn',
      '.play-button',
      '.player-play',
      '.jp-play',
      '.mejs-play button',
      '.mejs__play button',
      'button.play',
      '[aria-label="Play"]',
      '[title="Play"]',
      '[data-action="play"]',
      '.listen-live',
      '.listen-btn',
      // The "Listen Live" hero CTA on radio.msu.ac.zw
      'a[href*="listen"]',
      'button[class*="listen"]',
      'a[class*="listen"]',
    ];

    // Try each CSS selector first
    for (var i = 1; i < selectors.length; i++) {
      try {
        var el = document.querySelector(selectors[i]);
        if (el) {
          el.click();
          played = true;
          window.ReactNativeWebView.postMessage('playing');
          return;
        }
      } catch(e) {}
    }

    // Text-content scan: find any button/a whose visible text is Play or Listen
    try {
      var allClickable = document.querySelectorAll('button, a, [role="button"], [onclick]');
      for (var j = 0; j < allClickable.length; j++) {
        var txt = (allClickable[j].textContent || '').trim().toLowerCase();
        if (txt === 'play' || txt === 'listen live' || txt === 'listen' || txt === '▶') {
          allClickable[j].click();
          played = true;
          window.ReactNativeWebView.postMessage('playing');
          return;
        }
      }
    } catch(e) {}

    // SVG / icon-only play button: look for a circle+triangle SVG pattern
    try {
      var svgUse = document.querySelectorAll('use');
      for (var k = 0; k < svgUse.length; k++) {
        var href = svgUse[k].getAttribute('href') || svgUse[k].getAttribute('xlink:href') || '';
        if (href.indexOf('play') !== -1) {
          var parent = svgUse[k].closest('button') || svgUse[k].closest('a') || svgUse[k].parentElement;
          if (parent) { parent.click(); played = true; window.ReactNativeWebView.postMessage('playing'); return; }
        }
      }
    } catch(e) {}

    // Last resort: trigger any <audio> element directly
    try {
      var audios = document.querySelectorAll('audio');
      if (audios.length > 0) {
        audios[0].play();
        played = true;
        window.ReactNativeWebView.postMessage('playing');
        return;
      }
    } catch(e) {}

    if (tries < maxTries) {
      setTimeout(tryPlay, 500);
    } else {
      // Give up — signal the app to show error
      window.ReactNativeWebView.postMessage('error:play_button_not_found');
    }
  }

  // Start polling as soon as the page DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryPlay, 800); });
  } else {
    setTimeout(tryPlay, 800);
  }

  // Also hook into any audio elements that get created after page load
  try {
    var observer = new MutationObserver(function() {
      if (!played) {
        var audios = document.querySelectorAll('audio');
        if (audios.length > 0) {
          audios[0].play().then(function() {
            played = true;
            window.ReactNativeWebView.postMessage('playing');
          }).catch(function() {});
        }
      }
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  } catch(e) {}
})();
true; // required by injectJavaScript
`;

// Stop script injected when user taps Stop or switches station
const MSU_STOP_JS = `
(function() {
  try {
    // Try clicking pause/stop selectors
    var stopSels = ['#player-pause','#pause-btn','#pauseBtn','.pause-btn','.pause-button',
      '.player-pause','.jp-pause','button.pause','[aria-label="Pause"]','[title="Pause"]',
      '[data-action="pause"]'];
    for (var i = 0; i < stopSels.length; i++) {
      var el = document.querySelector(stopSels[i]);
      if (el) { el.click(); break; }
    }
    // Also pause any audio elements directly
    var audios = document.querySelectorAll('audio');
    for (var j = 0; j < audios.length; j++) {
      audios[j].pause();
      audios[j].src = '';
    }
    // Kill any Howler.js instances
    if (window.Howler) { try { window.Howler.unload(); } catch(e) {} }
  } catch(e) {}
})();
true;
`;

// ─────────────────────────────────────────────────────────────────────────────
// Direct-stream HTML template for non-MSU stations
// ─────────────────────────────────────────────────────────────────────────────
const makeDirectHtml = (urls: string[]) => `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}body{background:#000}</style>
</head><body>
<script>
var sources = ${JSON.stringify(urls)};
var idx = 0;
var audio = new Audio();
audio.volume = 1.0;
audio.preload = 'none';

function tryNext() {
  if (idx >= sources.length) {
    window.ReactNativeWebView.postMessage('error:all_failed');
    return;
  }
  audio.src = sources[idx++];
  audio.load();
  audio.play().catch(function() { tryNext(); });
}

audio.addEventListener('playing', function() { window.ReactNativeWebView.postMessage('playing'); });
audio.addEventListener('pause',   function() { window.ReactNativeWebView.postMessage('paused');  });
audio.addEventListener('error',   function() { tryNext(); });
audio.addEventListener('stalled', function() { audio.load(); audio.play().catch(function(){}); });
window.stopAudio = function() { audio.pause(); audio.src = ''; };

tryNext();
<\/script>
</body></html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// STATION TYPES
// ─────────────────────────────────────────────────────────────────────────────
type StationMode = 'msu_site' | 'direct';

type Station = {
  name: string;
  frequency: string;
  location: string;
  isMSU: boolean;
  isDefault: boolean;
  hours: string;
  description: string;
  mode: StationMode;
  // mode === 'msu_site': load this URL in the WebView, then inject autoplay JS
  siteUrl?: string;
  // mode === 'direct': use self-contained HTML with direct stream URLs
  html?: string;
};

const STATIONS: Station[] = [
  {
    name: 'MSU Campus Radio – Gweru',
    frequency: '101.7 FM',
    location: 'Gweru',
    isMSU: true,
    isDefault: true,
    hours: '06:00 - 21:00',
    description: 'Official MSU Campus Radio — Gweru',
    mode: 'msu_site',
    siteUrl: 'https://radio.msu.ac.zw',
  },
  {
    name: 'MSU Campus Radio – Zvishavane',
    frequency: '90.3 FM',
    location: 'Zvishavane',
    isMSU: true,
    isDefault: false,
    hours: '06:00 - 21:00',
    description: 'Official MSU Campus Radio — Zvishavane relay',
    mode: 'msu_site',
    siteUrl: 'https://radio.msu.ac.zw',  // same stream, same site
  },
  {
    name: 'Star FM Zimbabwe',
    frequency: '89.7 FM',
    location: 'Harare',
    isMSU: false,
    isDefault: false,
    hours: '24/7',
    description: "Zimbabwe's first privately owned commercial station",
    mode: 'direct',
    html: makeDirectHtml(['https://edge.iono.fm/xice/159_high.mp3']),
  },
  {
    name: 'ZiFM Stereo',
    frequency: '106.4 FM',
    location: 'Harare',
    isMSU: false,
    isDefault: false,
    hours: '24/7',
    description: 'Zimbabwe commercial station — 80% national coverage',
    mode: 'direct',
    html: makeDirectHtml(['https://edge.iono.fm/xice/134_high.mp3']),
  },
  {
    name: 'Radio Zimbabwe (ZBC)',
    frequency: '93.5 FM',
    location: 'Harare',
    isMSU: false,
    isDefault: false,
    hours: '24/7',
    description: 'ZBC Radio Zimbabwe — The Whole Nation on One Station',
    mode: 'direct',
    html: makeDirectHtml([
      'https://listen.openstream.co/6465/audio',
      'https://stream.zeno.fm/radiozimbabwe',
    ]),
  },
  {
    name: 'Diamond FM',
    frequency: '103.8 FM',
    location: 'Mutare',
    isMSU: false,
    isDefault: false,
    hours: '24/7',
    description: "Manicaland's leading commercial radio station",
    mode: 'direct',
    html: makeDirectHtml([
      'https://listen.openstream.co/6788/audio',
      'https://stream.zeno.fm/diamondfm',
    ]),
  },
  {
    name: 'National FM (ZBC)',
    frequency: '97.6 FM',
    location: 'Harare',
    isMSU: false,
    isDefault: false,
    hours: '24/7',
    description: 'ZBC National FM — all 16 national languages',
    mode: 'direct',
    html: makeDirectHtml([
      'https://listen.openstream.co/6467/audio',
      'https://stream.zeno.fm/nationalfmzbc',
    ]),
  },
  {
    name: 'Jacaranda FM',
    frequency: '94.2 FM',
    location: 'South Africa',
    isMSU: false,
    isDefault: false,
    hours: '24/7',
    description: "South Africa's #1 feel-good station",
    mode: 'direct',
    html: makeDirectHtml(['https://edge.iono.fm/xice/17_high.mp3']),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function MSURadio() {
  const router = useRouter();

  const [selected, setSelected]   = useState<Station>(STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showList, setShowList]   = useState(false);
  const [webKey, setWebKey]       = useState(0);
  const [mounted, setMounted]     = useState(false);
  // For MSU site mode: track whether the page has finished loading
  const [pageLoaded, setPageLoaded] = useState(false);

  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.6)).current;
  const wave3 = useRef(new Animated.Value(1.0)).current;
  const wave4 = useRef(new Animated.Value(0.6)).current;
  const wave5 = useRef(new Animated.Value(0.3)).current;
  const pulse  = useRef(new Animated.Value(1)).current;
  const waveLoop  = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const webRef    = useRef<any>(null);

  const startAnims = () => {
    pulseLoop.current = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ]));
    pulseLoop.current.start();
    waveLoop.current = Animated.loop(Animated.stagger(120, [
      Animated.sequence([Animated.timing(wave1,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(wave1,{toValue:0.2,duration:400,useNativeDriver:true})]),
      Animated.sequence([Animated.timing(wave2,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(wave2,{toValue:0.2,duration:400,useNativeDriver:true})]),
      Animated.sequence([Animated.timing(wave3,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(wave3,{toValue:0.2,duration:400,useNativeDriver:true})]),
      Animated.sequence([Animated.timing(wave4,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(wave4,{toValue:0.2,duration:400,useNativeDriver:true})]),
      Animated.sequence([Animated.timing(wave5,{toValue:1,duration:400,useNativeDriver:true}),Animated.timing(wave5,{toValue:0.2,duration:400,useNativeDriver:true})]),
    ]));
    waveLoop.current.start();
  };

  const stopAnims = () => {
    waveLoop.current?.stop();
    pulseLoop.current?.stop();
    Animated.parallel([
      Animated.timing(wave1,{toValue:0.3,duration:300,useNativeDriver:true}),
      Animated.timing(wave2,{toValue:0.6,duration:300,useNativeDriver:true}),
      Animated.timing(wave3,{toValue:1.0,duration:300,useNativeDriver:true}),
      Animated.timing(wave4,{toValue:0.6,duration:300,useNativeDriver:true}),
      Animated.timing(wave5,{toValue:0.3,duration:300,useNativeDriver:true}),
      Animated.timing(pulse, {toValue:1,  duration:300,useNativeDriver:true}),
    ]).start();
  };

  const stopAudio = () => {
    if (selected.mode === 'msu_site') {
      webRef.current?.injectJavaScript(MSU_STOP_JS);
    } else {
      webRef.current?.injectJavaScript('window.stopAudio();true;');
    }
  };

  // Called when the MSU site WebView finishes loading — inject the autoplay script
  const onMsuPageLoad = () => {
    setPageLoaded(true);
    if (isLoading) {
      webRef.current?.injectJavaScript(MSU_AUTOPLAY_JS);
    }
  };

  const onMessage = (e: any) => {
    const msg: string = e.nativeEvent.data;
    if (msg === 'playing') {
      setIsPlaying(true);
      setIsLoading(false);
      startAnims();
    } else if (msg === 'paused') {
      setIsPlaying(false);
      stopAnims();
    } else if (msg.startsWith('error')) {
      setIsPlaying(false);
      setIsLoading(false);
      stopAnims();
      Alert.alert(
        'Stream Error',
        `Could not connect to ${selected.name}.\n\nCheck your internet connection or try another station.`,
        [
          { text: 'Try Again',      onPress: () => { setPageLoaded(false); setWebKey(k => k + 1); setIsLoading(true); } },
          { text: 'Other Stations', onPress: () => setShowList(true) },
          { text: 'Cancel',         style: 'cancel' },
        ]
      );
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
      stopAnims();
    } else {
      setIsLoading(true);
      setMounted(true);
      setPageLoaded(false);
      setWebKey(k => k + 1);
      // For direct-stream stations the HTML auto-plays immediately
      // For MSU site mode, autoplay is triggered in onMsuPageLoad
    }
  };

  const switchStation = (station: Station) => {
    stopAudio();
    setSelected(station);
    setShowList(false);
    setIsPlaying(false);
    setIsLoading(false);
    setMounted(false);
    setPageLoaded(false);
    stopAnims();
  };

  const onAir = () => {
    if (selected.isMSU) { const h = new Date().getHours(); return h >= 6 && h < 21; }
    return true;
  };

  const msuList   = STATIONS.filter(s => s.isMSU);
  const otherList = STATIONS.filter(s => !s.isMSU);

  // ── WebView source: URL for MSU site, inline HTML for direct streams ──────
  const webSource = selected.mode === 'msu_site'
    ? { uri: selected.siteUrl! }
    : { html: selected.html! };

  return (
    <View style={st.root}>

      {/*
        ══════════════════════════════════════════════════════════════════════
        HIDDEN ENGINE
        For MSU stations: loads radio.msu.ac.zw, then we inject JS to click play.
        For other stations: self-contained HTML with <Audio> and direct streams.
        The View wrapper (overflow:'hidden', 0×0) ensures nothing is visible.
        ══════════════════════════════════════════════════════════════════════
      */}
      <View style={st.audioWrapper}>
        {mounted && (
          <WebView
            ref={webRef}
            key={webKey}
            style={st.audioWebView}
            pointerEvents="none"
            source={webSource}
            onMessage={onMessage}
            onLoad={selected.mode === 'msu_site' ? onMsuPageLoad : undefined}
            // onLoadEnd fires after JS-rendered content too (more reliable for SPAs)
            onLoadEnd={selected.mode === 'msu_site' ? onMsuPageLoad : undefined}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            allowsBackgroundAudioPlaying={true}
            // Allow the MSU site to load all its own scripts/styles
            allowsProtectedMedia={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
            onError={() => {
              setIsPlaying(false);
              setIsLoading(false);
              stopAnims();
              Alert.alert('Connection Error', 'Failed to load the radio stream. Check your internet connection.');
            }}
          />
        )}
      </View>

      {/* ════════════ VISIBLE UI ════════════ */}
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent}>

        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity style={st.backBtn} onPress={() => {
            stopAudio(); setMounted(false); router.back();
          }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={st.headerTitle}>MSU Radio</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Player card */}
        <View style={st.card}>
          {/* On Air badge */}
          <View style={st.onAirRow}>
            <View style={[st.dot, { backgroundColor: onAir() ? '#1D9E75' : '#D85A30' }]} />
            <Text style={[st.onAirTxt, { color: onAir() ? '#1D9E75' : '#D85A30' }]}>
              {onAir() ? 'ON AIR' : 'OFF AIR'}
            </Text>
            {selected.isMSU && <Text style={st.hours}>{selected.hours} daily</Text>}
          </View>

          {/* Pulsing logo */}
          <Animated.View style={[st.logoCircle, {
            transform: [{ scale: pulse }],
            borderColor: isPlaying ? '#FFD700' : '#534AB7',
          }]}>
            <Ionicons name="radio" size={60} color={isPlaying ? '#FFD700' : '#534AB7'} />
          </Animated.View>

          <Text style={st.stationName}>{selected.name}</Text>
          <Text style={st.stationFreq}>{selected.frequency} • {selected.location}</Text>
          <Text style={st.stationDesc}>{selected.description}</Text>

          {/* Wave bars */}
          <View style={st.waveBox}>
            {[wave1,wave2,wave3,wave4,wave5].map((w,i)=>(
              <Animated.View key={i} style={[st.waveBar,{
                transform:[{scaleY:w}],
                backgroundColor: isPlaying ? '#FFD700' : '#534AB7',
                opacity: isPlaying ? 1 : 0.4,
              }]}/>
            ))}
          </View>

          {/* Status row */}
          <View style={st.statusRow}>
            <View style={[st.dot,{
              backgroundColor: isLoading ? '#FFD700' : isPlaying ? '#1D9E75' : '#D85A30',
            }]}/>
            <Text style={st.statusTxt}>
              {isLoading
                ? (selected.mode === 'msu_site' ? 'Loading MSU Radio site…' : 'Connecting…')
                : isPlaying ? 'Live Now' : 'Stopped'}
            </Text>
          </View>

          {/* Play/Stop button */}
          <TouchableOpacity
            style={[st.playBtn, isPlaying && st.stopBtn, isLoading && { opacity: 0.6 }]}
            onPress={togglePlay}
            disabled={isLoading}
          >
            <Ionicons
              name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
              size={36} color="#fff"
            />
          </TouchableOpacity>
          <Text style={st.playLabel}>
            {isLoading ? 'Please wait…' : isPlaying ? 'Tap to stop' : 'Tap to listen live'}
          </Text>
        </View>

        {/* Info banner */}
        <View style={st.banner}>
          <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
          <Text style={st.bannerTxt}>
            {selected.mode === 'msu_site'
              ? 'Campus IQ connects directly to the MSU Radio website player. Requires internet.'
              : 'Tap play to connect to the live stream. Requires an internet connection.'}
          </Text>
        </View>

        {/* Station list toggle */}
        <TouchableOpacity style={st.listBtn} onPress={() => setShowList(!showList)}>
          <Ionicons name="list-outline" size={20} color="#FFD700" />
          <Text style={st.listBtnTxt}>Zimbabwe Stations ({STATIONS.length})</Text>
          <Ionicons name={showList ? 'chevron-up' : 'chevron-down'} size={20} color="#FFD700" />
        </TouchableOpacity>

        {showList && (
          <View style={st.listBox}>
            <SectionHead icon="school-outline" label="MSU CAMPUS RADIOS" color="#1D9E75" />
            {msuList.map((station, i) => (
              <StationRow key={`m${i}`} station={station}
                isSelected={selected.name === station.name}
                isPlaying={isPlaying}
                onPress={() => switchStation(station)} />
            ))}
            <SectionHead icon="radio-outline" label="OTHER STATIONS" color="#a0c4ff" top />
            {otherList.map((station, i) => (
              <StationRow key={`o${i}`} station={station}
                isSelected={selected.name === station.name}
                isPlaying={isPlaying}
                onPress={() => switchStation(station)} />
            ))}
          </View>
        )}

        {/* MSU info card */}
        {selected.isMSU && (
          <View style={st.infoCard}>
            <Text style={st.infoTitle}>About MSU Campus Radio</Text>
            <Text style={st.infoBody}>
              Midlands State University Campus Radio broadcasts on 101.7 FM in Gweru
              and 90.3 FM in Zvishavane daily from 06:00 to 21:00. Features campus
              news, student programmes, music and live shows.
            </Text>
            <View style={st.infoRow}>
              <Ionicons name="time-outline" size={16} color="#1D9E75" />
              <Text style={st.infoMeta}>Broadcast Hours: 06:00 – 21:00 daily</Text>
            </View>
          </View>
        )}

        {/* Programme highlights */}
        <View style={st.programCard}>
          <Text style={st.programTitle}>What to Expect on MSU Radio</Text>
          {([
            ['musical-notes-outline','Music and entertainment'],
            ['newspaper-outline','Campus news and updates'],
            ['mic-outline','Student talk shows'],
            ['calendar-outline','Event announcements'],
          ] as const).map(([icon,txt],i)=>(
            <View key={i} style={st.programRow}>
              <Ionicons name={icon} size={20} color="#FFD700"/>
              <Text style={st.programTxt}>{txt}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function SectionHead({ icon, label, color, top }: {
  icon: string; label: string; color: string; top?: boolean;
}) {
  return (
    <View style={[st.secHead, top && { marginTop: 8 }]}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[st.secLabel, { color }]}>{label}</Text>
    </View>
  );
}

function StationRow({ station, isSelected, isPlaying, onPress }: {
  station: Station; isSelected: boolean; isPlaying: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[st.row, isSelected && st.rowActive]}
      onPress={onPress} activeOpacity={0.75}
    >
      <View style={[st.rowIcon, isSelected && { backgroundColor: '#1a1650' }]}>
        <Ionicons
          name={station.isMSU ? 'school-outline' : 'radio-outline'}
          size={18} color={isSelected ? '#FFD700' : '#a0c4ff'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={st.rowNameRow}>
          <Text style={[st.rowName, isSelected && { color: '#FFD700' }]} numberOfLines={1}>
            {station.name}
          </Text>
          {station.isDefault && (
            <View style={st.pill}>
              <Text style={[st.pillTxt, { color:'#1D9E75' }]}>DEFAULT</Text>
            </View>
          )}
          {station.isMSU && !station.isDefault && (
            <View style={[st.pill, { borderColor:'#534AB7' }]}>
              <Text style={[st.pillTxt, { color:'#a0c4ff' }]}>MSU</Text>
            </View>
          )}
        </View>
        <Text style={st.rowFreq}>{station.frequency} • {station.location}</Text>
      </View>
      <Ionicons
        name={isSelected ? (isPlaying ? 'volume-high' : 'checkmark-circle') : 'play-circle-outline'}
        size={20} color={isSelected ? '#FFD700' : '#a0c4ff'}
      />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#001f4d' },

  audioWrapper: {
    overflow: 'hidden',
    height: 0,
    width: 0,
  },
  audioWebView: {
    height: 1,
    width: 1,
    opacity: 0,
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 40 },

  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  backBtn: { padding:4 },
  headerTitle: { fontSize:22, fontWeight:'bold', color:'#fff' },

  card: {
    backgroundColor:'#0a2a4a', borderWidth:1, borderColor:'#FFD700',
    borderRadius:20, padding:24, alignItems:'center', marginBottom:16,
  },
  onAirRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:16, width:'100%' },
  dot:      { width:10, height:10, borderRadius:5 },
  onAirTxt: { fontSize:13, fontWeight:'bold', letterSpacing:2 },
  hours:    { fontSize:11, color:'#a0c4ff', marginLeft:'auto' },

  logoCircle: {
    backgroundColor:'#001f4d', width:110, height:110, borderRadius:55,
    alignItems:'center', justifyContent:'center', borderWidth:3, marginBottom:16,
  },
  stationName: { fontSize:20, fontWeight:'bold', color:'#FFD700', marginBottom:4, textAlign:'center' },
  stationFreq: { fontSize:14, color:'#1D9E75', fontWeight:'bold', marginBottom:4 },
  stationDesc: { fontSize:12, color:'#a0c4ff', marginBottom:8, textAlign:'center' },

  waveBox: { flexDirection:'row', alignItems:'center', gap:5, height:50, marginVertical:16 },
  waveBar: { width:6, height:40, borderRadius:3 },

  statusRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:20 },
  statusTxt: { color:'#fff', fontSize:14, fontWeight:'bold' },

  playBtn: {
    backgroundColor:'#1D9E75', width:80, height:80, borderRadius:40,
    alignItems:'center', justifyContent:'center', marginBottom:12,
    borderWidth:3, borderColor:'#FFD700',
  },
  stopBtn:   { backgroundColor:'#D85A30' },
  playLabel: { color:'#a0c4ff', fontSize:13 },

  banner: {
    flexDirection:'row', alignItems:'flex-start', gap:8,
    backgroundColor:'#0a2a4a', borderWidth:1, borderColor:'#534AB7',
    borderRadius:10, padding:12, marginBottom:14,
  },
  bannerTxt: { color:'#a0c4ff', fontSize:12, flex:1, lineHeight:18 },

  listBtn: {
    flexDirection:'row', alignItems:'center', gap:10,
    backgroundColor:'#0a2a4a', borderWidth:1, borderColor:'#FFD700',
    borderRadius:12, padding:14, marginBottom:8,
  },
  listBtnTxt: { color:'#FFD700', fontSize:15, fontWeight:'bold', flex:1 },

  listBox: {
    backgroundColor:'#0a2a4a', borderWidth:1, borderColor:'#534AB7',
    borderRadius:12, padding:8, marginBottom:12,
  },
  secHead: {
    flexDirection:'row', alignItems:'center', gap:6,
    paddingHorizontal:4, paddingVertical:6,
    borderBottomWidth:1, borderBottomColor:'#1a2a4a', marginBottom:4,
  },
  secLabel: { fontSize:11, fontWeight:'bold', letterSpacing:1 },

  row: { flexDirection:'row', alignItems:'center', padding:12, borderRadius:10, marginBottom:4 },
  rowActive: { backgroundColor:'#1a1650' },
  rowIcon: {
    width:36, height:36, borderRadius:18, backgroundColor:'#0a2a4a',
    alignItems:'center', justifyContent:'center',
    borderWidth:1, borderColor:'#534AB7', marginRight:12,
  },
  rowNameRow: { flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' },
  rowName:    { fontSize:14, color:'#fff', fontWeight:'bold' },
  pill: {
    backgroundColor:'#1D9E7522', borderWidth:1, borderColor:'#1D9E75',
    borderRadius:8, paddingHorizontal:6, paddingVertical:2,
  },
  pillTxt:  { fontSize:9, fontWeight:'bold' },
  rowFreq:  { fontSize:12, color:'#a0c4ff', marginTop:2 },

  infoCard: {
    backgroundColor:'#0a2a4a', borderWidth:1, borderColor:'#1D9E75',
    borderRadius:14, padding:16, marginBottom:14,
  },
  infoTitle: { fontSize:16, fontWeight:'bold', color:'#FFD700', marginBottom:10 },
  infoBody:  { fontSize:13, color:'#a0c4ff', lineHeight:22, marginBottom:10 },
  infoRow:   { flexDirection:'row', alignItems:'center', gap:6 },
  infoMeta:  { fontSize:13, color:'#1D9E75', fontWeight:'600' },

  programCard: {
    backgroundColor:'#0a2a4a', borderWidth:1, borderColor:'#534AB7',
    borderRadius:14, padding:16, marginBottom:40, gap:12,
  },
  programTitle: { fontSize:16, fontWeight:'bold', color:'#FFD700', marginBottom:4 },
  programRow:   { flexDirection:'row', alignItems:'center', gap:12 },
  programTxt:   { fontSize:14, color:'#a0c4ff' },
});
