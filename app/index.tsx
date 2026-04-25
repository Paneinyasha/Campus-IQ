import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Share, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  // Phone flip animation
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const phoneOpacity = useRef(new Animated.Value(1)).current;
  const capOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runAnimation = () => {
      Animated.sequence([
        // Phase 1: phone visible, scale up slightly
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        // Phase 2: flip out phone
        Animated.parallel([
          Animated.timing(flipAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(phoneOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]),
        // Phase 3: flip in cap
        Animated.parallel([
          Animated.timing(capOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        // Phase 4: hold
        Animated.delay(1800),
        // Phase 5: flip back
        Animated.parallel([
          Animated.timing(capOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(flipAnim, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(phoneOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
        Animated.delay(2000),
      ]).start(() => runAnimation());
    };
    runAnimation();
  }, []);

  const spin = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleShare = async () => {
    await Share.share({
      message: 'Check out Campus IQ — the smart campus companion for Midlands State University students! Download the app and stay connected with your campus.',
      title: 'Campus IQ - MSU',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: spin }] }}>
          <Animated.View style={[styles.iconWrap, { opacity: phoneOpacity, position: 'absolute', top: 0, left: 0 }]}>
            <Ionicons name="phone-portrait" size={80} color="#FFD700" />
          </Animated.View>
          <Animated.View style={[styles.iconWrap, { opacity: capOpacity }]}>
            <Ionicons name="school" size={80} color="#FFD700" />
          </Animated.View>
        </Animated.View>
        <Text style={styles.title}>Campus IQ</Text>
        <Text style={styles.subtitle}>Midlands State University</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Your smart campus companion</Text>
      </View>

      <Text style={styles.question}>Select your role to continue</Text>

      <TouchableOpacity style={styles.studentBtn} onPress={() => router.push('/login-student')}>
        <View style={styles.btnLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={28} color="#1D9E75" />
          </View>
          <View>
            <Text style={styles.btnTitle}>Student</Text>
            <Text style={styles.btnSub}>Login or create account</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.lecturerBtn} onPress={() => router.push('/login-lecturer')}>
        <View style={styles.btnLeft}>
          <View style={styles.iconCircleP}>
            <Ionicons name="book" size={28} color="#534AB7" />
          </View>
          <View>
            <Text style={styles.btnTitle}>Lecturer</Text>
            <Text style={styles.btnSub}>Access your teaching portal</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/login-admin')}>
        <View style={styles.btnLeft}>
          <View style={styles.iconCircleA}>
            <Ionicons name="shield-checkmark" size={28} color="#D85A30" />
          </View>
          <View>
            <Text style={styles.btnTitle}>Admin</Text>
            <Text style={styles.btnSub}>System control center</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Ionicons name="share-social-outline" size={18} color="#a0c4ff" />
        <Text style={styles.shareText}>Share Campus IQ</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Campus IQ by Paneinyasha v1.0 © 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 42, fontWeight: 'bold', color: '#FFD700', marginTop: 12, letterSpacing: 2 },
  subtitle: { fontSize: 15, color: '#a0c4ff', marginTop: 4, letterSpacing: 1 },
  divider: { width: 60, height: 2, backgroundColor: '#FFD700', marginVertical: 12, borderRadius: 2 },
  tagline: { fontSize: 13, color: '#7a9cc4', fontStyle: 'italic' },
  question: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
  studentBtn: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', width: '100%', padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  lecturerBtn: { backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', width: '100%', padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  adminBtn: { backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', width: '100%', padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { backgroundColor: '#d0fff0', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconCircleP: { backgroundColor: '#e0deff', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconCircleA: { backgroundColor: '#ffe0d0', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  btnTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  btnSub: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, padding: 12 },
  shareText: { color: '#a0c4ff', fontSize: 14, textDecorationLine: 'underline' },
  footer: { textAlign: 'center', color: '#3a5a8a', fontSize: 12, marginTop: 16 },
});
