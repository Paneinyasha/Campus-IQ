import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';
import { useAppTheme } from './_layout';

function AB({ name, anim, style }: any) { return <Animated.View style={style}><Ionicons name={name} size={30} color="#FFD700" /></Animated.View>; }
function AnimatedBell({ hasNotif }: { hasNotif: boolean }) { const w = useRef(new Animated.Value(0)).current; useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(w, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(w, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(w, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(w, { toValue: 0, duration: 80, useNativeDriver: true }), Animated.delay(hasNotif ? 1500 : 4000)])); a.start(); return () => a.stop(); }, [hasNotif]); const rotate = w.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] }); return (<View><Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications" size={30} color="#FFD700" /></Animated.View>{hasNotif && <View style={sStyles.notifDot} />}</View>); }
function AR() { const p = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1.25, duration: 500, useNativeDriver: true }), Animated.timing(p, { toValue: 1, duration: 500, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: p }] }}><Ionicons name="radio" size={30} color="#FFD700" /></Animated.View>; }
function AC() { const b = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(b, { toValue: -6, duration: 400, useNativeDriver: true }), Animated.timing(b, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return <Animated.View style={{ transform: [{ translateY: b }] }}><Ionicons name="calendar" size={30} color="#FFD700" /></Animated.View>; }
function AQ() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(s, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(3000), Animated.timing(s, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(3000)])).start(); }, []); const rotate = s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="qr-code" size={30} color="#FFD700" /></Animated.View>; }
function ABk() { const f = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(f, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.timing(f, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(f, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.timing(f, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); const scaleX = f.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }); return <Animated.View style={{ transform: [{ scaleX }] }}><Ionicons name="document-text" size={30} color="#FFD700" /></Animated.View>; }
function AG() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.timing(s, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start(); }, []); const rotate = s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="globe" size={30} color="#FFD700" /></Animated.View>; }
function ACl() { const b = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(1500), Animated.timing(b, { toValue: 1.2, duration: 200, useNativeDriver: true }), Animated.timing(b, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(b, { toValue: 1.2, duration: 200, useNativeDriver: true }), Animated.timing(b, { toValue: 1, duration: 200, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: b }] }}><Ionicons name="clipboard" size={30} color="#FFD700" /></Animated.View>; }
function ATd() { const r = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(r, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.timing(r, { toValue: 0, duration: 500, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); const rot = r.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] }); return <Animated.View style={{ transform: [{ rotate: rot }] }}><Ionicons name="today" size={30} color="#FFD700" /></Animated.View>; }
function ACh() { const s = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(s, { toValue: 1.2, duration: 200, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 200, useNativeDriver: true }), Animated.timing(s, { toValue: 1.2, duration: 200, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 200, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: s }] }}><Ionicons name="chatbubbles" size={30} color="#FFD700" /></Animated.View>; }
function AGm() { const w = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(3000), Animated.timing(w, { toValue: 1, duration: 100, useNativeDriver: true }), Animated.timing(w, { toValue: -1, duration: 100, useNativeDriver: true }), Animated.timing(w, { toValue: 1, duration: 100, useNativeDriver: true }), Animated.timing(w, { toValue: 0, duration: 100, useNativeDriver: true })])).start(); }, []); const rotate = w.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="game-controller" size={30} color="#FFD700" /></Animated.View>; }
function ASh() { const p = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1.15, duration: 800, useNativeDriver: true }), Animated.timing(p, { toValue: 1, duration: 800, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: p }] }}><Ionicons name="shield-checkmark" size={30} color="#FFD700" /></Animated.View>; }
function AMap() { const d = useRef(new Animated.Value(-4)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(d, { toValue: 4, duration: 600, useNativeDriver: true }), Animated.timing(d, { toValue: -4, duration: 600, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return <Animated.View style={{ transform: [{ translateY: d }] }}><Ionicons name="map" size={30} color="#FFD700" /></Animated.View>; }
function ASr() { const r = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(r, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.timing(r, { toValue: -1, duration: 400, useNativeDriver: true }), Animated.timing(r, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(3000)])).start(); }, []); const rot = r.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }); return <Animated.View style={{ transform: [{ rotate: rot }] }}><Ionicons name="search" size={30} color="#FFD700" /></Animated.View>; }
function APe() { const w = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(w, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(w, { toValue: 0, duration: 300, useNativeDriver: true })])).start(); }, []); const translateY = w.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }); return <Animated.View style={{ transform: [{ translateY }] }}><Ionicons name="people" size={30} color="#FFD700" /></Animated.View>; }
function AShr() { const s = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(3000), Animated.timing(s, { toValue: 1, duration: 600, useNativeDriver: true }), Animated.timing(s, { toValue: 0, duration: 0, useNativeDriver: true })])).start(); }, []); const rotate = s.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="share-social" size={30} color="#FFD700" /></Animated.View>; }
function ALoc() { const b = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(b, { toValue: -6, duration: 300, useNativeDriver: true }), Animated.timing(b, { toValue: 0, duration: 300, useNativeDriver: true }), Animated.delay(2500)])).start(); }, []); return <Animated.View style={{ transform: [{ translateY: b }] }}><Ionicons name="location" size={30} color="#FFD700" /></Animated.View>; }
function ASc() { const s = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(s, { toValue: 1.2, duration: 300, useNativeDriver: true }), Animated.timing(s, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); return <Animated.View style={{ transform: [{ scale: s }] }}><Ionicons name="school" size={30} color="#FFD700" /></Animated.View>; }
function AMed() { const p = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1.2, duration: 400, useNativeDriver: true }), Animated.timing(p, { toValue: 1, duration: 400, useNativeDriver: true }), Animated.delay(1000)])).start(); }, []); return <Animated.View style={{ transform: [{ scale: p }] }}><Ionicons name="medical" size={30} color="#D85A30" /></Animated.View>; }
function ASet() { const r = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(4000), Animated.timing(r, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true })])).start(); }, []); const rotate = r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }); return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="settings" size={30} color="#FFD700" /></Animated.View>; }

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
      if (saved) {
        const s = JSON.parse(saved);
        setStudent(s);
        checkNotifications();
        checkIfMonitor(s.id);
      }
    } catch (e) {}
  };

  const checkNotifications = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', 0);
    setHasNotif((count || 0) > 0);
  };

  const checkIfMonitor = async (studentId: string) => {
    const { data } = await supabase.from('venue_monitors').select('id').eq('student_id', studentId).maybeSingle();
    setIsMonitor(!!data);
  };

  const handleLogout = async () => { await AsyncStorage.removeItem('current_student'); router.replace('/'); };
  const handleShare = async () => { await Share.share({ message: 'Check out Campus IQ — the smart campus companion for MSU students!', title: 'Campus IQ - MSU' }); };
  const getTimeGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };

  const fs = theme.fontSize;
  const bg = theme.isDark ? '#001f4d' : '#f0f4f8';
  const cardGreen = theme.isDark ? '#0a3d2e' : '#d4edda';
  const cardPurple = theme.isDark ? '#1a1650' : '#e8e0ff';
  const cardOrange = theme.isDark ? '#2a1500' : '#fde8d8';
  const cardDark = theme.isDark ? '#0a1a2e' : '#e8edf4';
  const borderGreen = '#1D9E75';
  const borderPurple = '#534AB7';
  const borderOrange = '#D85A30';
  const borderDark = theme.isDark ? '#a0c4ff' : '#8899bb';
  const textColor = theme.isDark ? '#ffffff' : '#001f4d';
  const subColor = theme.isDark ? '#a0c4ff' : '#334466';

  const card = (bg2: string, border: string) => [sStyles.card, { backgroundColor: bg2, borderColor: border }];

  return (
    <ScrollView style={[sStyles.container, { backgroundColor: bg }]}>
      <View style={[sStyles.header, { backgroundColor: theme.isDark ? '#0a3d2e' : '#1a4a2e' }]}>
        <View>
          <Text style={[sStyles.greeting, { fontSize: fs + 6, color: '#FFD700' }]}>{getTimeGreeting()}, {student ? student.name : 'Student'}!</Text>
          <Text style={[sStyles.subgreeting, { fontSize: fs - 1, color: '#a0c4ff' }]}>{student ? student.reg_number : 'Midlands State University'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/app-settings')}>
            <Ionicons name="settings-outline" size={22} color="#a0c4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={[sStyles.avatar, { borderColor: borderGreen }]} onPress={() => router.push('/profile-student')}>
            <Ionicons name="person" size={28} color="#1D9E75" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={sStyles.content}>
        <Text style={[sStyles.sec, { fontSize: fs + 2 }]}>Academic</Text>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardGreen, borderGreen)} onPress={() => router.push('/my-classes')}><ASc /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>My Classes</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Enroll & timetable</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardGreen, borderGreen)} onPress={() => router.push('/scan-attendance')}><AQ /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Attendance</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Scan QR code</Text></TouchableOpacity>
        </View>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardGreen, borderGreen)} onPress={() => router.push('/my-notes')}><ABk /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>My Notes</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Notes & materials</Text></TouchableOpacity>
          {isMonitor ? (
            <TouchableOpacity style={card(cardGreen, borderGreen)} onPress={() => router.push('/manage-venues')}><ALoc /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Venues</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: '#1D9E75' }]}>Monitor assigned</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity style={card(cardGreen, borderGreen)} onPress={() => router.push('/manage-venues')}><ALoc /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Venues</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>View free rooms</Text></TouchableOpacity>
          )}
        </View>

        <Text style={[sStyles.sec, { fontSize: fs + 2 }]}>Quizzes</Text>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardPurple, borderPurple)} onPress={() => router.push('/quiz-msu')}><ASc /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>MSU Quiz</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>About MSU</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardPurple, borderPurple)} onPress={() => router.push('/quiz-program')}><ABk /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Program Quiz</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Your course</Text></TouchableOpacity>
        </View>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardPurple, borderPurple)} onPress={() => router.push('/quiz-didyouknow')}><AG /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Did You Know</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Global facts</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardPurple, borderPurple)} onPress={() => router.push('/quiz-set')}><ACl /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Set Quizzes</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>By lecturers</Text></TouchableOpacity>
        </View>

        <Text style={[sStyles.sec, { fontSize: fs + 2 }]}>Tools</Text>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardOrange, borderOrange)} onPress={() => router.push('/plan-my-day')}><ATd /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Plan My Day</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Diary & planner</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardOrange, borderOrange)} onPress={() => router.push('/chat')}><ACh /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Chat</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Student chat</Text></TouchableOpacity>
        </View>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardOrange, borderOrange)} onPress={() => router.push('/games')}><AGm /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Games</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Play offline</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardOrange, borderOrange)} onPress={() => router.push('/anonymous-report')}><ASh /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Report</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Anonymous</Text></TouchableOpacity>
        </View>

        <Text style={[sStyles.sec, { fontSize: fs + 2 }]}>Campus Life</Text>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={() => router.push('/msu-radio')}><AR /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>MSU Radio</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Listen live</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={() => router.push('/campus-map')}><AMap /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Campus Maps</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Find your way</Text></TouchableOpacity>
        </View>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={() => { router.push('/notifications'); setHasNotif(false); }}><AnimatedBell hasNotif={hasNotif} /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Notifications</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Updates</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={() => router.push('/lost-found')}><ASr /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Lost & Found</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Find lost items</Text></TouchableOpacity>
        </View>
        <View style={sStyles.row}>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={() => router.push('/src-elections')}><APe /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>SRC Elections</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Vote now</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={handleShare}><AShr /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Share App</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Invite friends</Text></TouchableOpacity>
        </View>
        <View style={sStyles.row}>
          <TouchableOpacity style={[sStyles.card, { backgroundColor: '#3d1a0a', borderColor: '#D85A30' }]} onPress={() => router.push('/emergency-services')}><AMed /><Text style={[sStyles.ct, { fontSize: fs, color: '#ffffff' }]}>Emergency</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: '#F0997B' }]}>Campus services</Text></TouchableOpacity>
          <TouchableOpacity style={card(cardDark, borderDark)} onPress={() => router.push('/app-settings')}><ASet /><Text style={[sStyles.ct, { fontSize: fs, color: textColor }]}>Settings</Text><Text style={[sStyles.cs, { fontSize: fs - 4, color: subColor }]}>Personalise app</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={sStyles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
          <Text style={sStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const sStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { padding: 20 },
  greeting: { fontWeight: 'bold' },
  subgreeting: { marginTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0a3d2e', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  sec: { fontWeight: 'bold', color: '#FFD700', marginBottom: 12, marginTop: 10, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  ct: { fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  cs: { marginTop: 4, textAlign: 'center' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D85A30', borderWidth: 1, borderColor: '#001f4d' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});