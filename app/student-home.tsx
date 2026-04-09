import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StudentHome() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        setStudent(JSON.parse(saved));
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('current_student');
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
            {getTimeGreeting()}, {student ? student.name : 'Student'}!
          </Text>
          <Text style={styles.subgreeting}>
            {student ? student.reg_number : 'Midlands State University'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.avatarCircle}
          onPress={() => router.push('/profile-student')}
        >
          <Ionicons name="person" size={28} color="#1D9E75" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Academic</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/manage-timetable')}
        >
          <Ionicons name="calendar-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Timetable</Text>
          <Text style={styles.cardSub}>View schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/manage-venues')}
        >
          <Ionicons name="location-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Venues</Text>
          <Text style={styles.cardSub}>Free rooms</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/scan-attendance')}
        >
          <Ionicons name="qr-code-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Attendance</Text>
          <Text style={styles.cardSub}>Scan QR code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.green]}
          onPress={() => router.push('/my-notes')}
        >
          <Ionicons name="document-text-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>My Notes</Text>
          <Text style={styles.cardSub}>Study notes</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Quizzes</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.purple]}
          onPress={() => router.push('/quiz-msu')}
        >
          <Ionicons name="school-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>MSU Quiz</Text>
          <Text style={styles.cardSub}>About MSU</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.purple]}
          onPress={() => router.push('/quiz-program')}
        >
          <Ionicons name="book-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Program Quiz</Text>
          <Text style={styles.cardSub}>Your course</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.purple]}
          onPress={() => router.push('/quiz-didyouknow')}
        >
          <Ionicons name="globe-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Did You Know</Text>
          <Text style={styles.cardSub}>Global facts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.purple]}
          onPress={() => router.push('/quiz-set')}
        >
          <Ionicons name="clipboard-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Set Quizzes</Text>
          <Text style={styles.cardSub}>By lecturers</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Tools</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.orange]}
          onPress={() => router.push('/plan-my-day')}
        >
          <Ionicons name="today-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Plan My Day</Text>
          <Text style={styles.cardSub}>Daily planner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.orange]}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubbles-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Chat</Text>
          <Text style={styles.cardSub}>Student chat</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Campus Life</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/msu-radio')}
        >
          <Ionicons name="radio-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>MSU Radio</Text>
          <Text style={styles.cardSub}>Listen live</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/campus-map')}
        >
          <Ionicons name="map-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Campus Map</Text>
          <Text style={styles.cardSub}>Find your way</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.card, styles.dark]}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardSub}>Updates</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.dark]}>
          <Ionicons name="people-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Student Body</Text>
          <Text style={styles.cardSub}>SRC updates</Text>
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
    color: '#FFD700',
    marginTop: 2,
  },
  avatarCircle: {
    backgroundColor: '#0a3d2e',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1D9E75',
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
  green: {
    backgroundColor: '#0a3d2e',
    borderWidth: 1,
    borderColor: '#1D9E75',
  },
  purple: {
    backgroundColor: '#1a1650',
    borderWidth: 1,
    borderColor: '#534AB7',
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