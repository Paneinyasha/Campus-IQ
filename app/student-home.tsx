import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

// Wiggling bell with notification dot
function AnimatedBell({ hasNotif }: { hasNotif: boolean }) {
  const wiggle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(wiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.delay(hasNotif ? 1500 : 4000),
    ]));
    anim.start();
    return () => anim.stop();
  }, [hasNotif]);
  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });
  return (
    <View>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Ionicons name="notifications" size={30} color="#FFD700" />
      </Animated.View>
      {hasNotif && <View style={styles.notifDot} />}
    </View>
  );
}

// Pulsing radio icon
function AnimatedRadio() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale: pulse }] }}><Ionicons name="radio" size={30} color="#FFD700" /></Animated.View>;
}

// Bouncing calendar
function AnimatedCalendar() {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -6, duration: 400, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ translateY: bounce }] }}><Ionicons name="calendar" size={30} color="#FFD700" /></Animated.View>;
}

// Spinning QR code
function AnimatedQR() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(spin, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(3000),
    ])).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="qr-code" size={30} color="#FFD700" /></Animated.View>;
}

// Flipping book/notes
function AnimatedBook() {
  const flip = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(2000),
      Animated.timing(flip, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(flip, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(flip, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(flip, { toValue: 1, duration: 300, useNativeDriver: true }),
    ])).start();
  }, []);
  const scaleX = flip.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] });
  return <Animated.View style={{ transform: [{ scaleX }] }}><Ionicons name="document-text" size={30} color="#FFD700" /></Animated.View>;
}

// Rotating globe
function AnimatedGlobe() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="globe" size={30} color="#FFD700" /></Animated.View>;
}

// Bouncing clipboard
function AnimatedClipboard() {
  const bounce = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(1500),
      Animated.timing(bounce, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1, duration: 200, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale: bounce }] }}><Ionicons name="clipboard" size={30} color="#FFD700" /></Animated.View>;
}

// Ticking clock/today
function AnimatedToday() {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(rotate, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
  }, []);
  const rot = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '10deg'] });
  return <Animated.View style={{ transform: [{ rotate: rot }] }}><Ionicons name="today" size={30} color="#FFD700" /></Animated.View>;
}

// Bubbling chat
function AnimatedChat() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(2500),
      Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale }] }}><Ionicons name="chatbubbles" size={30} color="#FFD700" /></Animated.View>;
}

// Joystick wiggle
function AnimatedGame() {
  const wiggle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(3000),
      Animated.timing(wiggle, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(wiggle, { toValue: 0, duration: 100, useNativeDriver: true }),
    ])).start();
  }, []);
  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="game-controller" size={30} color="#FFD700" /></Animated.View>;
}

// Shield pulse
function AnimatedShield() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale: pulse }] }}><Ionicons name="shield-checkmark" size={30} color="#FFD700" /></Animated.View>;
}

// Animated map pin drop
function AnimatedMap() {
  const drop = useRef(new Animated.Value(-4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(drop, { toValue: 4, duration: 600, useNativeDriver: true }),
      Animated.timing(drop, { toValue: -4, duration: 600, useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ translateY: drop }] }}><Ionicons name="map" size={30} color="#FFD700" /></Animated.View>;
}

// Magnifying glass search
function AnimatedSearch() {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(rotate, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: -1, duration: 400, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.delay(3000),
    ])).start();
  }, []);
  const rot = rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });
  return <Animated.View style={{ transform: [{ rotate: rot }] }}><Ionicons name="search" size={30} color="#FFD700" /></Animated.View>;
}

// People wave
function AnimatedPeople() {
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(2000),
      Animated.timing(wave, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0, duration: 300, useNativeDriver: true }),
    ])).start();
  }, []);
  const translateY = wave.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  return <Animated.View style={{ transform: [{ translateY }] }}><Ionicons name="people" size={30} color="#FFD700" /></Animated.View>;
}

// Share icon spin
function AnimatedShare() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(3000),
      Animated.timing(spin, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(spin, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])).start();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}><Ionicons name="share-social" size={30} color="#FFD700" /></Animated.View>;
}

// Location pin bounce
function AnimatedLocation() {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -6, duration: 300, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ translateY: bounce }] }}><Ionicons name="location" size={30} color="#FFD700" /></Animated.View>;
}

// School icon bounce
function AnimatedSchool() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(2000),
      Animated.timing(scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale }] }}><Ionicons name="school" size={30} color="#FFD700" /></Animated.View>;
}

