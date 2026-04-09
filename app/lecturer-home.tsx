import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LecturerHome() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<any>(null);

  useEffect(() => {
    loadLecturer();
  }, []);

  const loadLecturer = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_lecturer');
      if (saved) {
        setLecturer(JSON.parse(saved));
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('current_lecturer');
    router.replace('/');
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getTimeGreeting()}, {lecturer ? lecturer.name : 'Lecturer'}!
          </Text>
          <Text style={styles.subgreeting}>
            {lecturer ? lecturer.department : 'Midlands State University'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push('/profile-lecturer')}
        >
          <Ionicons name="book" size={28} color="#534AB7" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Teaching</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.purple]}
          onPress={() => router.push('/manage-timetable')}
        >
          <Ionicons name="calendar-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>My Timetable</Text>
          <Text style={styles.cardSub}>Teaching schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.purple]}
          onPress={() => router.push('/manage-venues')}
        >
          <Ionicons name="location-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Venues</Text>
          <Text style={styles.cardSub}>Find free rooms</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Attendance</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/generate-qr')}
        >
          <Ionicons name="qr-code-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Generate QR</Text>
          <Text style={styles.cardSub}>Start attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/generate-qr')}
        >
          <Ionicons name="list-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Register</Text>
          <Text style={styles.cardSub}>View attendance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/generate-qr')}
        >
          <Ionicons name="bar-chart-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Reports</Text>
          <Text style={styles.cardSub}>Attendance stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/generate-qr')}
        >
          <Ionicons name="bluetooth-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>BLE Verify</Text>
          <Text style={styles.cardSub}>Proximity check</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Quizzes</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.orange]}
          onPress={() => router.push('/create-quiz')}
        >
          <Ionicons name="add-circle-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Create Quiz</Text>
          <Text style={styles.cardSub}>Set for students</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.orange]}
          onPress={() => router.push('/quiz-results')}
        >
          <Ionicons name="stats-chart-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Quiz Results</Text>
          <Text style={styles.cardSub}>View scores</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Communication</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/broadcast')}
        >
          <Ionicons name="notifications-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Notify Students</Text>
          <Text style={styles.cardSub}>Send updates</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubbles-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Chat</Text>
          <Text style={styles.cardSub}>Student messages</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/my-notes')}
        >
          <Ionicons name="document-text-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Study Notes</Text>
          <Text style={styles.cardSub}>Upload materials</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/campus-map')}
        >
          <Ionicons name="map-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Campus Map</Text>
          <Text style={styles.cardSub}>Navigate campus</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subgreeting: {
    fontSize: 13,
    color: '#a0c4ff',
    marginTop: 2,
  },
  avatarCircle: {
    backgroundColor: '#1a1650',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#534AB7',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    marginTop: 10,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  card: {
    width: '48%',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  purple: {
    backgroundColor: '#1a1650',
    borderWidth: 1,
    borderColor: '#534AB7',
  },
  green: {
    backgroundColor: '#0a3d2e',
    borderWidth: 1,
    borderColor: '#1D9E75',
  },
  orange: {
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#D85A30',
  },
  dark: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#a0c4ff',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 11,
    color: '#a0c4ff',
    marginTop: 4,
    textAlign: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 10,
    marginBottom: 40,
  },
  logoutText: {
    color: '#ffaaaa',
    fontSize: 16,
  },
});