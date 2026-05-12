import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function LecturerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => { checkRemembered(); }, []);

  const checkRemembered = async () => {
    try {
      const saved = await AsyncStorage.getItem('lecturer_remember');
      if (saved) { const { em, pw } = JSON.parse(saved); setEmail(em || ''); setPassword(pw || ''); setRememberMe(true); }
    } catch (e) {}
  };

  const validateEmail = (e: string) => {
    if (!e.trim()) return 'Email is required';
    if (!e.includes('@')) return 'Enter a valid email address';
    if (!e.includes('.')) return 'Enter a valid email address';
    return '';
  };

  const handleLogin = async () => {
    if (loading) return;
    const eErr = validateEmail(email.trim());
    if (eErr) { setEmailError(eErr); Alert.alert('Invalid Email', eErr); return; }
    if (!password.trim()) { Alert.alert('Missing', 'Please enter your password'); return; }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lecturers')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) { Alert.alert('Error', error.message); return; }
      if (!data) { Alert.alert('Login Failed', 'Incorrect email or password. Contact your Admin if you do not have an account.'); return; }
      if (data.password !== password.trim()) { Alert.alert('Login Failed', 'Incorrect email or password. Contact your Admin if you do not have an account.'); return; }

      if (data.is_suspended === 1 || data.is_suspended === true) {
        Alert.alert(
          '🚫 Account Suspended',
          `Your lecturer account has been suspended.\n\nReason: ${data.suspend_reason || 'No reason provided'}\n\nPlease contact the Campus IQ Admin to resolve this issue.`,
          [{ text: 'OK' }]
        );
        return;
      }

      if (rememberMe) await AsyncStorage.setItem('lecturer_remember', JSON.stringify({ em: email.trim().toLowerCase(), pw: password.trim() }));
      else await AsyncStorage.removeItem('lecturer_remember');

      await AsyncStorage.setItem('current_lecturer', JSON.stringify(data));

      if (data.must_change_password === 1 || data.must_change_password === true) {
        router.replace('/lecturer-change-password');
      } else {
        router.replace('/lecturer-home');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="book" size={50} color="#534AB7" />
      </View>
      <Text style={styles.title}>Lecturer Login</Text>
      <Text style={styles.subtitle}>Your account is created by the Admin</Text>

      <View style={[styles.inputBox, emailError ? styles.inputError : null]}>
        <Ionicons name="mail-outline" size={20} color="#534AB7" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Email address e.g. john@msu.ac.zw"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={(t) => { setEmail(t); setEmailError(validateEmail(t)); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {email.length > 0 && !emailError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
      </View>
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#534AB7" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPwd}
        />
        <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
          <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={styles.rememberText}>Remember me</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
        <Text style={styles.infoText}>Use the email and password provided by your Campus IQ admin. First-time login requires a password change.</Text>
      </View>

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Ionicons name="log-in-outline" size={22} color="#fff" />
        <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
        <Text style={styles.backLinkText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#001029', alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#534AB7', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#a0c4ff', marginTop: 4, marginBottom: 24, textAlign: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#534AB7', width: '100%', padding: 14, borderRadius: 12, marginBottom: 4 },
  inputError: { borderColor: '#D85A30' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  errorText: { color: '#D85A30', fontSize: 12, width: '100%', marginBottom: 10, marginTop: 2, paddingLeft: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 16, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#534AB7' },
  rememberText: { color: '#a0c4ff', fontSize: 14 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 10, padding: 12, marginBottom: 20, gap: 8, width: '100%' },
  infoText: { color: '#a0c4ff', fontSize: 12, flex: 1, lineHeight: 18 },
  btn: { backgroundColor: '#534AB7', width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backLinkText: { color: '#a0c4ff', fontSize: 14 },
});