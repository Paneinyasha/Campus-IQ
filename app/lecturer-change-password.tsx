import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function LecturerChangePassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass: string) => /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass) && pass.length >= 8;
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return '';
    let score = 0;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) score++;
    if (pass.length >= 8) score++;
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Medium';
    return 'Strong';
  };
  const getStrengthColor = () => passwordStrength === 'Weak' ? '#D85A30' : passwordStrength === 'Medium' ? '#FFD700' : '#1D9E75';

  const handleChange = async () => {
    if (!newPassword || !confirmPassword) { Alert.alert('Missing Fields', 'Please fill in all fields'); return; }
    if (!validatePassword(newPassword)) { Alert.alert('Weak Password', 'Password must be 8+ chars with uppercase, lowercase, number and special character e.g. Campus@2026'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem('current_lecturer');
      if (!saved) return;
      const lecturer = JSON.parse(saved);
      const { error } = await supabase.from('lecturers').update({ password: newPassword, must_change_password: 0 }).eq('id', lecturer.id);
      if (error) { Alert.alert('Error', error.message); return; }
      const updated = { ...lecturer, must_change_password: 0 };
      await AsyncStorage.setItem('current_lecturer', JSON.stringify(updated));
      Alert.alert('Password Changed!', 'Your password has been updated successfully!', [{ text: 'Continue', onPress: () => router.replace('/lecturer-home') }]);
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}><Ionicons name="key" size={60} color="#FFD700" /></View>
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>You are required to change your temporary password before continuing</Text>
      <View style={styles.noticebox}>
        <Ionicons name="warning-outline" size={18} color="#FFD700" />
        <Text style={styles.noticeText}>Your temporary password was set by the Admin. Please create a secure personal password.</Text>
      </View>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#534AB7" style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="New Password" placeholderTextColor="#aaa" value={newPassword} onChangeText={(t) => { setNewPassword(t); setPasswordStrength(getPasswordStrength(t)); }} secureTextEntry={!showNew} />
        <TouchableOpacity onPress={() => setShowNew(!showNew)}><Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" /></TouchableOpacity>
      </View>
      {newPassword.length > 0 && (
        <View style={styles.strengthBox}>
          <View style={styles.strengthBar}><View style={[styles.strengthFill, { width: passwordStrength === 'Weak' ? '33%' : passwordStrength === 'Medium' ? '66%' : '100%', backgroundColor: getStrengthColor() }]} /></View>
          <Text style={[styles.strengthText, { color: getStrengthColor() }]}>{passwordStrength} password</Text>
        </View>
      )}
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#534AB7" style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Confirm New Password" placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" /></TouchableOpacity>
      </View>
      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
        <Text style={styles.hintText}>Must be 8+ chars with uppercase, lowercase, number and special character e.g. Campus@2026</Text>
      </View>
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleChange} disabled={loading}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
        <Text style={styles.btnText}>{loading ? 'Saving...' : 'Set New Password'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 24, paddingTop: 60, alignItems: 'center', justifyContent: 'center' },
  iconBox: { backgroundColor: '#1a1650', width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFD700', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', marginBottom: 20 },
  noticebox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#FFD700', padding: 14, borderRadius: 12, marginBottom: 20, gap: 10, width: '100%' },
  noticeText: { color: '#FFD700', fontSize: 13, flex: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', width: '100%', padding: 14, borderRadius: 12, marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  strengthBox: { width: '100%', marginBottom: 14, gap: 6 },
  strengthBar: { height: 6, backgroundColor: '#0a2a4a', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthText: { fontSize: 12, fontWeight: 'bold' },
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0a2a4a', padding: 12, borderRadius: 10, marginBottom: 20, gap: 8, width: '100%' },
  hintText: { color: '#a0c4ff', fontSize: 12, flex: 1 },
  btn: { backgroundColor: '#534AB7', width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});
