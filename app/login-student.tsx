import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginStudent, registerStudent, resendOTP, verifyStudentOTP } from '../database/db';

export default function StudentLogin() {
  const router = useRouter();
  const [screen, setScreen] = useState<'login' | 'signup' | 'verify'>('login');

  // Login
  const [loginReg, setLoginReg] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [program, setProgram] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState('');

  // Verify
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => { checkRemembered(); }, []);
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const checkRemembered = async () => {
    const saved = await AsyncStorage.getItem('student_remember');
    if (saved) {
      const { reg, pwd } = JSON.parse(saved);
      setLoginReg(reg); setLoginPassword(pwd); setRememberMe(true);
    }
  };

  // Auto-complete email when reg number is typed
  const handleRegNumberChange = (text: string) => {
    const upper = text.toUpperCase();
    setRegNumber(upper);
    if (/^R\d{7}R$/i.test(upper)) {
      setEmail(`${upper.toUpperCase()}@students.msu.ac.zw`);
    } else if (upper.length > 0) {
      setEmail(`${upper}@students.msu.ac.zw`);
    } else {
      setEmail('');
    }
  };

  const validateReg = (r: string) => /^R\d{7}R$/i.test(r.trim());

  const getStrength = (p: string) => {
    if (!p) return '';
    let s = 0;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (p.length >= 8) s++;
    if (s <= 2) return 'Weak';
    if (s <= 3) return 'Medium';
    return 'Strong';
  };

  const strengthColor = () => strength === 'Weak' ? '#D85A30' : strength === 'Medium' ? '#FFD700' : '#1D9E75';

  const handleLogin = async () => {
    if (loading) return;
    if (!loginReg || !loginPassword) { Alert.alert('Missing', 'Enter your reg number and password'); return; }
    if (!validateReg(loginReg)) { Alert.alert('Invalid', 'Reg number format: R2211952R'); return; }
    setLoading(true);
    try {
      const emailToUse = `${loginReg.toUpperCase()}@students.msu.ac.zw`;
      const result = await loginStudent(emailToUse, loginPassword);
      if (result.success) {
        if (rememberMe) await AsyncStorage.setItem('student_remember', JSON.stringify({ reg: loginReg, pwd: loginPassword }));
        else await AsyncStorage.removeItem('student_remember');
        await AsyncStorage.setItem('current_student', JSON.stringify(result.student));
        router.push('/student-home');
      } else if (result.error === 'unverified') {
        setPendingEmail(result.email || emailToUse);
        setScreen('verify');
      } else if (result.error === 'suspended') {
        Alert.alert('Account Suspended', `Reason: ${result.reason || 'Contact admin'}`);
      } else {
        Alert.alert('Login Failed', 'Incorrect reg number or password');
      }
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (loading) return;
    if (!name || !surname || !program || !regNumber || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields'); return;
    }
    if (!validateReg(regNumber)) { Alert.alert('Invalid', 'Reg number format: R2211952R'); return; }
    if (!email.toLowerCase().endsWith('@students.msu.ac.zw')) {
      Alert.alert('Invalid Email', 'Email must end with @students.msu.ac.zw'); return;
    }
    if (phone.replace(/\D/g, '').length < 10) { Alert.alert('Invalid Phone', 'Enter a valid phone number'); return; }
    if (strength === 'Weak' || password.length < 8) {
      Alert.alert('Weak Password', 'Password needs 8+ characters with uppercase, lowercase, number and special character e.g. Campus@2026'); return;
    }
    if (password !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match'); return; }

    setLoading(true);
    try {
      const result = await registerStudent(
        name.trim(), surname.trim(), program.trim(),
        regNumber.trim().toUpperCase(), email.trim().toLowerCase(),
        password, phone.trim()
      );
      if (result.success) {
        setPendingEmail(result.email || email.toLowerCase());
        setCooldown(60);
        if (result.otp) {
          setDevOtp(result.otp);
          Alert.alert(
            'Account Created!',
            `Your verification code is:\n\n${result.otp}\n\nEnter this on the next screen. Save it now — it expires in 10 minutes.`,
            [{ text: 'Continue', onPress: () => setScreen('verify') }]
          );
        } else {
          setScreen('verify');
        }
      } else {
        Alert.alert('Error', result.error || 'Could not create account');
      }
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (loading) return;
    if (!otpCode || otpCode.length !== 6) { Alert.alert('Invalid', 'Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const result = await verifyStudentOTP(pendingEmail, otpCode);
      if (result.success) {
        await AsyncStorage.setItem('current_student', JSON.stringify(result.student));
        Alert.alert('Verified!', 'Welcome to Campus IQ!', [{ text: 'Continue', onPress: () => router.push('/student-home') }]);
      } else {
        Alert.alert('Invalid Code', result.error || 'Check the code and try again');
      }
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const result = await resendOTP(pendingEmail);
      if (result.success) {
        setCooldown(60);
        if (result.otp) {
          setDevOtp(result.otp);
          Alert.alert('New Code', `Your new verification code:\n\n${result.otp}\n\nSave it now.`);
        }
      } else {
        Alert.alert('Error', result.error || 'Could not resend');
      }
    } finally { setLoading(false); }
  };

  if (screen === 'verify') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={50} color="#1D9E75" />
        </View>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>6-digit code for:</Text>
        <Text style={styles.emailDisplay}>{pendingEmail}</Text>

        {devOtp !== '' && (
          <View style={styles.devOtpBox}>
            <Ionicons name="key-outline" size={18} color="#FFD700" />
            <View>
              <Text style={styles.devOtpLabel}>Your verification code:</Text>
              <Text style={styles.devOtpCode}>{devOtp}</Text>
            </View>
          </View>
        )}

        <TextInput
          style={styles.otpInput}
          placeholder="000000"
          placeholderTextColor="#534AB7"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity style={[styles.btn, { backgroundColor: '#1D9E75' }, loading && { opacity: 0.6 }]} onPress={handleVerify} disabled={loading}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || loading}>
          <Text style={[styles.linkText, cooldown > 0 && { color: '#534AB7' }]}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Get a new code'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
          <Text style={styles.infoText}>Save your code immediately. It expires in 10 minutes.</Text>
        </View>

        <TouchableOpacity style={styles.backLink} onPress={() => { setScreen('signup'); setOtpCode(''); setDevOtp(''); }}>
          <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
          <Text style={styles.backLinkText}>Back to Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (screen === 'signup') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Ionicons name="person-add" size={60} color="#1D9E75" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register your MSU student account</Text>

        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#aaa" value={name} onChangeText={setName} autoCapitalize="words" />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Surname" placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} autoCapitalize="words" />
        </View>
        <View style={styles.inputBox}>
          <Ionicons name="library-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Program e.g. BSc Computer Science" placeholderTextColor="#aaa" value={program} onChangeText={setProgram} autoCapitalize="words" />
        </View>

        {/* Reg Number — auto-fills email */}
        <View style={styles.inputBox}>
          <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Reg Number e.g. R2211952R"
            placeholderTextColor="#aaa"
            value={regNumber}
            onChangeText={handleRegNumberChange}
            autoCapitalize="characters"
            maxLength={9}
          />
        </View>

        {/* Email — auto-filled, still editable */}
        <View style={[styles.inputBox, { borderColor: email.endsWith('@students.msu.ac.zw') ? '#1D9E75' : '#D85A30' }]}>
          <Ionicons name="mail-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email (auto-filled from reg)"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {email.endsWith('@students.msu.ac.zw') && (
            <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />
          )}
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="phone-portrait-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Phone e.g. 0771234567" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaa" value={password} onChangeText={(t) => { setPassword(t); setStrength(getStrength(t)); }} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>

        {password.length > 0 && (
          <View style={styles.strengthRow}>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { width: strength === 'Weak' ? '33%' : strength === 'Medium' ? '66%' : '100%', backgroundColor: strengthColor() }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: strengthColor() }]}>{strength}</Text>
          </View>
        )}

        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#a0c4ff" />
          <Text style={styles.infoText}>A verification code will appear after signup. Save it immediately.</Text>
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: '#1D9E75' }, loading && { opacity: 0.6 }]} onPress={handleSignup} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen('login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // LOGIN SCREEN
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="person-circle" size={80} color="#1D9E75" />
      <Text style={styles.title}>Student Login</Text>
      <Text style={styles.subtitle}>Welcome back to Campus IQ</Text>

      <View style={styles.inputBox}>
        <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.icon} />
        <TextInput style={styles.input} placeholder="Reg Number e.g. R2211952R" placeholderTextColor="#aaa" value={loginReg} onChangeText={setLoginReg} autoCapitalize="characters" maxLength={9} />
      </View>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.icon} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaa" value={loginPassword} onChangeText={setLoginPassword} secureTextEntry={!showLoginPwd} />
        <TouchableOpacity onPress={() => setShowLoginPwd(!showLoginPwd)}>
          <Ionicons name={showLoginPwd ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
          {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={styles.rememberText}>Remember me</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, { backgroundColor: '#1D9E75' }, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setScreen('signup')}>
        <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
        <Text style={[styles.linkText, { color: '#FFD700' }]}>Forgot Password?</Text>
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
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#0a3d2e', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#1D9E75', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginTop: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#a0c4ff', marginTop: 4, marginBottom: 20, textAlign: 'center' },
  emailDisplay: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', marginBottom: 16, textAlign: 'center' },
  devOtpBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1650', borderWidth: 2, borderColor: '#FFD700', borderRadius: 14, padding: 16, marginBottom: 16, width: '100%' },
  devOtpLabel: { color: '#a0c4ff', fontSize: 13 },
  devOtpCode: { color: '#FFD700', fontSize: 32, fontWeight: 'bold', letterSpacing: 8 },
  otpInput: { backgroundColor: '#0a2a4a', borderWidth: 2, borderColor: '#1D9E75', borderRadius: 14, padding: 20, fontSize: 36, fontWeight: 'bold', color: '#FFD700', letterSpacing: 12, width: '100%', marginBottom: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', width: '100%', padding: 14, borderRadius: 12, marginBottom: 14 },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 14 },
  strengthBar: { flex: 1, height: 6, backgroundColor: '#0a2a4a', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: 'bold', minWidth: 50 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#1D9E75' },
  rememberText: { color: '#a0c4ff', fontSize: 14 },
  btn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#a0c4ff', fontSize: 14, marginBottom: 12, textDecorationLine: 'underline' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0a2a4a', padding: 12, borderRadius: 10, marginBottom: 16, gap: 8, width: '100%' },
  infoText: { color: '#a0c4ff', fontSize: 12, flex: 1 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backLinkText: { color: '#a0c4ff', fontSize: 14 },
});