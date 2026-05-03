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
  return (<View><Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications" size={30} color={color} /></Animated.View>{hasNotif && <View style={ss.dot} />}</View>);
}

// All icon components accept color prop
const I = ({ name, color, anim }: { name: string; color: string; anim?: any }) => (
  <Animated.View style={anim}><Ionicons name={name as any} size={30} color={color} /></Animated.View>
);

function usePulse() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1.2, duration: 700, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true })])).start(); }, []); return { transform: [{ scale: v }] }; }
function useBounce() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: -5, duration: 400, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return { transform: [{ translateY: v }] }; }
function useSpin() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2500), Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2500)])).start(); }, []); return { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }; }
function useWiggle() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true })])).start(); }, []); return { transform: [{ rotate: v.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }) }] }; }
function useFlip() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 0.1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0.1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ scaleX: v }] }; }
function useSlide() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 4, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ translateX: v }] }; }

export default function StudentHome() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [hasNotif, setHasNotif] = useState(false);
  const [isMonitor, setIsMonitor] = useState(false);
  const theme = useAppTheme();

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) { const s = JSON.parse(saved); setStudent(s); checkNotifications(); checkIfMonitor(s.id); }
    } catch (e) {}
  };

  const checkNotifications = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', 0);
    setHasNotif((count || 0) > 0);
  };

  const checkIfMonitor = async (sid: string) => {
    const { data } = await supabase.from('venue_monitors').select('id').eq('student_id', sid).maybeSingle();
    setIsMonitor(!!data);
  };

  const handleLogout = async () => { await AsyncStorage.removeItem('current_student'); router.replace('/'); };
  const handleShare = async () => { await Share.share({ message: 'Check out Campus IQ!', title: 'Campus IQ' }); };
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  const isLight = theme.themeName === 'light';
  const fs = theme.fontSize;
  const ic = isLight ? '#1a1a2e' : '#FFD700'; // icon color
  const bg = isLight ? '#f4f6fb' : '#001f4d';
  const headerBg = isLight ? '#1a4a2e' : '#0a3d2e';
  const tc = isLight ? '#1a1a2e' : '#ffffff'; // text color
  const sc = isLight ? '#334455' : '#a0c4ff'; // sub color
  const sec = isLight ? '#1a1a2e' : '#FFD700'; // section title

  // Card styles — same original colours, just lighter bg in light mode
  const G = { bg: isLight ? '#d4edda' : '#0a3d2e', b: '#1D9E75' }; // green
  const P = { bg: isLight ? '#e8e0ff' : '#1a1650', b: '#534AB7' }; // purple
  const O = { bg: isLight ? '#fde8d8' : '#2a1500', b: '#D85A30' }; // orange
  const D = { bg: isLight ? '#e8edf4' : '#0a1a2e', b: isLight ? '#7a9acc' : '#a0c4ff' }; // dark
  const E = { bg: '#3d1a0a', b: '#D85A30' }; // emergency always dark

  const c = (p: { bg: string; b: string }) => [ss.card, { backgroundColor: p.bg, borderColor: p.b }];

  const pulse = usePulse(); const bounce = useBounce(); const spin = useSpin();
  const wiggle = useWiggle(); const flip = useFlip(); const slide = useSlide();

  return (
    <ScrollView style={[ss.container, { backgroundColor: bg }]}>
      <View style={[ss.header, { backgroundColor: headerBg }]}>
        <View>
          <Text style={[ss.greeting, { color: '#FFD700', fontSize: fs + 6 }]}>{greeting()}, {student?.name || 'Student'}!</Text>
          <Text style={[ss.sub, { color: '#a0c4ff', fontSize: fs - 1 }]}>{student?.reg_number || 'Midlands State University'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/app-settings')}>
            <Ionicons name="settings-outline" size={22} color="#a0c4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={[ss.avatar, { backgroundColor: '#0a3d2e', borderColor: '#1D9E75' }]} onPress={() => router.push('/profile-student')}>
            <Ionicons name="person" size={28} color="#1D9E75" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={ss.content}>
        <Text style={[ss.sec, { color: sec, fontSize: fs + 1 }]}>Academic</Text>
        <View style={ss.row}>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/my-classes')}><I name="school" color={ic} anim={pulse} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>My Classes</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Enroll & timetable</Text></TouchableOpacity>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/scan-attendance')}><I name="qr-code" color={ic} anim={spin} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Attendance</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Scan QR code</Text></TouchableOpacity>
        </View>
        <View style={ss.row}>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/my-notes')}><I name="document-text" color={ic} anim={flip} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>My Notes</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Notes & materials</Text></TouchableOpacity>
          <TouchableOpacity style={c(G)} onPress={() => router.push('/manage-venues')}><I name="location" color={ic} anim={bounce} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Venues</Text><Text style={[ss.cs, { fontSize: fs - 4, color: isMonitor ? '#1D9E75' : sc }]}>{isMonitor ? 'Monitor assigned' : 'View free rooms'}</Text></TouchableOpacity>
        </View>

        <Text style={[ss.sec, { color: sec, fontSize: fs + 1 }]}>Quizzes</Text>
        <View style={ss.row}>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/quiz-msu')}><I name="school" color={ic} anim={pulse} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>MSU Quiz</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>About MSU</Text></TouchableOpacity>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/quiz-program')}><I name="book" color={ic} anim={flip} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Program Quiz</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Your course</Text></TouchableOpacity>
        </View>
        <View style={ss.row}>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/quiz-didyouknow')}><I name="globe" color={ic} anim={spin} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Did You Know</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Global facts</Text></TouchableOpacity>
          <TouchableOpacity style={c(P)} onPress={() => router.push('/quiz-set')}><I name="clipboard" color={ic} anim={pulse} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Set Quizzes</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>By lecturers</Text></TouchableOpacity>
        </View>

        <Text style={[ss.sec, { color: sec, fontSize: fs + 1 }]}>Tools</Text>
        <View style={ss.row}>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/plan-my-day')}><I name="today" color={ic} anim={wiggle} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Plan My Day</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Diary & planner</Text></TouchableOpacity>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/chat')}><I name="chatbubbles" color={ic} anim={pulse} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Chat</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Student chat</Text></TouchableOpacity>
        </View>
        <View style={ss.row}>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/games')}><I name="game-controller" color={ic} anim={wiggle} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Games</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Play offline</Text></TouchableOpacity>
          <TouchableOpacity style={c(O)} onPress={() => router.push('/anonymous-report')}><I name="shield-checkmark" color={ic} anim={pulse} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Report</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Anonymous</Text></TouchableOpacity>
        </View>

        <Text style={[ss.sec, { color: sec, fontSize: fs + 1 }]}>Campus Life</Text>
        <View style={ss.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/msu-radio')}><I name="radio" color={ic} anim={pulse} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>MSU Radio</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Listen live</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/campus-map')}><I name="map" color={ic} anim={bounce} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Campus Maps</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Find your way</Text></TouchableOpacity>
        </View>
        <View style={ss.row}>
          <TouchableOpacity style={c(D)} onPress={() => { router.push('/notifications'); setHasNotif(false); }}>
            <Bell hasNotif={hasNotif} color={ic} />
            <Text style={[ss.ct, { fontSize: fs, color: tc }]}>Notifications</Text>
            <Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Updates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/lost-found')}><I name="search" color={ic} anim={wiggle} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Lost & Found</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Find lost items</Text></TouchableOpacity>
        </View>
        <View style={ss.row}>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/src-elections')}><I name="people" color={ic} anim={bounce} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>SRC Elections</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Vote now</Text></TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={handleShare}><I name="share-social" color={ic} anim={spin} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Share App</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Invite friends</Text></TouchableOpacity>
        </View>
        <View style={ss.row}>
          <TouchableOpacity style={c(E)} onPress={() => router.push('/emergency-services')}>
            <I name="medical" color="#D85A30" anim={pulse} />
            <Text style={[ss.ct, { fontSize: fs, color: '#ffffff' }]}>Emergency</Text>
            <Text style={[ss.cs, { fontSize: fs - 4, color: '#F0997B' }]}>Campus services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={c(D)} onPress={() => router.push('/app-settings')}><I name="settings" color={ic} anim={spin} /><Text style={[ss.ct, { fontSize: fs, color: tc }]}>Settings</Text><Text style={[ss.cs, { fontSize: fs - 4, color: sc }]}>Personalise app</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={ss.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
          <Text style={ss.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const ss = StyleSheet.create({
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