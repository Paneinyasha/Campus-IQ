import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MSURadio() {
  const router = useRouter();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1.0);

  const RADIO_URL = 'https://stream.zeno.fm/msuradio';

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playRadio = async () => {
    try {
      setIsLoading(true);

      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: RADIO_URL },
        { shouldPlay: true, volume: volume }
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
      Alert.alert(
        'Connection Error',
        'Could not connect to MSU Radio. Please check your internet connection.',
        [{ text: 'OK' }]
      );
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
      playRadio();
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          stopRadio();
          router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>MSU Radio</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.playerCard}>

        <View style={styles.radioLogo}>
          <Ionicons name="radio" size={60} color="#FFD700" />
        </View>

        <Text style={styles.stationName}>MSU FM Radio</Text>
        <Text style={styles.stationSub}>Midlands State University</Text>
        <Text style={styles.stationSub}>Broadcasting Live</Text>

        <View style={styles.waveBox}>
          {isPlaying ? (
            <>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
              <View style={[styles.wave, styles.wave3]} />
              <View style={[styles.wave, styles.wave4]} />
              <View style={[styles.wave, styles.wave5]} />
            </>
          ) : (
            <Text style={styles.offlineText}>— Not Playing —</Text>
          )}
        </View>

        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isPlaying ? '#1D9E75' : '#D85A30' }
          ]} />
          <Text style={styles.statusText}>
            {isLoading ? 'Connecting...' : isPlaying ? 'Live' : 'Offline'}
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
            <Ionicons
              name={isPlaying ? 'stop' : 'play'}
              size={36}
              color="#ffffff"
            />
          )}
        </TouchableOpacity>

        <Text style={styles.playLabel}>
          {isLoading ? 'Connecting to radio...' : isPlaying ? 'Tap to stop' : 'Tap to listen live'}
        </Text>

      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About MSU Radio</Text>
        <Text style={styles.infoText}>
          MSU Radio is the official radio station of Midlands State University.
          Stay updated with campus news, events, music, and entertainment
          broadcast live from the MSU media studios.
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
        <View style={styles.programRow}>
          <Ionicons name="school-outline" size={20} color="#FFD700" />
          <Text style={styles.programText}>Academic programs and tips</Text>
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
  backBtn: {
    padding: 4,
  },
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
    marginBottom: 20,
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
  stationSub: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 2,
  },
  waveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 4,
    marginVertical: 16,
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