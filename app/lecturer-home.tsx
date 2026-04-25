import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

function AnimatedBell({ hasNotif }: { hasNotif: boolean }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(w, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(w, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(w, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(w, { toValue: 0, duration: 80, useNativeDriver: true }), Animated.delay(hasNotif ? 1500 : 4000)])); a.start(); return () => a.stop(); }, [hasNotif]);
  const rotate = w.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });
  return (<View><Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications" size={30} color="#FFD700" /></Animated.View>{hasNotif && <View style={styles.notifDot} />}</View>);
}
function AnimatedRadio() { const p = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1.25, duration: 500, useNativeDriver: true }), Animated.timing(p, { toValue: 1, duration: 500, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: p }] }}><Ionicons name="radio" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedCalendar() { const b = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(b, { toValue: -6, duration: 400, useNativeDriver: true }), Animated.timing(b, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return <Animated.View style={{ transform: [{ translateY: b }] }}><Ionicons name="calendar" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedLocation() { const b = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(b, { toValue: -6, duration: 300, useNativeDriver: true }), Animated.timing(b, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.delay(2500)])).start(); }, []); return <Animated.View style={{ transform: [{ translateY: b }] }}><Ionicons name="location" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedQR() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(s, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(3000), Animated.timing(s, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(3000)])).start(); }, []); const rotate = s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="qr-code" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedList() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(s, { toValue: 4, duration: 300, useNativeDriver: true }), Animated.timing(s, { toValue: 0, duration: 300, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ translateX: s }] }}><Ionicons name="list" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedBarChart() { const s = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(s, { toValue: 1.15, duration: 300, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: s }] }}><Ionicons name="bar-chart" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedAddCircle() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(3000), Animated.timing(s, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(s, { toValue: 0, duration: 0, useNativeDriver: true })])).start(); }, []); const rotate = s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="add-circle" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedStats() { const s = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(s, { toValue: 1.2, duration: 300, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: s }] }}><Ionicons name="stats-chart" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedMegaphone() { const w = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(w, { toValue: 1, duration: 150, useNativeDriver: true }), Animated.timing(w, { toValue: -1, duration: 150, useNativeDriver: true }), Animated.timing(w, { toValue: 0, duration: 150, useNativeDriver: true })])).start(); }, []); const rotate = w.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="megaphone" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedChat() { const s = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(s, { toValue: 1.2, duration: 200, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(s, { toValue: 1.2, duration: 200, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 200, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: s }] }}><Ionicons name="chatbubbles" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedBook() { const f = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(f, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.timing(f, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(f, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.timing(f, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); const scaleX = f.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }); return <Animated.View style={{ transform: [{ scaleX }] }}><Ionicons name="document-text" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedShield() { const p = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1.15, duration: 800, useNativeDriver: true }), Animated.timing(p, { toValue: 1, duration: 800, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: p }] }}><Ionicons name="shield-checkmark" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedMap() { const d = useRef(new Animated.Value(-4)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(d, { toValue: 4, duration: 600, useNativeDriver: true }), Animated.timing(d, { toValue: -4, duration: 600, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return <Animated.View style={{ transform: [{ translateY: d }] }}><Ionicons name="map" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedSearch() { const r = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(r, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(r, { toValue: -1, duration: 400, useNativeDriver: true }), Animated.timing(r, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(3000)])).start(); }, []); const rot = r.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }); return <Animated.View style={{ transform: [{ rotate: rot }] }}><Ionicons name="search" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedShare() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(3000), Animated.timing(s, { toValue: 1, duration: 600, useNativeDriver: true }), Animated.timing(s, { toValue: 0, duration: 0, useNativeDriver: true })])).start(); }, []); const rotate = s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="share-social" size={30} color="#FFD700" /></Animated.View>; }
function AnimatedMedical() { const p = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1.2, duration: 400, useNativeDriver: true }), Animated.timing(p, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.delay(1000)])).start(); }, []); return <Animated.View style={{ transform: [{ scale: p }] }}><Ionicons name="medical" size={30} color="#D85A30" /></Animated.View>; }

