import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ADMIN_USERNAME = 'Campus';
const ADMIN_PASSWORD = '1945';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    checkRemembered();
  }, []);

  const checkRemembered = async () => {
    try {
      const saved = await AsyncStorage.getItem('admin_remember');
      if (saved) {
        const { username, password } = JSON.parse(saved);
        setUsername(username);
        setPassword(password);
        setRememberMe(true);
      }
    } catch (e) {}
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter your username and password');
      return;
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      if (rememberMe) {
        await AsyncStorage.setItem('admin_remember', JSON.stringify({ username, password }));
      } else {
        await AsyncStorage.removeItem('admin_remember');
      }
      await AsyncStorage.setItem('current_admin', JSON.stringify({ username: 'Campus', name: 'Campus Admin' }));
      router.push('/admin-home');
    } else {
      Alert.alert('Access Denied', 'Incorrect username or password');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <View style={styles.shieldCircle}>
          <Ionicons name="shield-checkmark" size={60} color="#D85A30" />
        </View>
        <Text style={styles.title}>Admin Access</Text>
        <Text style={styles.subtitle}>Restricted to authorised personnel only</Text>
      </View>

      <View style={styles.warningBox}>
        <Ionicons name="warning" size={20} color="#FFD700" />
        <Text style={styles.warningText}>
          Unauthorised access is strictly prohibited
        </Text>
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="person-outline" size={20} color="#D85A30" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#D85A30" style={styles.inputIcon} />
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
        <Ionicons name="log-in-outline" size={22} color="#ffffff" />
        <Text style={styles.btnText}>Login as Admin</Text>
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
  shieldCircle: {
    backgroundColor: '#3d1a0a',
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D85A30',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffaaaa',
    marginTop: 4,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 13,
    flex: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#D85A30',
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
    borderColor: '#D85A30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#D85A30',
  },
  rememberText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#D85A30',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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