export default function StudentHome() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [hasNotif, setHasNotif] = useState(false);

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) { setStudent(JSON.parse(saved)); checkNotifications(); }
    } catch (e) {}
  };

  const checkNotifications = async () => {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', 0);
    setHasNotif((count || 0) > 0);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('current_student');
    router.replace('/');
  };

  const handleShare = async () => {
    await Share.share({ message: 'Check out Campus IQ — the smart campus companion for MSU students!', title: 'Campus IQ - MSU' });
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
          <Text style={styles.greeting}>{getTimeGreeting()}, {student ? student.name : 'Student'}!</Text>
          <Text style={styles.subgreeting}>{student ? student.reg_number : 'Midlands State University'}</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => router.push('/profile-student')}>
          <Ionicons name="person" size={28} color="#1D9E75" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Academic</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/manage-timetable')}>
          <AnimatedCalendar />
          <Text style={styles.cardTitle}>Timetable</Text>
          <Text style={styles.cardSub}>View schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/manage-venues')}>
          <AnimatedLocation />
          <Text style={styles.cardTitle}>Venues</Text>
          <Text style={styles.cardSub}>Free rooms</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/scan-attendance')}>
          <AnimatedQR />
          <Text style={styles.cardTitle}>Attendance</Text>
          <Text style={styles.cardSub}>Scan QR code</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push('/my-notes')}>
          <AnimatedBook />
          <Text style={styles.cardTitle}>My Notes</Text>
          <Text style={styles.cardSub}>Study notes</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Quizzes</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/quiz-msu')}>
          <AnimatedSchool />
          <Text style={styles.cardTitle}>MSU Quiz</Text>
          <Text style={styles.cardSub}>About MSU</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/quiz-program')}>
          <AnimatedBook />
          <Text style={styles.cardTitle}>Program Quiz</Text>
          <Text style={styles.cardSub}>Your course</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/quiz-didyouknow')}>
          <AnimatedGlobe />
          <Text style={styles.cardTitle}>Did You Know</Text>
          <Text style={styles.cardSub}>Global facts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.purple]} onPress={() => router.push('/quiz-set')}>
          <AnimatedClipboard />
          <Text style={styles.cardTitle}>Set Quizzes</Text>
          <Text style={styles.cardSub}>By lecturers</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Tools</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/plan-my-day')}>
          <AnimatedToday />
          <Text style={styles.cardTitle}>Plan My Day</Text>
          <Text style={styles.cardSub}>Daily planner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/chat')}>
          <AnimatedChat />
          <Text style={styles.cardTitle}>Chat</Text>
          <Text style={styles.cardSub}>Student chat</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/games')}>
          <AnimatedGame />
          <Text style={styles.cardTitle}>Games</Text>
          <Text style={styles.cardSub}>Play offline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push('/anonymous-report')}>
          <AnimatedShield />
          <Text style={styles.cardTitle}>Report</Text>
          <Text style={styles.cardSub}>Anonymous</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Campus Life</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/msu-radio')}>
          <AnimatedRadio />
          <Text style={styles.cardTitle}>MSU Radio</Text>
          <Text style={styles.cardSub}>Listen live</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/campus-map')}>
          <AnimatedMap />
          <Text style={styles.cardTitle}>Campus Map</Text>
          <Text style={styles.cardSub}>Find your way</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => { router.push('/notifications'); setHasNotif(false); }}>
          <AnimatedBell hasNotif={hasNotif} />
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardSub}>Updates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/lost-found')}>
          <AnimatedSearch />
          <Text style={styles.cardTitle}>Lost & Found</Text>
          <Text style={styles.cardSub}>Find lost items</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={() => router.push('/src-elections')}>
          <AnimatedPeople />
          <Text style={styles.cardTitle}>SRC Elections</Text>
          <Text style={styles.cardSub}>Vote now</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.dark]} onPress={handleShare}>
          <AnimatedShare />
          <Text style={styles.cardTitle}>Share App</Text>
          <Text style={styles.cardSub}>Invite friends</Text>
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
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  subgreeting: { fontSize: 13, color: '#FFD700', marginTop: 2 },
  avatarCircle: { backgroundColor: '#0a3d2e', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1D9E75' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 12, marginTop: 10, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', padding: 18, borderRadius: 14, alignItems: 'center' },
  green: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75' },
  purple: { backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7' },
  orange: { backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#D85A30' },
  dark: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#a0c4ff' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginTop: 10, textAlign: 'center' },
  cardSub: { fontSize: 11, color: '#a0c4ff', marginTop: 4, textAlign: 'center' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#D85A30', borderWidth: 1, borderColor: '#001f4d' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 10, marginBottom: 40 },
  logoutText: { color: '#ffaaaa', fontSize: 16 },
});
