import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginLecturer } from '../database/db';

export default function LecturerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    checkRemembered();
  }, []);

  const checkRemembered = async () => {
    try {
      const saved = await AsyncStorage.getItem('lecturer_remember');
      if (saved) {
        const { email, password } = JSON.parse(saved);
        setEmail(email);
        setPassword(password);
        setRememberMe(true);
      }
    } catch (e) {}
  };

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);
    const hasLength = pass.length >= 8;
    return hasUpper && hasLower && hasNumber && hasSpecial && hasLength;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters with uppercase, lowercase, number and special character');
      return;
    }

    const result = loginLecturer(email, password);

    if (result.success) {
      if (rememberMe) {
        await AsyncStorage.setItem('lecturer_remember', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('lecturer_remember');
      }
      await AsyncStorage.setItem('current_lecturer', JSON.stringify(result.lecturer));
      router.push('/lecturer-home');
    } else {
      Alert.alert('Login Failed', 'Incorrect email or password. Contact your Admin if you do not have an account.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <Ionicons name="book" size={70} color="#534AB7" />
        <Text style={styles.title}>Lecturer Login</Text>
        <Text style={styles.subtitle}>Your account is created by the Admin</Text>
      </View>

      <View style={styles.noticebox}>
        <Ionicons name="information-circle" size={20} color="#a0c4ff" />
        <Text style={styles.noticeText}>
          If you do not have an account contact your Campus IQ Administrator
        </Text>
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="mail-outline" size={20} color="#534AB7" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Staff Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#534AB7" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#aaa"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.rememberRow}
        onPress={() => setRememberMe(!rememberMe)}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
        </View>
        <Text style={styles.rememberText}>Remember me</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#001f4d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0c4ff',
    marginTop: 4,
    textAlign: 'center',
  },
  noticebox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  noticeText: {
    color: '#a0c4ff',
    fontSize: 13,
    flex: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    width: '100%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#534AB7',
  },
  rememberText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#534AB7',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  backText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
});