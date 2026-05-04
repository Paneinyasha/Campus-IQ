import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllLecturers, getAllStudents, getAllVenues } from '../database/db';
import { supabase } from '../database/supabase';
import { useAppTheme } from './_layout';

function Bell({ hasNotif, color }: { hasNotif: boolean; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true }), Animated.delay(hasNotif ? 1500 : 4000)])); a.start(); return () => a.stop(); }, [hasNotif]);
  const rotate = v.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });
  return (<View><Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications" size={30} color={color} /></Animated.View>{hasNotif && <View style={as.dot} />}</View>);
}

const I = ({ name, color, anim }: { name: string; color: string; anim?: any }) => (
  <Animated.View style={anim}><Ionicons name={name as any} size={30} color={color} /></Animated.View>
);

function usePulse() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1.2, duration: 700, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true })])).start(); }, []); return { transform: [{ scale: v }] }; }
function useBounce() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: -5, duration: 400, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return { transform: [{ translateY: v }] }; }
function useSpin() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2500), Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2500)])).start(); }, []); return { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }; }
function useWiggle() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true })])).start(); }, []); return { transform: [{ rotate: v.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }) }] }; }
function useSlide() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 4, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ translateX: v }] }; }

export default function AdminHome() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [lecturerCount, setLecturerCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);
  const [hasNotif, setHasNotif] = useState(false);
  const theme = useAppTheme();

  useEffect(() => { loadAdmin(); loadStats(); checkNotifications(); }, []);

  const loadAdmin = async () => { const saved = await AsyncStorage.getItem('current_admin'); if (saved) setAdmin(JSON.parse(saved)); };
  const loadStats = async () => {
    const students = await getAllStudents(); const lecturers = await getAllLecturers(); const venues = await getAllVenues();
    if (students.success) setStudentCount(students.students.length);
    if (lecturers.success) setLecturerCount(lecturers.lecturers.length);
    if (venues.success) setVenueCount(venues.venues.length);
  };
  const checkNotifications = async () => { const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', 0); setHasNotif((count || 0) > 0); };
  const handleLogout = async () => { await AsyncStorage.removeItem('current_admin'); router.replace('/'); };
  const handleShare = async () => { await Share.share({ message: 'Check out Campus IQ — the smart campus companion for MSU!', title: 'Campus IQ - MSU' }); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  const isLight = theme.themeName === 'light';
  const fs = theme.fontSize;
  const ic = isLight ? '#1a1a2e' : '#FFD700';
  const bg = isLight ? '#f4f6fb' : '#1a1a2e';
  const headerBg = isLight ? '#3d1a0a' : '#1a1a2e';
  const tc = isLight ? '#1a1a2e' : '#ffffff';
  const sc = isLight ? '#334455' : '#a0c4ff';
  const sec = isLight ? '#1a1a2e' : '#FFD700';

  const G = { bg: isLight ? '#d4edda' : '#0a3d2e', b: '#1D9E75' };
  const P = { bg: isLight ? '#e8e0ff' : '#1a1650', b: '#534AB7' };
  const O = { bg: isLight ? '#fde8d8' : '#2a1500', b: '#D85A30' };
  const D = { bg: isLight ? '#e8edf4' : '#0a1a2e', b: isLight ? '#7a9acc' : '#a0c4ff' };
  const E = { bg: '#3d1a0a', b: '#D85A30' };

  const c = (p: { bg: string; b: string }) => [as.card, { backgroundColor: p.bg, borderColor: p.b }];
  const pulse = usePulse(); const bounce = useBounce(); const spin = useSpin();
  const wiggle = useWiggle(); const slide = useSlide();

  // Stat card colors
  const statBg = isLight ? '#ffffff' : '#0a1a2e';
  const statBorder = isLight ? '#c8d4e8' : '#a0c4ff';

  return (
    <ScrollView style={[as.container, { backgroundColor: bg }]}>
      <View style={[as.header, { backgroundColor: headerBg }]}>
        <View>
          <Text style={[as.greeting, { color: '#FFD700', fontSize: fs + 6 }]}>{greeting()}, {admin ? admin.name : 'Admin'}!</Text>
          <Text style={[as.sub, { color: '#ffaaaa', fontSize: fs - 1 }]}>Campus IQ Control Center</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/app-settings')}>
            <Ionicons name="settings-outline" size={22} color="#a0c4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={[as.avatar, { backgroundColor: '#3d1a0a', borderColor: '#D85A30' }]} onPress={() => router.push('/profile-admin')}>
            <Ionicons name="shield-checkmark" size={28} color="#D85A30" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={as.content}>
        {/* STATS */}
        <View style={as.statsRow}>
          <TouchableOpacity style={[as.statCard, { backgroundColor: statBg, borderColor: statBorder }]} onPress={() => router.push('/all-students')}>
            <Ionicons name="people-outline" size={24} color="#1D9E75" />
            <Text style={[as.statNum, { color: tc }]}>{studentCount}</Text>
            <Text style={[as.statLabel, { color: sc }]}>Students</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[as.statCard, { backgroundColor: statBg, borderColor: statBorder }]} onPress={() => router.push('/all-lecturers')}>
            <Ionicons name="book-outline" size={24} color="#534AB7" />
            <Text style={[as.statNum, { color: tc }]}>{lecturerCount}</Text>
            <Text style={[as.statLabel, { color: sc }]}>Lecturers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[as.statCard, { backgroundColor: statBg, borderColor: statBorder }]} onPress={() => router.push('/manage-venues')}>
            <Ionicons name="location-outline" size={24} color="#D85A30" />
            <Text style={[as.statNum, { color: tc }]}>{venueCount}</Text>
            <Text style={[as.statLabel, { color: sc }]}>Venues</Text>
          </TouchableOpacity>
        </View>

        {/* USER MANAGEMENT */}
        <Text style={[as.sec, { color: sec, fontSize: fs + 1 }]}>User Management</Text>
        <View style={as.row}>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/manage-users')}><I name="people-circle" color={ic} anim={pulse} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Manage Users</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Search & edit</Text></TouchableOpacity>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/add-lecturer')}><I name="person-add" color={ic} anim={slide} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Add Lecturer</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Create account</Text></TouchableOpacity>
        </View>
        <View style={as.row}>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/all-students')}><I name="person" color={ic} anim={bounce} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>All Students</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>View accounts</Text></TouchableOpacity>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/suspend-user')}><I name="ban" color={ic} anim={spin} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Suspend User</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Block access</Text></TouchableOpacity>
        </View>

        {/* ACADEMIC */}
        <Text style={[as.sec, { color: sec, fontSize: fs + 1 }]}>Academic Management</Text>
        <View style={as.row}>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/manage-timetable')}><I name="calendar" color={ic} anim={bounce} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Timetables</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Create and publish</Text></TouchableOpacity>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/manage-venues')}><I name="location" color={ic} anim={bounce} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Venues</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Manage rooms</Text></TouchableOpacity>
        </View>

        {/* COMMUNICATION */}
        <Text style={[as.sec, { color: sec, fontSize: fs + 1 }]}>Communication & Reports</Text>
        <View style={as.row}>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/broadcast')}><I name="megaphone" color={ic} anim={wiggle} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Broadcast</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Notify all users</Text></TouchableOpacity>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/anonymous-report')}><I name="shield-checkmark" color={ic} anim={pulse} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Anon Reports</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Student reports</Text></TouchableOpacity>
        </View>

        {/* CAMPUS TOOLS */}
        <Text style={[as.sec, { color: sec, fontSize: fs + 1 }]}>Campus Tools</Text>
        <View style={as.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/lost-found')}><I name="search" color={ic} anim={wiggle} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Lost & Found</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Manage items</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/src-elections')}><I name="people" color={ic} anim={bounce} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>SRC Elections</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Manage voting</Text></TouchableOpacity>
        </View>
        <View style={as.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/analytics')}><I name="bar-chart" color={ic} anim={pulse} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Analytics</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Usage reports</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/games')}><I name="game-controller" color={ic} anim={wiggle} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Games</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Play offline</Text></TouchableOpacity>
        </View>
        <View style={as.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/msu-radio')}><I name="radio" color={ic} anim={pulse} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>MSU Radio</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Listen live</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => { router.push('/notifications'); setHasNotif(false); }}>
            <Bell hasNotif={hasNotif} color={ic} />
            <Text style={[as.ct, { fontSize: fs, color: tc }]}>Notifications</Text>
            <Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Updates</Text>
          </TouchableOpacity>
        </View>
        <View style={as.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/campus-map')}><I name="map" color={ic} anim={bounce} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Campus Map</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Navigate campus</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={handleShare}><I name="share-social" color={ic} anim={spin} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Share App</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>Invite others</Text></TouchableOpacity>
        </View>
        <View style={as.row}>
          <TouchableOpacity style={c(E)} onPress={() => router.push('/emergency-services')}>
            <I name="medical" color="#D85A30" anim={pulse} />
            <Text style={[as.ct, { fontSize: fs, color: '#ffffff' }]}>Emergency</Text>
            <Text style={[as.cs, { fontSize: fs - 4, color: '#F0997B' }]}>Campus services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/app-settings')}><I name="settings" color={ic} anim={spin} /><Text style={[as.ct, { fontSize: fs, color: tc }]}>Settings</Text><Text style={[as.cs, { fontSize: fs - 4, color: sc }]}>App config</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={as.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
          <Text style={as.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const as = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { padding: 20 },
  greeting: { fontWeight: 'bold' },
  sub: { marginTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 8 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11 },
  sec: { fontWeight: 'bold', marginBottom: 12, marginTop: 10, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  ct: { fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  cs: { marginTop: 4, textAlign: 'center' },
  dot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D85A30', borderWidth: 1, borderColor: '#1a1a2e' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});