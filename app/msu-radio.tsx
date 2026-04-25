import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ZIMBABWE_STATIONS = [
  {
    name: 'MSU Campus Radio',
    frequency: '101.7 FM',
    location: 'Gweru',
    url: 'https://listen.openstream.co/9052/audio',
    isDefault: true,
    hours: '06:00 - 21:00 daily',
    description: 'Official Midlands State University Radio Station'
  },
  {
    name: 'Star FM Zimbabwe',
    frequency: '106.4 FM',
    location: 'Harare',
    url: 'https://listen.openstream.co/5079/audio',
    isDefault: false,
    hours: '24/7',
    description: 'Zimbabwe\'s leading commercial radio station'
  },
  {
    name: 'ZBC Radio Zimbabwe',
    frequency: '98.4 FM',
    location: 'National',
    url: 'https://stream.zbc.co.zw/radio/8040/stream',
    isDefault: false,
    hours: '24/7',
    description: 'Zimbabwe Broadcasting Corporation'
  },
  {
    name: 'Power FM Zimbabwe',
    frequency: '98.0 FM',
    location: 'Harare',
    url: 'https://listen.openstream.co/6466/audio',
    isDefault: false,
    hours: '24/7',
    description: 'Power FM Zimbabwe'
  },
  {
    name: 'Capitalk FM',
    frequency: '100.4 FM',
    location: 'Harare',
    url: 'https://listen.openstream.co/5078/audio',
    isDefault: false,
    hours: '24/7',
    description: 'Capitalk FM Zimbabwe'
  },
  {
    name: 'Hevoi FM',
    frequency: '99.4 FM',
    location: 'Masvingo',
    url: 'https://listen.openstream.co/9490/audio',
    isDefault: false,
    hours: '24/7',
    description: 'Hevoi FM Masvingo'
  },
  {
    name: 'Jacaranda FM',
    frequency: '94.2 FM',
    location: 'South Africa',
    url: 'https://listen.openstream.co/892/audio',
    isDefault: false,
    hours: '24/7',
    description: 'Jacaranda FM South Africa'
  },
];

