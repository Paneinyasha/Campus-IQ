import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginStudent, registerStudent } from '../database/db';

export default function StudentLogin() {
  const router = useRouter();
  const [screen, setScreen] = useState('login');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [program, setProgram] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loginReg, setLoginReg] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkRemembered(); }, []);

  const checkRemembered = async () => {
    try {
      const saved = await AsyncStorage.getItem('student_remember');
      if (saved) {
        const { reg, pwd } = JSON.parse(saved);
        setLoginReg(reg);
        setPassword(pwd);
        setRememberMe(true);
      }
    } catch (e) {}
  };

  const validateRegNumber = (reg: string) => /^R\d{4,}[A-Z]$/.test(reg);
  const validateEmail = (em: string) => em.toLowerCase().endsWith('@students.msu.ac.zw');
  const validatePassword = (pass: string) =>
    /[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9]/.test(pass) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass) && pass.length >= 8;

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

  const getStrengthColor = () => {
    if (passwordStrength === 'Weak') return '#D85A30';
    if (passwordStrength === 'Medium') return '#FFD700';
    return '#1D9E75';
  };

  const handleLogin = async () => {
    if (loading) return;
    if (!loginReg || !password) { Alert.alert('Error', 'Please enter your reg number and password'); return; }
    if (!validateRegNumber(loginReg)) { Alert.alert('Invalid', 'Please enter a valid reg number e.g. R2211952R'); return; }
    setLoading(true);
    try {
      const emailToUse = `${loginReg.toLowerCase()}@students.msu.ac.zw`;
      const result = await loginStudent(emailToUse, password);
      if (result.success) {
        if (rememberMe) {
          await AsyncStorage.setItem('student_remember', JSON.stringify({ reg: loginReg, pwd: password }));
        } else {
          await AsyncStorage.removeItem('student_remember');
        }
        await AsyncStorage.setItem('current_student', JSON.stringify(result.student));
        router.push('/student-home');
      } else {
        Alert.alert('Login Failed', 'Incorrect reg number or password. If you just registered, please try again.');
      }
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (loading) return;
    if (!name || !surname || !program || !regNumber || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields'); return;
    }
    if (!validateRegNumber(regNumber)) {
      Alert.alert('Invalid Reg Number', 'Format must be R followed by numbers and a letter e.g. R2211952R'); return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Must be your MSU student email ending in @students.msu.ac.zw'); return;
    }
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number e.g. 0771234567'); return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number and special character e.g. Campus@2026'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const result = await registerStudent(name, surname, program, regNumber, email, password, phone);
      if (result.success) {
        Alert.alert(
          '✅ Account Created!',
          `Welcome to Campus IQ, ${name}! Your account has been created successfully. You can now log in.`,
          [{ text: 'Login Now', onPress: () => { setScreen('login'); setLoginReg(regNumber); } }]
        );
      } else {
        Alert.alert('Error', result.error || 'Could not create account');
      }
    } finally { setLoading(false); }
  };

  // =================== SIGNUP SCREEN ===================
  if (screen === 'signup') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="person-circle" size={70} color="#1D9E75" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register your MSU student account</Text>
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Surname" placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="library-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Program e.g. BSc Computer Science" placeholderTextColor="#aaa" value={program} onChangeText={setProgram} />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Reg Number e.g. R2211952R" placeholderTextColor="#aaa" value={regNumber} onChangeText={setRegNumber} autoCapitalize="characters" />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="R2211952R@students.msu.ac.zw" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="phone-portrait-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Phone e.g. 0771234567" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password e.g. Campus@2026"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordStrength(getPasswordStrength(t)); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>

        {password.length > 0 && (
          <View style={styles.strengthBox}>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, {
                width: passwordStrength === 'Weak' ? '33%' : passwordStrength === 'Medium' ? '66%' : '100%',
                backgroundColor: getStrengthColor()
              }]} />
            </View>
            <Text style={[styles.strengthText, { color: getStrengthColor() }]}>{passwordStrength} password</Text>
          </View>
        )}

        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>

        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          {[
            { label: 'At least 8 characters', met: password.length >= 8 },
            { label: 'Uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
            { label: 'Lowercase letter (a-z)', met: /[a-z]/.test(password) },
            { label: 'Number (0-9)', met: /[0-9]/.test(password) },
            { label: 'Special character (!@#$...)', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
          ].map((req, i) => (
            <View key={i} style={styles.reqRow}>
              <Ionicons name={req.met ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={req.met ? '#1D9E75' : '#a0c4ff'} />
              <Text style={[styles.reqText, req.met && { color: '#1D9E75' }]}>{req.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSignup} disabled={loading}>
          <Ionicons name="person-add-outline" size={22} color="#fff" />
          <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen('login')}>
          <Text style={styles.switchText}>Already have an account? Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // =================== LOGIN SCREEN ===================
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={70} color="#1D9E75" />
        <Text style={styles.title}>Student Login</Text>
        <Text style={styles.subtitle}>Welcome back to Campus IQ!</Text>
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Reg Number e.g. R2211952R"
          placeholderTextColor="#aaa"
          value={loginReg}
          onChangeText={setLoginReg}
          autoCapitalize="characters"
        />
      </View>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
        </View>
        <Text style={styles.rememberText}>Remember me</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Ionicons name="log-in-outline" size={22} color="#fff" />
        <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setScreen('signup'); setPassword(''); }}>
        <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
        <Text style={styles.backLinkText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#001f4d', alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#a0c4ff', marginTop: 4, textAlign: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', width: '100%', padding: 14, borderRadius: 12, marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  strengthBox: { width: '100%', marginBottom: 14, gap: 6 },
  strengthBar: { height: 6, backgroundColor: '#0a2a4a', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthText: { fontSize: 12, fontWeight: 'bold' },
  requirementsBox: { width: '100%', backgroundColor: '#0a2a4a', borderRadius: 12, padding: 14, marginBottom: 16, gap: 8 },
  requirementsTitle: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqText: { color: '#a0c4ff', fontSize: 12 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#1D9E75' },
  rememberText: { color: '#a0c4ff', fontSize: 14 },
  btn: { backgroundColor: '#1D9E75', width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  switchText: { color: '#a0c4ff', fontSize: 14, marginBottom: 12, textDecorationLine: 'underline' },
  forgotText: { color: '#FFD700', fontSize: 14, marginBottom: 16, textDecorationLine: 'underline' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backLinkText: { color: '#a0c4ff', fontSize: 14 },
});
