import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [regNumber, setRegNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<any>(null);
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

  const verifyIdentity = async () => {
    if (!regNumber || !phone) { Alert.alert('Missing Fields', 'Please enter your reg number and phone number'); return; }
    if (!/^R\d{7}R$/.test(regNumber)) { Alert.alert('Invalid', 'Please enter a valid reg number e.g. R2211952R'); return; }
    setLoading(true);
    try {
      const email = `${regNumber}@students.msu.ac.zw`;
      const { data } = await supabase.from('students').select('*').eq('email', email).eq('phone', phone).single();
      if (data) { setVerifiedStudent(data); setStep(2); }
      else { Alert.alert('Not Found', 'No account found with this reg number and phone number. Please check your details.'); }
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) { Alert.alert('Missing Fields', 'Please fill in both password fields'); return; }
    if (!validatePassword(newPassword)) { Alert.alert('Weak Password', 'Password must be 8+ chars with uppercase, lowercase, number and special character e.g. Campus@2026'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('students').update({ password: newPassword }).eq('id', verifiedStudent.id);
      if (error) { Alert.alert('Error', error.message); return; }
      Alert.alert('Password Reset!', 'Your password has been reset. You can now log in with your new password.', [{ text: 'Login', onPress: () => router.replace('/login-student') }]);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="lock-open-outline" size={70} color="#1D9E75" />
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>{step === 1 ? 'Verify your identity to reset your password' : 'Create your new password'}</Text>
      </View>

      <View style={styles.stepRow}>
        <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}><Text style={styles.stepNum}>1</Text></View>
        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
        <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}><Text style={styles.stepNum}>2</Text></View>
      </View>

      {step === 1 && (
        <>
          <Text style={styles.stepTitle}>Step 1: Verify Identity</Text>
          <View style={styles.inputBox}>
            <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Reg Number e.g. R2211952R" placeholderTextColor="#aaa" value={regNumber} onChangeText={setRegNumber} autoCapitalize="characters" />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="phone-portrait-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Phone number used at registration" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
            <Text style={styles.hintText}>We will verify your identity using your reg number and the phone number you registered with</Text>
          </View>
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={verifyIdentity} disabled={loading}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#ffffff" />
            <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Identity'}</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.stepTitle}>Step 2: New Password</Text>
          <View style={styles.verifiedBox}>
            <Ionicons name="checkmark-circle" size={20} color="#1D9E75" />
            <Text style={styles.verifiedText}>Identity verified for {verifiedStudent?.name} {verifiedStudent?.surname}</Text>
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
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
            <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Confirm New Password" placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" /></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={resetPassword} disabled={loading}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.btnText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#001f4d', alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#a0c4ff', marginTop: 4, textAlign: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0a2a4a', borderWidth: 2, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  stepNum: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: '#0a2a4a' },
  stepLineActive: { backgroundColor: '#1D9E75' },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 20, alignSelf: 'flex-start' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', width: '100%', padding: 14, borderRadius: 12, marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0a2a4a', padding: 12, borderRadius: 10, marginBottom: 16, gap: 8, width: '100%' },
  hintText: { color: '#a0c4ff', fontSize: 12, flex: 1 },
  verifiedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', padding: 12, borderRadius: 10, marginBottom: 16, width: '100%' },
  verifiedText: { color: '#1D9E75', fontSize: 14, fontWeight: 'bold', flex: 1 },
  strengthBox: { width: '100%', marginBottom: 14, gap: 6 },
  strengthBar: { height: 6, backgroundColor: '#0a2a4a', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthText: { fontSize: 12, fontWeight: 'bold' },
  btn: { backgroundColor: '#1D9E75', width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backText: { color: '#a0c4ff', fontSize: 14 },
});
