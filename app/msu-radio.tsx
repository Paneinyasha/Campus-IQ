import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ZIMBABWE_STATIONS = [
  { name: 'MSU Campus Radio', frequency: '101.7 FM', location: 'Gweru', url: 'https://stream.zeno.fm/msuradio', isDefault: true, hours: '06:00 - 21:00 daily' },
  { name: 'MSU Campus Radio', frequency: '90.3 FM', location: 'Zvishavane', url: 'https://stream.zeno.fm/msuradio', isDefault: false, hours: '06:00 - 21:00 daily' },
  { name: 'Star FM', frequency: '106.4 FM', location: 'Harare', url: 'https://stream.zeno.fm/starfm', isDefault: false, hours: '24/7' },
  { name: 'ZBC Radio Zimbabwe', frequency: '98.4 FM', location: 'National', url: 'https://stream.zeno.fm/zbcradio', isDefault: false, hours: '24/7' },
  { name: 'Power FM', frequency: '98.0 FM', location: 'Harare', url: 'https://stream.zeno.fm/powerfm', isDefault: false, hours: '24/7' },
  { name: 'Capitalk FM', frequency: '100.4 FM', location: 'Harare', url: 'https://stream.zeno.fm/capitalkfm', isDefault: false, hours: '24/7' },
  { name: 'Hevoi FM', frequency: '99.4 FM', location: 'Masvingo', url: 'https://stream.zeno.fm/hevoifm', isDefault: false, hours: '24/7' },
];