export default function LecturerHome() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<any>(null);
  const [hasNotif, setHasNotif] = useState(false);
  useEffect(() => { loadLecturer(); }, []);
  const loadLecturer = async () => { try { const saved = await AsyncStorage.getItem('current_lecturer'); if (saved) { setLecturer(JSON.parse(saved)); checkNotifications(); } } catch (e) {} };
  const checkNotifications = async () => { const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', 0); setHasNotif((count || 0) > 0); };
  const handleLogout = async () => { await AsyncStorage.removeItem('current_lecturer'); router.replace('/'); };
  const handleShare = async () => { await Share.share({ message: 'Check out Campus IQ — the smart campus companion for MSU!', title: 'Campus IQ - MSU' }); };
  const getTimeGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getTimeGreeting()}, {lecturer ? lecturer.name : 'Lecturer'}!</Text>
          <Text style={styles.subgreeting}>{lecturer ? lecturer.department : 'Midlands State University'}</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/profile-lecturer')}>
          <Ionicons name="book" size={28} color="#534AB7" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Teaching</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/manage-timetable')}><AnimatedCalendar /><Text style={styles.cardTitle}>My Timetable</Text><Text style={styles.cardSub}>Teaching schedule</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/manage-venues')}><AnimatedLocation /><Text style={styles.cardTitle}>Venues</Text><Text style={styles.cardSub}>Find free rooms</Text></TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Attendance</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/generate-qr')}><AnimatedQR /><Text style={styles.cardTitle}>Generate QR</Text><Text style={styles.cardSub}>Start attendance</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/generate-qr')}><AnimatedList /><Text style={styles.cardTitle}>Register</Text><Text style={styles.cardSub}>View attendance</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/generate-qr')}><AnimatedBarChart /><Text style={styles.cardTitle}>Reports</Text><Text style={styles.cardSub}>Attendance stats</Text></TouchableOpacity>
        <View style={[styles.card, { backgroundColor: 'transparent', borderWidth: 0 }]} />
      </View>

      <Text style={styles.sectionTitle}>Quizzes</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/create-quiz')}><AnimatedAddCircle /><Text style={styles.cardTitle}>Create Quiz</Text><Text style={styles.cardSub}>Set for students</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/quiz-results')}><AnimatedStats /><Text style={styles.cardTitle}>Quiz Results</Text><Text style={styles.cardSub}>View scores</Text></TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Communication</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/broadcast')}><AnimatedMegaphone /><Text style={styles.cardTitle}>Notify Students</Text><Text style={styles.cardSub}>Send updates</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/chat')}><AnimatedChat /><Text style={styles.cardTitle}>Chat</Text><Text style={styles.cardSub}>Student messages</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/my-notes')}><AnimatedBook /><Text style={styles.cardTitle}>Study Notes</Text><Text style={styles.cardSub}>Upload materials</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/anonymous-report')}><AnimatedShield /><Text style={styles.cardTitle}>Reports</Text><Text style={styles.cardSub}>Anonymous reports</Text></TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Campus Life</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/msu-radio')}><AnimatedRadio /><Text style={styles.cardTitle}>MSU Radio</Text><Text style={styles.cardSub}>Listen live</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/campus-map')}><AnimatedMap /><Text style={styles.cardTitle}>Campus Map</Text><Text style={styles.cardSub}>Navigate campus</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => { router.push('/notifications'); setHasNotif(false); }}><AnimatedBell hasNotif={hasNotif} /><Text style={styles.cardTitle}>Notifications</Text><Text style={styles.cardSub}>Updates</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/lost-found')}><AnimatedSearch /><Text style={styles.cardTitle}>Lost & Found</Text><Text style={styles.cardSub}>Report items</Text></TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={handleShare}><AnimatedShare /><Text style={styles.cardTitle}>Share App</Text><Text style={styles.cardSub}>Invite others</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.card, { backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30' }]} onPress={() => router.push('/emergency-services')}><AnimatedMedical /><Text style={styles.cardTitle}>Emergency</Text><Text style={styles.cardSub}>Campus services</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ffaaaa" /><Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  subgreeting: { fontSize: 13, color: '#a0c4ff', marginTop: 2 },
  avatarCircle: { backgroundColor: '#1a1650', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#534AB7' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 12, marginTop: 10, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', padding: 18, borderRadius: 14, alignItems: 'center' },
  purple: { backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7' },
  green: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75' },
  orange: { backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#D85A30' },
  dark: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#a0c4ff' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 10, textAlign: 'center' },
  cardSub: { fontSize: 11, color: '#a0c4ff', marginTop: 4, textAlign: 'center' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D85A30', borderWidth: 1, borderColor: '#001f4d' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});