export default function MSURadio() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(ZIMBABWE_STATIONS[0]);
  const [showStations, setShowStations] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const wave1 = useRef(new Animated.Value(0.3)).current;
  const wave2 = useRef(new Animated.Value(0.6)).current;
  const wave3 = useRef(new Animated.Value(1.0)).current;
  const wave4 = useRef(new Animated.Value(0.6)).current;
  const wave5 = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      if (sound) sound.unloadAsync();
      stopAnimations();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) startAnimations();
    else stopAnimations();
  }, [isPlaying]);

  const startAnimations = () => {
    pulseAnimRef.current = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]));
    pulseAnimRef.current.start();
    waveAnimRef.current = Animated.loop(Animated.stagger(120, [
      Animated.sequence([Animated.timing(wave1, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(wave1, { toValue: 0.2, duration: 400, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(wave2, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(wave2, { toValue: 0.2, duration: 400, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(wave3, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(wave3, { toValue: 0.2, duration: 400, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(wave4, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(wave4, { toValue: 0.2, duration: 400, useNativeDriver: true })]),
      Animated.sequence([Animated.timing(wave5, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(wave5, { toValue: 0.2, duration: 400, useNativeDriver: true })]),
    ]));
    waveAnimRef.current.start();
  };

  const stopAnimations = () => {
    waveAnimRef.current?.stop();
    pulseAnimRef.current?.stop();
    Animated.parallel([
      Animated.timing(wave1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      Animated.timing(wave2, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      Animated.timing(wave3, { toValue: 1.0, duration: 300, useNativeDriver: true }),
      Animated.timing(wave4, { toValue: 0.6, duration: 300, useNativeDriver: true }),
      Animated.timing(wave5, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const stopRadio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
    } catch (e) {}
  };

  const playRadio = async (station: any) => {
    try {
      setIsLoading(true);
      await stopRadio();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 1000 },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying) setIsPlaying(true);
            if (status.didJustFinish) setIsPlaying(false);
          } else {
            if (status.error) {
              console.log('Playback error:', status.error);
              setIsPlaying(false);
            }
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
      setRetryCount(0);
    } catch (error: any) {
      console.log('Radio error:', error);
      setIsPlaying(false);
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        Alert.alert(
          'Connection Issue',
          `Could not connect to ${station.name}. This station may be temporarily unavailable. Try another station from the list.`,
          [
            { text: 'Try Again', onPress: () => setTimeout(() => playRadio(station), 2000) },
            { text: 'Choose Another', onPress: () => setShowStations(true) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Stream Unavailable',
          `${station.name} stream is currently unavailable. Try another station.`,
          [
            { text: 'Choose Another', onPress: () => setShowStations(true) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setRetryCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) stopRadio();
    else playRadio(selectedStation);
  };

  const switchStation = async (station: any) => {
    setSelectedStation(station);
    setShowStations(false);
    setRetryCount(0);
    await stopRadio();
    setTimeout(() => playRadio(station), 800);
  };

  const isOnAir = () => {
    const hour = new Date().getHours();
    const isMSU = selectedStation.name.includes('MSU');
    if (isMSU) return hour >= 6 && hour < 21;
    return true;
  };

  const openRadioGarden = () => {
    Linking.openURL('https://radio.garden/listen/msu-campus-radio/').catch(() => {
      Linking.openURL('https://radio.garden').catch(() => Alert.alert('Error', 'Could not open Radio Garden'));
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { stopRadio(); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>MSU Radio</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.playerCard}>
        <View style={styles.onAirRow}>
          <View style={[styles.onAirDot, { backgroundColor: isOnAir() ? '#1D9E75' : '#D85A30' }]} />
          <Text style={[styles.onAirText, { color: isOnAir() ? '#1D9E75' : '#D85A30' }]}>
            {isOnAir() ? 'ON AIR' : 'OFF AIR'}
          </Text>
          {selectedStation.name.includes('MSU') && (
            <Text style={styles.broadcastHours}>06:00 - 21:00 daily</Text>
          )}
        </View>

        <Animated.View style={[styles.radioLogo, { transform: [{ scale: pulseAnim }], borderColor: isPlaying ? '#FFD700' : '#534AB7' }]}>
          <Ionicons name="radio" size={60} color={isPlaying ? '#FFD700' : '#534AB7'} />
        </Animated.View>

        <Text style={styles.stationName}>{selectedStation.name}</Text>
        <Text style={styles.stationFreq}>{selectedStation.frequency} • {selectedStation.location}</Text>
        <Text style={styles.stationDesc}>{selectedStation.description}</Text>

        <View style={styles.waveBox}>
          {[wave1, wave2, wave3, wave4, wave5].map((anim, i) => (
            <Animated.View key={i} style={[styles.waveBar, { transform: [{ scaleY: anim }], backgroundColor: isPlaying ? '#FFD700' : '#534AB7', opacity: isPlaying ? 1 : 0.4 }]} />
          ))}
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isLoading ? '#FFD700' : isPlaying ? '#1D9E75' : '#D85A30' }]} />
          <Text style={styles.statusText}>
            {isLoading ? 'Connecting...' : isPlaying ? 'Live Now' : 'Stopped'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.stopBtn, isLoading && { opacity: 0.6 }]}
          onPress={togglePlay}
          disabled={isLoading}
        >
          <Ionicons name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'} size={36} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.playLabel}>
          {isLoading ? 'Connecting...' : isPlaying ? 'Tap to stop' : 'Tap to listen live'}
        </Text>
      </View>

      <View style={styles.streamInfoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
        <Text style={styles.streamInfoText}>
          Streams use internet data. If a station fails to connect it may be temporarily down. Try another station or use Radio Garden for more options.
        </Text>
      </View>

      <TouchableOpacity style={styles.stationsBtn} onPress={() => setShowStations(!showStations)}>
        <Ionicons name="list-outline" size={20} color="#FFD700" />
        <Text style={styles.stationsBtnText}>Zimbabwe Stations ({ZIMBABWE_STATIONS.length})</Text>
        <Ionicons name={showStations ? 'chevron-up' : 'chevron-down'} size={20} color="#FFD700" />
      </TouchableOpacity>

      {showStations && (
        <View style={styles.stationsList}>
          {ZIMBABWE_STATIONS.map((station, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.stationItem, selectedStation.url === station.url && styles.stationItemActive]}
              onPress={() => switchStation(station)}
            >
              <View style={styles.stationItemLeft}>
                <View style={[styles.stationIconBox, selectedStation.url === station.url && { backgroundColor: '#1a1650' }]}>
                  <Ionicons name="radio-outline" size={18} color={selectedStation.url === station.url ? '#FFD700' : '#a0c4ff'} />
                </View>
                <View>
                  <View style={styles.stationNameRow}>
                    <Text style={[styles.stationItemName, selectedStation.url === station.url && { color: '#FFD700' }]}>
                      {station.name}
                    </Text>
                    {station.isDefault && (
                      <View style={styles.defaultPill}><Text style={styles.defaultPillText}>DEFAULT</Text></View>
                    )}
                  </View>
                  <Text style={styles.stationItemFreq}>{station.frequency} • {station.location}</Text>
                </View>
              </View>
              {selectedStation.url === station.url ? (
                <Ionicons name={isPlaying ? 'volume-high' : 'checkmark-circle'} size={20} color="#FFD700" />
              ) : (
                <Ionicons name="play-circle-outline" size={20} color="#a0c4ff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.radioGardenBtn} onPress={openRadioGarden}>
        <Ionicons name="globe-outline" size={22} color="#a0c4ff" />
        <View style={styles.radioGardenBtnText}>
          <Text style={styles.radioGardenTitle}>Radio Garden</Text>
          <Text style={styles.radioGardenSub}>Find MSU Radio and explore stations worldwide</Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#a0c4ff" />
      </TouchableOpacity>

      {selectedStation.name.includes('MSU') && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About MSU Campus Radio</Text>
          <Text style={styles.infoText}>
            Midlands State University Campus Radio broadcasts on 101.7 FM in Gweru and 90.3 FM in Zvishavane, daily from 06:00 to 21:00. Features campus news, student programs, music and live shows.
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#1D9E75" />
            <Text style={styles.infoMeta}>Broadcast Hours: 06:00 - 21:00 daily</Text>
          </View>
        </View>
      )}

      <View style={styles.programCard}>
        <Text style={styles.programTitle}>What to Expect on MSU Radio</Text>
        {[
          { icon: 'musical-notes-outline', text: 'Music and entertainment' },
          { icon: 'newspaper-outline', text: 'Campus news and updates' },
          { icon: 'mic-outline', text: 'Student talk shows' },
          { icon: 'calendar-outline', text: 'Event announcements' },
        ].map((item, i) => (
          <View key={i} style={styles.programRow}>
            <Ionicons name={item.icon as any} size={20} color="#FFD700" />
            <Text style={styles.programText}>{item.text}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  playerCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#FFD700', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  onAirRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, width: '100%' },
  onAirDot: { width: 10, height: 10, borderRadius: 5 },
  onAirText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 2 },
  broadcastHours: { fontSize: 11, color: '#a0c4ff', marginLeft: 'auto' },
  radioLogo: { backgroundColor: '#001f4d', width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 16 },
  stationName: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  stationFreq: { fontSize: 14, color: '#1D9E75', fontWeight: 'bold', marginBottom: 4 },
  stationDesc: { fontSize: 12, color: '#a0c4ff', marginBottom: 8, textAlign: 'center' },
  waveBox: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 50, marginVertical: 16 },
  waveBar: { width: 6, height: 40, borderRadius: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  playBtn: { backgroundColor: '#1D9E75', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#FFD700' },
  stopBtn: { backgroundColor: '#D85A30' },
  playLabel: { color: '#a0c4ff', fontSize: 13 },
  streamInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 14 },
  streamInfoText: { color: '#a0c4ff', fontSize: 12, flex: 1, lineHeight: 18 },
  stationsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#FFD700', borderRadius: 12, padding: 14, marginBottom: 8 },
  stationsBtnText: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', flex: 1 },
  stationsList: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 8, marginBottom: 12 },
  stationItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, marginBottom: 4 },
  stationItemActive: { backgroundColor: '#1a1650' },
  stationItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stationIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0a2a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#534AB7' },
  stationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stationItemName: { fontSize: 14, color: '#ffffff', fontWeight: 'bold' },
  defaultPill: { backgroundColor: '#1D9E7522', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  defaultPillText: { fontSize: 9, color: '#1D9E75', fontWeight: 'bold' },
  stationItemFreq: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  radioGardenBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, marginBottom: 12 },
  radioGardenBtnText: { flex: 1 },
  radioGardenTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  radioGardenSub: { color: '#a0c4ff', fontSize: 12, marginTop: 2 },
  infoCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 14 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  infoText: { fontSize: 13, color: '#a0c4ff', lineHeight: 22, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoMeta: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  programCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 40, gap: 12 },
  programTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programText: { fontSize: 14, color: '#a0c4ff' },
});