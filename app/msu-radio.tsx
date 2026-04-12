import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ZIMBABWE_STATIONS = [
  { name: 'MSU FM', frequency: '88.6 FM', url: 'https://stream.zeno.fm/msuradio', isDefault: true },
  { name: 'Star FM', frequency: '106.4 FM', url: 'https://stream.zeno.fm/starfm', isDefault: false },
  { name: 'ZBC Radio Zimbabwe', frequency: '98.4 FM', url: 'https://stream.zeno.fm/zbcradio', isDefault: false },
  { name: 'Power FM', frequency: '98.0 FM', url: 'https://stream.zeno.fm/powerfm', isDefault: false },
  { name: 'Capitalk FM', frequency: '100.4 FM', url: 'https://stream.zeno.fm/capitalkfm', isDefault: false },
  { name: 'Hevoi FM', frequency: '99.4 FM', url: 'https://stream.zeno.fm/hevoifm', isDefault: false },
];

export default function MSURadio() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStation, setSelectedStation] = useState(ZIMBABWE_STATIONS[0]);
  const [showStations, setShowStations] = useState(false);
  const [showRadioGarden, setShowRadioGarden] = useState(false);

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
    };
  }, []);

  const playRadio = async (station: any) => {
    try {
      setIsLoading(true);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: station.url },
        { shouldPlay: true, volume: 1.0 }
      );
      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) {
          setIsPlaying(false);
          setIsLoading(false);
        }
      });
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Connection Error', `Could not connect to ${station.name}. Please check your internet connection.`);
    }
  };

  const stopRadio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
    } catch (error) {}
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopRadio();
    } else {
      playRadio(selectedStation);
    }
  };

  const switchStation = async (station: any) => {
    setSelectedStation(station);
    setShowStations(false);
    if (isPlaying) {
      await stopRadio();
      setTimeout(() => playRadio(station), 500);
    }
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
        <View style={styles.radioLogo}>
          <Ionicons name="radio" size={60} color="#FFD700" />
        </View>
        <Text style={styles.stationName}>{selectedStation.name}</Text>
        <Text style={styles.stationFreq}>{selectedStation.frequency}</Text>
        <Text style={styles.stationSub}>Midlands State University</Text>

        <View style={styles.waveBox}>
          {isPlaying ? (
            <View style={styles.waveRow}>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
              <View style={[styles.wave, styles.wave3]} />
              <View style={[styles.wave, styles.wave4]} />
              <View style={[styles.wave, styles.wave5]} />
            </View>
          ) : (
            <Text style={styles.offlineText}>— Not Playing —</Text>
          )}
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: isPlaying ? '#1D9E75' : '#D85A30' }]} />
          <Text style={styles.statusText}>
            {isLoading ? 'Connecting...' : isPlaying ? 'Live' : 'Stopped'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.playBtn, isPlaying && styles.stopBtn]}
          onPress={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={36} color="#ffffff" />
          ) : (
            <Ionicons name={isPlaying ? 'stop' : 'play'} size={36} color="#ffffff" />
          )}
        </TouchableOpacity>
        <Text style={styles.playLabel}>
          {isLoading ? 'Connecting...' : isPlaying ? 'Tap to stop' : 'Tap to listen live'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.stationsBtn}
        onPress={() => setShowStations(!showStations)}
      >
        <Ionicons name="list-outline" size={20} color="#FFD700" />
        <Text style={styles.stationsBtnText}>Zimbabwe Stations</Text>
        <Ionicons name={showStations ? 'chevron-up' : 'chevron-down'} size={20} color="#FFD700" />
      </TouchableOpacity>

      {showStations && (
        <View style={styles.stationsList}>
          {ZIMBABWE_STATIONS.map((station, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.stationItem,
                selectedStation.name === station.name && styles.stationItemActive
              ]}
              onPress={() => switchStation(station)}
            >
              <View style={styles.stationItemLeft}>
                <Ionicons
                  name="radio-outline"
                  size={20}
                  color={selectedStation.name === station.name ? '#FFD700' : '#a0c4ff'}
                />
                <View>
                  <Text style={[
                    styles.stationItemName,
                    selectedStation.name === station.name && { color: '#FFD700' }
                  ]}>
                    {station.name}
                    {station.isDefault && (
                      <Text style={styles.defaultBadge}> DEFAULT</Text>
                    )}
                  </Text>
                  <Text style={styles.stationItemFreq}>{station.frequency}</Text>
                </View>
              </View>
              {selectedStation.name === station.name && (
                <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.radioGardenBtn}
        onPress={() => setShowRadioGarden(!showRadioGarden)}
      >
        <Ionicons name="globe-outline" size={20} color="#a0c4ff" />
        <Text style={styles.radioGardenBtnText}>Radio Garden</Text>
        <Ionicons name={showRadioGarden ? 'chevron-up' : 'chevron-down'} size={20} color="#a0c4ff" />
      </TouchableOpacity>

      {showRadioGarden && (
        <View style={styles.radioGardenBox}>
          <View style={styles.radioGardenNotice}>
            <Ionicons name="information-circle-outline" size={18} color="#FFD700" />
            <Text style={styles.radioGardenNoticeText}>
              Radio Garden gives you access to thousands of FM stations from every country globally including Zimbabwe. You are leaving the MSU default station when you use Radio Garden.
            </Text>
          </View>
          <View style={styles.radioGardenInfo}>
            <Ionicons name="globe" size={40} color="#534AB7" />
            <Text style={styles.radioGardenTitle}>Radio Garden</Text>
            <Text style={styles.radioGardenSub}>
              Explore live radio stations from around the world. Search for Zimbabwe to find local stations or explore stations from any country.
            </Text>
            <Text style={styles.radioGardenUrl}>Visit: radio.garden</Text>
          </View>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About MSU FM</Text>
        <Text style={styles.infoText}>
          MSU FM 88.6 is the official radio station of Midlands State University. Stay updated with campus news, events, music, and entertainment broadcast live from the MSU media studios.
        </Text>
      </View>

      <View style={styles.programCard}>
        <Text style={styles.programTitle}>What to Expect</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  radioLogo: {
    backgroundColor: '#001f4d',
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    marginBottom: 16,
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  stationFreq: {
    fontSize: 16,
    color: '#1D9E75',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stationSub: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 2,
  },
  waveBox: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wave: {
    width: 6,
    borderRadius: 3,
    backgroundColor: '#1D9E75',
  },
  wave1: { height: 20 },
  wave2: { height: 35 },
  wave3: { height: 50 },
  wave4: { height: 35 },
  wave5: { height: 20 },
  offlineText: {
    color: '#7a9cc4',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playBtn: {
    backgroundColor: '#1D9E75',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  stopBtn: {
    backgroundColor: '#D85A30',
  },
  playLabel: {
    color: '#a0c4ff',
    fontSize: 13,
  },
  stationsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  stationsBtnText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  stationsList: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  stationItemActive: {
    backgroundColor: '#1a1650',
  },
  stationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stationItemName: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  defaultBadge: {
    fontSize: 10,
    color: '#1D9E75',
    fontWeight: 'bold',
  },
  stationItemFreq: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  radioGardenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  radioGardenBtnText: {
    color: '#a0c4ff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  radioGardenBox: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  radioGardenNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  radioGardenNoticeText: {
    color: '#FFD700',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  radioGardenInfo: {
    alignItems: 'center',
    gap: 8,
  },
  radioGardenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  radioGardenSub: {
    fontSize: 13,
    color: '#a0c4ff',
    textAlign: 'center',
    lineHeight: 20,
  },
  radioGardenUrl: {
    fontSize: 14,
    color: '#534AB7',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  infoCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#a0c4ff',
    lineHeight: 22,
  },
  programCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 40,
    gap: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  programText: {
    fontSize: 14,
    color: '#a0c4ff',
  },
});