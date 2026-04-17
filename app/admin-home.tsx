import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllLecturers, getAllStudents, getAllVenues } from '../database/db';

export default function AdminHome() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [lecturerCount, setLecturerCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);

  useEffect(() => { loadAdmin(); loadStats(); }, []);

  const loadAdmin = async () => {
    const saved = await AsyncStorage.getItem('current_admin');
    if (saved) setAdmin(JSON.parse(saved));
  };

  const loadStats = async () => {
    const students = await getAllStudents();
    const lecturers = await getAllLecturers();
    const venues = await getAllVenues();
    if (students.success) setStudentCount(students.students.length);
    if (lecturers.success) setLecturerCount(lecturers.lecturers.length);
    if (venues.success) setVenueCount(venues.venues.length);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('current_admin');
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
          <Text style={styles.greeting}>{getTimeGreeting()}, {admin ? admin.name : 'Admin'}!</Text>
          <Text style={styles.subgreeting}>Campus IQ Control Center</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/profile-admin')}>
          <Ionicons name="shield-checkmark" size={28} color="#D85A30" />
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/all-students')}>
          <Ionicons name="people-outline" size={24} color="#1D9E75" />
          <Text style={styles.statNumber}>{studentCount}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/all-lecturers')}>
          <Ionicons name="book-outline" size={24} color="#534AB7" />
          <Text style={styles.statNumber}>{lecturerCount}</Text>
          <Text style={styles.statLabel}>Lecturers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => router.push('/manage-venues')}>
          <Ionicons name="location-outline" size={24} color="#D85A30" />
          <Text style={styles.statNumber}>{venueCount}</Text>
          <Text style={styles.statLabel}>Venues</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>User Management</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/add-lecturer')}>
          <Ionicons name="person-add-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Add Lecturer</Text>
          <Text style={styles.cardSub}>Create account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/all-lecturers')}>
          <Ionicons name="people-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>All Lecturers</Text>
          <Text style={styles.cardSub}>View and edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/all-students')}>
          <Ionicons name="person-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>All Students</Text>
          <Text style={styles.cardSub}>View accounts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/suspend-user')}>
          <Ionicons name="ban-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Suspend User</Text>
          <Text style={styles.cardSub}>Block access</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Academic Management</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/manage-timetable')}>
          <Ionicons name="calendar-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Timetables</Text>
          <Text style={styles.cardSub}>Create and publish</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/manage-venues')}>
          <Ionicons name="location-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Venues</Text>
          <Text style={styles.cardSub}>Manage rooms</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/manage-timetable')}>
          <Ionicons name="git-branch-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Clash Detector</Text>
          <Text style={styles.cardSub}>Check conflicts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/generate-qr')}>
          <Ionicons name="document-text-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Attendance</Text>
          <Text style={styles.cardSub}>All records</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Communication</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/broadcast')}>
          <Ionicons name="notifications-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Broadcast</Text>
          <Text style={styles.cardSub}>Notify all users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/chat')}>
          <Ionicons name="chatbubbles-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Moderate Chat</Text>
          <Text style={styles.cardSub}>Monitor messages</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>System</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/app-settings')}>
          <Ionicons name="settings-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardSub}>App config</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/analytics')}>
          <Ionicons name="bar-chart-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Analytics</Text>
          <Text style={styles.cardSub}>Usage reports</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/msu-radio')}>
          <Ionicons name="radio-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>MSU Radio</Text>
          <Text style={styles.cardSub}>Listen live</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/campus-map')}>
          <Ionicons name="map-outline" size={30} color="#FFD700" />
          <Text style={styles.cardTitle}>Campus Map</Text>
          <Text style={styles.cardSub}>Navigate campus</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  subgreeting: { fontSize: 13, color: '#ffaaaa', marginTop: 2 },
  avatarCircle: { backgroundColor: '#3d1a0a', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#D85A30' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#a0c4ff', width: '31%', padding: 14, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#a0c4ff', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 12, marginTop: 10, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', padding: 18, borderRadius: 14, alignItems: 'center' },
  green: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75' },
  purple: { backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7' },
  orange: { backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#D85A30' },
  dark: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#a0c4ff' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 10, textAlign: 'center' },
  cardSub: { fontSize: 11, color: '#a0c4ff', marginTop: 4, textAlign: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});