export default function MSURadio() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(ZIMBABWE_STATIONS[0]);
  const [showStations, setShowStations] = useState(false);

  // Animated wave bars
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
    return () => { if (sound) sound.unloadAsync(); stopAnimations(); };
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
      Animated.sequence([
        Animated.timing(wave1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(wave1, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(wave2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(wave2, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(wave3, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(wave3, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(wave4, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(wave4, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(wave5, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(wave5, { toValue: 0.2, duration: 400, useNativeDriver: true }),
      ]),
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

  const playRadio = async (station: any) => {
    try {
      setIsLoading(true);
      if (sound) { await sound.unloadAsync(); setSound(null); }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true, volume: 1.0 }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) { setIsPlaying(false); }
      });
    } catch (error) {
      Alert.alert('Connection Error', `Could not connect to ${station.name}. Please check your internet connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopRadio = async () => {
    try {
      if (sound) { await sound.stopAsync(); await sound.unloadAsync(); setSound(null); }
      setIsPlaying(false);
    } catch (e) {}
  };

  const togglePlay = () => {
    if (isPlaying) stopRadio();
    else playRadio(selectedStation);
  };

  const switchStation = async (station: any) => {
    setSelectedStation(station);
    setShowStations(false);
    if (isPlaying) {
      await stopRadio();
      setTimeout(() => playRadio(station), 500);
    }
  };

  const isOnAir = () => {
    const hour = new Date().getHours();
    const isMSU = selectedStation.name.includes('MSU');
    if (isMSU) return hour >= 6 && hour < 21;
    return true;
  };

  const openRadioGarden = () => {
    Linking.openURL('https://radio.garden').catch(() => {
      Alert.alert('Error', 'Could not open Radio Garden');
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

      {/* Player Card */}
      <View style={styles.playerCard}>
        {/* On Air Badge */}
        <View style={styles.onAirRow}>
          <View style={[styles.onAirDot, { backgroundColor: isOnAir() ? '#1D9E75' : '#D85A30' }]} />
          <Text style={[styles.onAirText, { color: isOnAir() ? '#1D9E75' : '#D85A30' }]}>
            {isOnAir() ? 'ON AIR' : 'OFF AIR'}
          </Text>
          {selectedStation.name.includes('MSU') && (
            <Text style={styles.broadcastHours}>06:00 - 21:00 daily</Text>
          )}
        </View>

        {/* Animated Radio Icon */}
        <Animated.View style={[styles.radioLogo, { transform: [{ scale: pulseAnim }], borderColor: isPlaying ? '#FFD700' : '#534AB7' }]}>
          <Ionicons name="radio" size={60} color={isPlaying ? '#FFD700' : '#534AB7'} />
        </Animated.View>

        <Text style={styles.stationName}>{selectedStation.name}</Text>
        <Text style={styles.stationFreq}>{selectedStation.frequency} • {selectedStation.location}</Text>

        {/* Animated Wave Bars */}
        <View style={styles.waveBox}>
          {[wave1, wave2, wave3, wave4, wave5].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  transform: [{ scaleY: anim }],
                  backgroundColor: isPlaying ? '#FFD700' : '#534AB7',
                  opacity: isPlaying ? 1 : 0.4,
                }
              ]}
            />
          ))}
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isPlaying ? '#1D9E75' : '#D85A30' }]} />
          <Text style={styles.statusText}>
            {isLoading ? 'Connecting...' : isPlaying ? 'Live Now' : 'Stopped'}
          </Text>
        </View>

        {/* Play Button */}
        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.stopBtn, isLoading && { opacity: 0.6 }]}
          onPress={togglePlay}
          disabled={isLoading}
        >
          <Ionicons
            name={isLoading ? 'hourglass-outline' : isPlaying ? 'pause' : 'play'}
            size={36}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={styles.playLabel}>
          {isLoading ? 'Connecting...' : isPlaying ? 'Tap to pause' : 'Tap to listen live'}
        </Text>
      </View>

      {/* MSU Station Info Card */}
      {selectedStation.name.includes('MSU') && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About MSU Campus Radio</Text>
          <Text style={styles.infoText}>
            Midlands State University Campus Radio broadcasts on 101.7 FM in Gweru and 90.3 FM in Zvishavane, daily from 06:00 to 21:00. The station features campus news, student-focused programs, and live shows, serving as a hub for community engagement.
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#1D9E75" />
            <Text style={styles.infoMeta}>Broadcast Hours: 06:00 - 21:00 daily</Text>
          </View>
        </View>
      )}

      {/* Station List */}
      <TouchableOpacity style={styles.stationsBtn} onPress={() => setShowStations(!showStations)}>
        <Ionicons name="list-outline" size={20} color="#FFD700" />
        <Text style={styles.stationsBtnText}>Zimbabwe Stations</Text>
        <Ionicons name={showStations ? 'chevron-up' : 'chevron-down'} size={20} color="#FFD700" />
      </TouchableOpacity>

      {showStations && (
        <View style={styles.stationsList}>
          {ZIMBABWE_STATIONS.map((station, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.stationItem, selectedStation.name === station.name && selectedStation.frequency === station.frequency && styles.stationItemActive]}
              onPress={() => switchStation(station)}
            >
              <View style={styles.stationItemLeft}>
                <Ionicons
                  name="radio-outline"
                  size={20}
                  color={selectedStation.frequency === station.frequency ? '#FFD700' : '#a0c4ff'}
                />
                <View>
                  <View style={styles.stationNameRow}>
                    <Text style={[styles.stationItemName, selectedStation.frequency === station.frequency && { color: '#FFD700' }]}>
                      {station.name}
                    </Text>
                    {station.isDefault && <View style={styles.defaultPill}><Text style={styles.defaultPillText}>DEFAULT</Text></View>}
                  </View>
                  <Text style={styles.stationItemFreq}>{station.frequency} • {station.location}</Text>
                </View>
              </View>
              {selectedStation.frequency === station.frequency ? (
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
              ) : (
                <Ionicons name="play-circle-outline" size={20} color="#a0c4ff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Radio Garden Button */}
      <TouchableOpacity style={styles.radioGardenBtn} onPress={openRadioGarden}>
        <Ionicons name="globe-outline" size={22} color="#a0c4ff" />
        <View style={styles.radioGardenBtnText}>
          <Text style={styles.radioGardenTitle}>Radio Garden</Text>
          <Text style={styles.radioGardenSub}>Explore radio stations worldwide</Text>
        </View>
        <Ionicons name="open-outline" size={20} color="#a0c4ff" />
      </TouchableOpacity>

      {/* Program Info */}
      <View style={styles.programCard}>
        <Text style={styles.programTitle}>What to Expect on MSU Radio</Text>
        <View style={styles.programRow}>
          <Ionicons name="musical-notes-outline" size={20} color="#FFD700" />
          <Text style={styles.programText}>Music and entertainment</Text>
        </View>
        <View style={styles.programRow}>
          <Ionicons name="newspaper-outline" size={20} color="#FFD700" />
          <Text style={styles.programText}>Campus news and updates</Text>
        </View>
        <View style={styles.programRow}>
          <Ionicons name="mic-outline" size={20} color="#FFD700" />
          <Text style={styles.programText}>Student talk shows</Text>
        </View>
        <View style={styles.programRow}>
          <Ionicons name="calendar-outline" size={20} color="#FFD700" />
          <Text style={styles.programText}>Event announcements</Text>
        </View>
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
  waveBox: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 50, marginVertical: 16 },
  waveBar: { width: 6, height: 40, borderRadius: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  playBtn: { backgroundColor: '#1D9E75', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#FFD700' },
  stopBtn: { backgroundColor: '#D85A30' },
  playLabel: { color: '#a0c4ff', fontSize: 13 },
  infoCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 14 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  infoText: { fontSize: 13, color: '#a0c4ff', lineHeight: 22, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoMeta: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  stationsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#FFD700', borderRadius: 12, padding: 14, marginBottom: 8 },
  stationsBtnText: { color: '#FFD700', fontSize: 15, fontWeight: 'bold', flex: 1 },
  stationsList: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 8, marginBottom: 12 },
  stationItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, marginBottom: 4 },
  stationItemActive: { backgroundColor: '#1a1650' },
  stationItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stationItemName: { fontSize: 15, color: '#ffffff', fontWeight: 'bold' },
  defaultPill: { backgroundColor: '#1D9E7522', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  defaultPillText: { fontSize: 9, color: '#1D9E75', fontWeight: 'bold' },
  stationItemFreq: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  radioGardenBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, marginBottom: 12 },
  radioGardenBtnText: { flex: 1 },
  radioGardenTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  radioGardenSub: { color: '#a0c4ff', fontSize: 12, marginTop: 2 },
  programCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 40, gap: 12 },
  programTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programText: { fontSize: 14, color: '#a0c4ff' },
});
