import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginStudent, registerStudent, resendStudentOTP, verifyStudentOTP } from '../database/db';

export default function StudentLogin() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isOTPScreen, setIsOTPScreen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
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
        const parsed = JSON.parse(saved);
        // Only pre-fill if remember me was explicitly saved
        if (parsed.rememberMe) {
          setLoginReg(parsed.reg);
          setPassword(parsed.password);
          setRememberMe(true);
        }
      }
    } catch (e) {}
  };

  // Auto-generate email from reg number
  const handleRegNumberChange = (text: string) => {
    const upper = text.toUpperCase();
    setRegNumber(upper);
    if (upper.length >= 2) {
      setEmail(`${upper.toLowerCase()}@students.msu.ac.zw`);
    } else {
      setEmail('');
    }
  };

  // Reg number: starts with R, ends with a letter A-Z, has 4+ digits in between
  const validateRegNumber = (reg: string) => /^R\d{4,}[A-Z]$/.test(reg);

  // Email must match pattern derived from reg number
  const validateEmail = (em: string) => /^r\d{4,}[a-z]@students\.msu\.ac\.zw$/.test(em);

  const validatePassword = (pass: string) => {
    return /[A-Z]/.test(pass) && /[a-z]/.test(pass) &&
      /[0-9]/.test(pass) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass) &&
      pass.length >= 8;
  };

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

  const handleVerifyOTP = async () => {
    if (loading) return;
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your email');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyStudentOTP(pendingEmail, otpCode);
      if (result.success) {
        Alert.alert('Email Verified!', 'Your account is now active. You can log in.', [
          { text: 'Login Now', onPress: () => { setIsOTPScreen(false); setIsSignUp(false); setOtpCode(''); } }
        ]);
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid or expired OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const result = await resendStudentOTP(pendingEmail);
      if (result.success) {
        Alert.alert('OTP Sent', 'A new verification code has been sent to your email');
      } else {
        Alert.alert('Error', result.error || 'Could not resend OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name || !surname || !program || !regNumber || !email || !phone || !password || !confirmPassword) {
          Alert.alert('Missing Fields', 'Please fill in all fields'); return;
        }
        if (!validateRegNumber(regNumber)) {
          Alert.alert('Invalid Reg Number', 'Format must start with R, have 4+ digits, and end with a letter e.g. R2211952R or R22119A'); return;
        }
        if (!validateEmail(email)) {
          Alert.alert('Invalid Email', 'Email must match your reg number e.g. r2211952r@students.msu.ac.zw'); return;
        }
        if (phone.length < 10) {
          Alert.alert('Invalid Phone', 'Please enter a valid phone number'); return;
        }
        if (!validatePassword(password)) {
          Alert.alert('Weak Password', 'Password must be 8+ chars with uppercase, lowercase, number and special character e.g. Campus@2026'); return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Mismatch', 'Passwords do not match'); return;
        }
        const result = await registerStudent(name, surname, program, regNumber, email.toLowerCase(), password, phone);
        if (result.success) {
          setPendingEmail(email.toLowerCase());
          setIsOTPScreen(true);
          setName(''); setSurname(''); setProgram('');
          setRegNumber(''); setEmail(''); setPhone('');
          setPassword(''); setConfirmPassword('');
          Alert.alert('Check Your Email!', `A 6-digit verification code has been sent to ${email.toLowerCase()}. It expires in 10 minutes.`);
        } else {
          Alert.alert('Error', result.error || 'This email or reg number already exists');
        }
      } else {
        if (!loginReg || !password) {
          Alert.alert('Error', 'Please enter your reg number and password'); return;
        }
        if (!validateRegNumber(loginReg.toUpperCase())) {
          Alert.alert('Invalid', 'Please enter a valid reg number e.g. R2211952R'); return;
        }
        const emailToUse = `${loginReg.toLowerCase()}@students.msu.ac.zw`;
        const result = await loginStudent(emailToUse, password);
        if (result.success) {
          if (rememberMe) {
            await AsyncStorage.setItem('student_remember', JSON.stringify({ reg: loginReg, password, rememberMe: true }));
          } else {
            await AsyncStorage.removeItem('student_remember');
          }
          await AsyncStorage.setItem('current_student', JSON.stringify(result.student));
          router.push('/student-home');
        } else if (result.error === 'unverified') {
          setPendingEmail(result.email || emailToUse);
          setIsOTPScreen(true);
          Alert.alert('Not Verified', 'Your email is not verified. We have sent a new OTP to your email.');
          await resendStudentOTP(result.email || emailToUse);
        } else {
          Alert.alert('Login Failed', 'Incorrect reg number or password');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Screen
  if (isOTPScreen) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Ionicons name="mail-open" size={70} color="#1D9E75" />
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
          <Text style={[styles.subtitle, { color: '#FFD700', fontWeight: 'bold' }]}>{pendingEmail}</Text>
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="key-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { letterSpacing: 8, fontSize: 22, fontWeight: 'bold' }]}
            placeholder="000000"
            placeholderTextColor="#aaa"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify Email'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
          <Text style={styles.switchText}>Didn't get the code? Resend OTP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { setIsOTPScreen(false); setOtpCode(''); }}
        >
          <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={70} color="#1D9E75" />
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Student Login'}</Text>
        <Text style={styles.subtitle}>{isSignUp ? 'Register your MSU student account' : 'Welcome back, student!'}</Text>
      </View>

      {isSignUp && (
        <>
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
            <TextInput
              style={styles.input}
              placeholder="Reg Number e.g. R2211952R"
              placeholderTextColor="#aaa"
              value={regNumber}
              onChangeText={handleRegNumberChange}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: '#a0c4ff' }]}
              placeholder="Email (auto-filled from reg number)"
              placeholderTextColor="#aaa"
              value={email}
              editable={false}
            />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="phone-portrait-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Phone e.g. 0771234567" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </>
      )}

      {!isSignUp && (
        <View style={styles.inputBox}>
          <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Reg Number e.g. R2211952R"
            placeholderTextColor="#aaa"
            value={loginReg}
            onChangeText={(t) => setLoginReg(t.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>
      )}

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaa" value={password}
          onChangeText={(t) => { setPassword(t); setPasswordStrength(getPasswordStrength(t)); }}
          secureTextEntry={!showPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {isSignUp && password.length > 0 && (
        <View style={styles.strengthBox}>
          <View style={styles.strengthBar}>
            <View style={[styles.strengthFill, { width: passwordStrength === 'Weak' ? '33%' : passwordStrength === 'Medium' ? '66%' : '100%', backgroundColor: getStrengthColor() }]} />
          </View>
          <Text style={[styles.strengthText, { color: getStrengthColor() }]}>{passwordStrength} password</Text>
        </View>
      )}

      {isSignUp && (
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>
      )}

      {isSignUp && (
        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
          <Text style={styles.hintText}>Password must be 8+ chars with uppercase, lowercase, number and special character e.g. Campus@2026</Text>
        </View>
      )}

      {!isSignUp && (
        <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setPassword(''); setConfirmPassword(''); setPasswordStrength(''); setRegNumber(''); setEmail(''); }}>
        <Text style={styles.switchText}>{isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}</Text>
      </TouchableOpacity>

      {!isSignUp && (
        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
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
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0a2a4a', padding: 12, borderRadius: 10, marginBottom: 16, gap: 8 },
  hintText: { color: '#a0c4ff', fontSize: 12, flex: 1 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#1D9E75' },
  rememberText: { color: '#a0c4ff', fontSize: 14 },
  btn: { backgroundColor: '#1D9E75', width: '100%', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  switchText: { color: '#a0c4ff', fontSize: 14, marginBottom: 16, textDecorationLine: 'underline' },
  forgotText: { color: '#FFD700', fontSize: 14, marginBottom: 16, textDecorationLine: 'underline' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backText: { color: '#a0c4ff', fontSize: 14 },
});
