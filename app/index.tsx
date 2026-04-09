import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Ionicons name="school" size={80} color="#FFD700" />
        <Text style={styles.title}>Campus IQ</Text>
        <Text style={styles.subtitle}>Midlands State University</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Your smart campus companion</Text>
      </View>

      <Text style={styles.question}>Select your role to continue</Text>

      <TouchableOpacity
        style={styles.studentBtn}
        onPress={() => router.push('/login-student')}
      >
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

      <TouchableOpacity
        style={styles.lecturerBtn}
        onPress={() => router.push('/login-lecturer')}
      >
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

      <TouchableOpacity
        style={styles.adminBtn}
        onPress={() => router.push('/login-admin')}
      >
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

      <Text style={styles.footer}>MSU Campus IQ v1.0 © 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 12,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#a0c4ff',
    marginTop: 4,
    letterSpacing: 1,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#FFD700',
    marginVertical: 12,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#7a9cc4',
    fontStyle: 'italic',
  },
  question: {
    fontSize: 14,
    color: '#a0c4ff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  studentBtn: {
    backgroundColor: '#0a3d2e',
    borderWidth: 1,
    borderColor: '#1D9E75',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  lecturerBtn: {
    backgroundColor: '#1a1650',
    borderWidth: 1,
    borderColor: '#534AB7',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  adminBtn: {
    backgroundColor: '#3d1a0a',
    borderWidth: 1,
    borderColor: '#D85A30',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    backgroundColor: '#d0fff0',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleP: {
    backgroundColor: '#e0deff',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleA: {
    backgroundColor: '#ffe0d0',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  btnSub: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  footer: {
    textAlign: 'center',
    color: '#3a5a8a',
    fontSize: 12,
    marginTop: 40,
  },
});