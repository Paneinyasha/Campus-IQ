import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';
import { useAppTheme } from './_layout';

function usePulse() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1.2, duration: 600, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 600, useNativeDriver: true })])).start(); }, []); return { transform: [{ scale: v }] }; }
function useBounce() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: -5, duration: 400, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); return { transform: [{ translateY: v }] }; }
function useSpin() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2000), Animated.timing(v, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.delay(2000)])).start(); }, []); const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }); return { transform: [{ rotate }] }; }
function useWiggle() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2500), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true })])).start(); }, []); const rotate = v.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }); return { transform: [{ rotate }] }; }
function useFlip() { const v = useRef(new Animated.Value(1)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 0.1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0.1, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ scaleX: v }] }; }
function useSlide() { const v = useRef(new Animated.Value(0)).current; useEffect(() => { Animated.loop(Animated.sequence([Animated.delay(2000), Animated.timing(v, { toValue: 4, duration: 300, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 300, useNativeDriver: true })])).start(); }, []); return { transform: [{ translateX: v }] }; }

function AnimatedBell({ hasNotif, color }: { hasNotif: boolean; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: -1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: true }), Animated.delay(hasNotif ? 1500 : 4000)])); a.start(); return () => a.stop(); }, [hasNotif]);
  const rotate = v.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });
  return (<View><Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="notifications" size={28} color={color} /></Animated.View>{hasNotif && <View style={lStyles.notifDot} />}</View>);
}

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
  const handleShare = async () => { await Share.share({ message: 'Check out Campus IQ — the smart campus companion for MSU!', title: 'Campus IQ - MSU' }); };
  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

  const isLight = theme.themeName === 'light';
  const fs = theme.fontSize;
  const bg = isLight ? '#f4f6fb' : '#001f4d';
  const headerBg = isLight ? '#1a1650' : '#0a2a4a';
  const textColor = isLight ? '#1a1a2e' : '#ffffff';
  const subColor = isLight ? '#334455' : '#a0c4ff';

  const PALETTES = {
    teal:   { bg: isLight ? '#e0f5ef' : '#0a3d2e', border: '#1D9E75', icon: isLight ? '#0a7a50' : '#1D9E75' },
    blue:   { bg: isLight ? '#e0eaff' : '#0d2151', border: '#3B7DD8', icon: isLight ? '#1a4ab0' : '#5a9fff' },
    purple: { bg: isLight ? '#ece6ff' : '#1a1650', border: '#7C5CBF', icon: isLight ? '#5a3da0' : '#a07fe8' },
    orange: { bg: isLight ? '#fff0e0' : '#2a1500', border: '#D8832A', icon: isLight ? '#b06010' : '#EF9F27' },
    rose:   { bg: isLight ? '#fde8ee' : '#2d0a14', border: '#D84A6A', icon: isLight ? '#b02040' : '#F07090' },
    slate:  { bg: isLight ? '#e8edf4' : '#0a1a2e', border: isLight ? '#7a9acc' : '#a0c4ff', icon: isLight ? '#445577' : '#a0c4ff' },
    red:    { bg: '#3d1a0a', border: '#D85A30', icon: '#D85A30' },
    cyan:   { bg: isLight ? '#e0f8ff' : '#002a35', border: '#00A8CC', icon: isLight ? '#006688' : '#00c8ee' },
    lime:   { bg: isLight ? '#f0ffe0' : '#1a2e00', border: '#6AAF00', icon: isLight ? '#4a8000' : '#90d020' },
    amber:  { bg: isLight ? '#fff8e0' : '#2a2000', border: '#C4A000', icon: isLight ? '#9a7800' : '#FFD700' },
  };

  const C = (p: keyof typeof PALETTES) => [lStyles.card, { backgroundColor: PALETTES[p].bg, borderColor: PALETTES[p].border }];
  const icon = (name: string, p: keyof typeof PALETTES, anim?: any) => (
    <Animated.View style={anim || {}}><Ionicons name={name as any} size={28} color={PALETTES[p].icon} /></Animated.View>
  );

  const pulse = usePulse(); const bounce = useBounce(); const spin = useSpin();
  const wiggle = useWiggle(); const flip = useFlip(); const slide = useSlide();

  return (
    <ScrollView style={[lStyles.container, { backgroundColor: bg }]}>
      <View style={[lStyles.header, { backgroundColor: headerBg }]}>
        <View>
          <Text style={[lStyles.greeting, { color: '#FFD700', fontSize: fs + 6 }]}>{getGreeting()}, {lecturer?.name || 'Lecturer'}!</Text>
          <Text style={[lStyles.sub, { color: '#a0c4ff', fontSize: fs - 1 }]}>{lecturer?.department || 'Midlands State University'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/app-settings')}>
            <Ionicons name="settings-outline" size={22} color="#a0c4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={[lStyles.avatar, { backgroundColor: '#1a1650', borderColor: '#534AB7' }]} onPress={() => router.push('/profile-lecturer')}>
            <Ionicons name="book" size={26} color={isLight ? '#9b7fe8' : '#a07fe8'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={lStyles.content}>
        {/* TEACHING — all same colour: blue */}
        <Text style={[lStyles.sec, { color: isLight ? '#334455' : '#FFD700', fontSize: fs + 1 }]}>Teaching</Text>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('blue')} onPress={() => router.push('/manage-timetable')}>{icon('calendar', 'blue', bounce)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Timetable</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Teaching schedule</Text></TouchableOpacity>
          <TouchableOpacity style={C('blue')} onPress={() => router.push('/manage-classes')}>{icon('school', 'blue', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Classroom</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Classes & students</Text></TouchableOpacity>
        </View>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('blue')} onPress={() => router.push('/manage-venues')}>{icon('location', 'blue', bounce)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Venues</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Find free rooms</Text></TouchableOpacity>
          <TouchableOpacity style={C('blue')} onPress={() => router.push('/my-notes')}>{icon('document-text', 'blue', flip)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Materials</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Upload docs</Text></TouchableOpacity>
        </View>

        {/* ATTENDANCE — teal */}
        <Text style={[lStyles.sec, { color: isLight ? '#334455' : '#FFD700', fontSize: fs + 1 }]}>Attendance</Text>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('teal')} onPress={() => router.push('/generate-qr')}>{icon('qr-code', 'teal', spin)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Generate QR</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Start session</Text></TouchableOpacity>
          <TouchableOpacity style={C('teal')} onPress={() => router.push('/generate-qr')}>{icon('list', 'teal', slide)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Register</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>View attendance</Text></TouchableOpacity>
        </View>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('teal')} onPress={() => router.push('/generate-qr')}>{icon('bar-chart', 'teal', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Reports</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Attendance stats</Text></TouchableOpacity>
          <View style={[lStyles.card, { backgroundColor: 'transparent', borderWidth: 0 }]} />
        </View>

        {/* QUIZZES — purple */}
        <Text style={[lStyles.sec, { color: isLight ? '#334455' : '#FFD700', fontSize: fs + 1 }]}>Quizzes</Text>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('purple')} onPress={() => router.push('/create-quiz')}>{icon('add-circle', 'purple', spin)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Create Quiz</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Set for students</Text></TouchableOpacity>
          <TouchableOpacity style={C('purple')} onPress={() => router.push('/quiz-results')}>{icon('stats-chart', 'purple', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Quiz Results</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>View scores</Text></TouchableOpacity>
        </View>

        {/* COMMUNICATION — orange */}
        <Text style={[lStyles.sec, { color: isLight ? '#334455' : '#FFD700', fontSize: fs + 1 }]}>Communication</Text>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('orange')} onPress={() => router.push('/broadcast')}>{icon('megaphone', 'orange', wiggle)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Notify Students</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Send updates</Text></TouchableOpacity>
          <TouchableOpacity style={C('orange')} onPress={() => router.push('/chat')}>{icon('chatbubbles', 'orange', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Chat</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Student messages</Text></TouchableOpacity>
        </View>

        {/* PERSONAL — cyan and lime (new unique colours) */}
        <Text style={[lStyles.sec, { color: isLight ? '#334455' : '#FFD700', fontSize: fs + 1 }]}>Personal</Text>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('cyan')} onPress={() => router.push('/plan-my-day')}>{icon('today', 'cyan', wiggle)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Plan My Day</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Diary & tasks</Text></TouchableOpacity>
          <TouchableOpacity style={C('lime')} onPress={() => router.push('/generate-qr')}>{icon('bar-chart', 'lime', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>My Reports</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Attendance stats</Text></TouchableOpacity>
        </View>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('amber')} onPress={() => router.push('/games')}>{icon('game-controller', 'amber', wiggle)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Games</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Play offline</Text></TouchableOpacity>
          <TouchableOpacity style={C('slate')} onPress={() => router.push('/anonymous-report')}>{icon('shield-checkmark', 'slate', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Reports</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Anonymous</Text></TouchableOpacity>
        </View>

        {/* CAMPUS LIFE — rose & slate */}
        <Text style={[lStyles.sec, { color: isLight ? '#334455' : '#FFD700', fontSize: fs + 1 }]}>Campus Life</Text>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('rose')} onPress={() => router.push('/msu-radio')}>{icon('radio', 'rose', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>MSU Radio</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Listen live</Text></TouchableOpacity>
          <TouchableOpacity style={C('slate')} onPress={() => router.push('/campus-map')}>{icon('map', 'slate', bounce)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Campus Map</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Navigate campus</Text></TouchableOpacity>
        </View>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('slate')} onPress={() => { router.push('/notifications'); setHasNotif(false); }}>
            <AnimatedBell hasNotif={hasNotif} color={PALETTES['slate'].icon} />
            <Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Notifications</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Updates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={C('slate')} onPress={handleShare}>{icon('share-social', 'slate', spin)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Share App</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Invite others</Text></TouchableOpacity>
        </View>
        <View style={lStyles.row}>
          <TouchableOpacity style={C('red')} onPress={() => router.push('/emergency-services')}>{icon('medical', 'red', pulse)}<Text style={[lStyles.ct, { fontSize: fs, color: '#ffffff' }]}>Emergency</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: '#F0997B' }]}>Campus services</Text></TouchableOpacity>
          <TouchableOpacity style={C('slate')} onPress={() => router.push('/app-settings')}>{icon('settings', 'slate', spin)}<Text style={[lStyles.ct, { fontSize: fs, color: textColor }]}>Settings</Text><Text style={[lStyles.cs, { fontSize: fs - 4, color: subColor }]}>Personalise app</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={lStyles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ffaaaa" />
          <Text style={lStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const lStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { padding: 20 },
  greeting: { fontWeight: 'bold' },
  sub: { marginTop: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  sec: { fontWeight: 'bold', marginBottom: 12, marginTop: 10, letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  card: { width: '48%', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5 },
  ct: { fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  cs: { marginTop: 4, textAlign: 'center' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D85A30', borderWidth: 1, borderColor: '#001f4d' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});

const styles = lStyles;