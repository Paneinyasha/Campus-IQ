import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';
import { useAppTheme } from './_layout';

function Bell({ hasNotif, color }: { hasNotif: boolean; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true }), Animated.delay(hasNotif ? 1500 : 4000)])); a.start(); return () => a.stop(); }, [hasNotif]);
  const rotate = v.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });
  return (<View><Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications" size={30} color={color} /></Animated.View>{hasNotif && <View style={ls.dot} />}</View>);
}

const I = ({ name, color, anim }: { name: string; color: string; anim?: any }) => (
  <Animated.View style={anim}><Ionicons name={name as any} size={30} color={color} /></Animated.View>
);

function usePulse() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1.2, duration: 700, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true })])).start(); }, []); return { transform: [{ scale: v }] }; }
function useBounce() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: -5, duration: 400, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return { transform: [{ translateY: v }] }; }
function useSpin() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2500), Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2500)])).start(); }, []); return { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }; }
function useWiggle() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true })])).start(); }, []); return { transform: [{ rotate: v.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }) }] }; }
function useFlip() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 0.1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0.1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ scaleX: v }] }; }
function useSlide() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 4, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ translateX: v }] }; }

export default function LecturerHome() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<any>(null);
  const [hasNotif, setHasNotif] = useState(false);
  const theme = useAppTheme();

  useEffect(() => { loadLecturer(); }, []);

  const loadLecturer = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_lecturer');
      if (saved) { setLecturer(JSON.parse(saved)); checkNotifications(); }
    } catch (e) {}
  };

  const checkNotifications = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', 0);
    setHasNotif((count || 0) > 0);
  };

  const handleLogout = async () => { await AsyncStorage.removeItem('current_lecturer'); router.replace('/'); };
  const handleShare = async () => { await Share.share({ message: 'Check out Campus IQ!', title: 'Campus IQ' }); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  const isLight = theme.themeName === 'light';
  const fs = theme.fontSize;
  const ic = isLight ? '#1a1a2e' : '#FFD700'; // icon color — black in light, gold in dark
  const bg = isLight ? '#f4f6fb' : '#001f4d';
  const headerBg = isLight ? '#1a1650' : '#0a2a4a';
  const tc = isLight ? '#1a1a2e' : '#ffffff';
  const sc = isLight ? '#334455' : '#a0c4ff';
  const sec = isLight ? '#1a1a2e' : '#FFD700';

  // Teaching: blue as requested
  const B = { bg: isLight ? '#e0eaff' : '#0d2151', b: '#3B7DD8' };
  // Original colours for all other sections
  const G = { bg: isLight ? '#d4edda' : '#0a3d2e', b: '#1D9E75' };
  const P = { bg: isLight ? '#e8e0ff' : '#1a1650', b: '#534AB7' };
  const O = { bg: isLight ? '#fde8d8' : '#2a1500', b: '#D85A30' };
  const D = { bg: isLight ? '#e8edf4' : '#0a1a2e', b: isLight ? '#7a9acc' : '#a0c4ff' };
  const E = { bg: '#3d1a0a', b: '#D85A30' };

  const c = (p: { bg: string; b: string }) => [ls.card, { backgroundColor: p.bg, borderColor: p.b }];

  const pulse = usePulse(); const bounce = useBounce(); const spin = useSpin();
  const wiggle = useWiggle(); const flip = useFlip(); const slide = useSlide();

  return (
    <ScrollView style={[ls.container, { backgroundColor: bg }]}>
      <View style={[ls.header, { backgroundColor: headerBg }]}>
        <View>
          <Text style={[ls.greeting, { color: '#FFD700', fontSize: fs + 6 }]}>{greeting()}, {lecturer?.name || 'Lecturer'}!</Text>
          <Text style={[ls.sub, { color: '#a0c4ff', fontSize: fs - 1 }]}>{lecturer?.department || 'Midlands State University'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/app-settings')}>
            <Ionicons name="settings-outline" size={22} color="#a0c4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={[ls.avatar, { backgroundColor: '#1a1650', borderColor: '#534AB7' }]} onPress={() => router.push('/profile-lecturer')}>
            <Ionicons name="book" size={28} color={isLight ? '#7C5CBF' : '#a07fe8'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={ls.content}>
        {/* TEACHING — blue */}
        <Text style={[ls.sec, { color: sec, fontSize: fs + 1 }]}>Teaching</Text>
        <View style={ls.row}>
          <TouchableOpacity style={c(B)} onPress={() => router.push('/manage-timetable')}><I name="calendar" color={ic} anim={bounce} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Timetable</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Teaching schedule</Text></TouchableOpacity>
          <TouchableOpacity style={c(B)} onPress={() => router.push('/manage-classes')}><I name="school" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Classroom</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Classes & students</Text></TouchableOpacity>
        </View>
        <View style={ls.row}>
          <TouchableOpacity style={c(B)} onPress={() => router.push('/manage-venues')}><I name="location" color={ic} anim={bounce} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Venues</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Find free rooms</Text></TouchableOpacity>
          <TouchableOpacity style={c(B)} onPress={() => router.push('/my-notes')}><I name="document-text" color={ic} anim={flip} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Materials</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Upload docs</Text></TouchableOpacity>
        </View>

        {/* ATTENDANCE — green */}
        <Text style={[ls.sec, { color: sec, fontSize: fs + 1 }]}>Attendance</Text>
        <View style={ls.row}>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/generate-qr')}><I name="qr-code" color={ic} anim={spin} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Generate QR</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Start session</Text></TouchableOpacity>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/generate-qr')}><I name="list" color={ic} anim={slide} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Register</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>View attendance</Text></TouchableOpacity>
        </View>
        <View style={ls.row}>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/generate-qr')}><I name="bar-chart" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Reports</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Attendance stats</Text></TouchableOpacity>
          <View style={[ls.card, { backgroundColor: 'transparent', borderWidth: 0 }]} />
        </View>

        {/* QUIZZES — orange */}
        <Text style={[ls.sec, { color: sec, fontSize: fs + 1 }]}>Quizzes</Text>
        <View style={ls.row}>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/create-quiz')}><I name="add-circle" color={ic} anim={spin} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Create Quiz</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Set for students</Text></TouchableOpacity>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/quiz-results')}><I name="stats-chart" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Quiz Results</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>View scores</Text></TouchableOpacity>
        </View>

        {/* COMMUNICATION — dark */}
        <Text style={[ls.sec, { color: sec, fontSize: fs + 1 }]}>Communication</Text>
        <View style={ls.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/broadcast')}><I name="megaphone" color={ic} anim={wiggle} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Notify Students</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Send updates</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/chat')}><I name="chatbubbles" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Chat</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Student messages</Text></TouchableOpacity>
        </View>
        <View style={ls.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/my-notes')}><I name="document-text" color={ic} anim={flip} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Study Notes</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Upload materials</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/anonymous-report')}><I name="shield-checkmark" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Reports</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Anonymous reports</Text></TouchableOpacity>
        </View>

        {/* PERSONAL — purple */}
        <Text style={[ls.sec, { color: sec, fontSize: fs + 1 }]}>Personal</Text>
        <View style={ls.row}>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/plan-my-day')}><I name="today" color={ic} anim={wiggle} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Plan My Day</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Diary & tasks</Text></TouchableOpacity>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/generate-qr')}><I name="bar-chart" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>My Reports</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Attendance stats</Text></TouchableOpacity>
        </View>
        <View style={ls.row}>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/games')}><I name="game-controller" color={ic} anim={wiggle} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Games</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Play offline</Text></TouchableOpacity>
          <View style={[ls.card, { backgroundColor: 'transparent', borderWidth: 0 }]} />
        </View>

        {/* CAMPUS LIFE — dark */}
        <Text style={[ls.sec, { color: sec, fontSize: fs + 1 }]}>Campus Life</Text>
        <View style={ls.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/msu-radio')}><I name="radio" color={ic} anim={pulse} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>MSU Radio</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Listen live</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/campus-map')}><I name="map" color={ic} anim={bounce} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Campus Map</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Navigate campus</Text></TouchableOpacity>
        </View>
        <View style={ls.row}>
          <TouchableOpacity style={c(D)} onPress={() => { router.push('/notifications'); setHasNotif(false); }}>
            <Bell hasNotif={hasNotif} color={ic} />
            <Text style={[ls.ct, { fontSize: fs, color: tc }]}>Notifications</Text>
            <Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Updates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/lost-found')}><I name="search" color={ic} anim={wiggle} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Lost & Found</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Report items</Text></TouchableOpacity>
        </View>
        <View style={ls.row}>
          <TouchableOpacity style={c(E)} onPress={() => router.push('/emergency-services')}>
            <I name="medical" color="#D85A30" anim={pulse} />
            <Text style={[ls.ct, { fontSize: fs, color: '#ffffff' }]}>Emergency</Text>
            <Text style={[ls.cs, { fontSize: fs - 4, color: '#F0997B' }]}>Campus services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/app-settings')}><I name="settings" color={ic} anim={spin} /><Text style={[ls.ct, { fontSize: fs, color: tc }]}>Settings</Text><Text style={[ls.cs, { fontSize: fs - 4, color: sc }]}>Personalise app</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={ls.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
          <Text style={ls.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const ls = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { padding: 20 },
  greeting: { fontWeight: 'bold' },
  sub: { marginTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  sec: { fontWeight: 'bold', marginBottom: 12, marginTop: 10, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  ct: { fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  cs: { marginTop: 4, textAlign: 'center' },
  dot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D85A30', borderWidth: 1, borderColor: '#001f4d' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});