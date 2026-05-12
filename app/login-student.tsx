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

  // Field errors
  const [nameError, setNameError] = useState('');
  const [surnameError, setSurnameError] = useState('');
  const [programError, setProgramError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [regError, setRegError] = useState('');
  const [emailError, setEmailError] = useState('');

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

  // ── VALIDATION HELPERS ──────────────────────────────────────

  // FIX: Allow typing letters, spaces, apostrophes, hyphens freely.
  // Only reject if a digit or disallowed special char is found.
  const hasInvalidNameChar = (val: string) => /[^a-zA-Z\s'\-]/.test(val);

  // Validate name — called on submit / blur, not on every keystroke
  const validateName = (val: string, field: string) => {
    if (!val.trim()) return `${field} is required`;
    if (/\d/.test(val)) return `${field} cannot contain numbers`;
    if (hasInvalidNameChar(val)) return `${field} should only contain letters`;
    if (val.trim().length < 2) return `${field} is too short`;
    return '';
  };

  // Live filter for name input — only block digits and truly invalid chars
  const handleNameChange = (text: string, setter: (v: string) => void, errSetter: (e: string) => void, field: string) => {
    // Strip digits silently (don't block input, just remove numbers)
    const filtered = text.replace(/[0-9]/g, '');
    if (filtered.length > 16) return; // max 16 characters
    setter(filtered);
    // Only show error if there's something obviously wrong
    if (filtered.length > 0 && hasInvalidNameChar(filtered)) {
      errSetter(`${field} should only contain letters`);
    } else {
      errSetter('');
    }
  };

  // Validate program (letters + numbers allowed e.g. "BSc Computer Science")
  const validateProgram = (val: string) => {
    if (!val.trim()) return 'Program is required';
    if (val.trim().length < 3) return 'Program name is too short';
    if (/^\d+$/.test(val.trim())) return 'Program cannot be only numbers';
    return '';
  };

  // Validate phone — Zimbabwe number rules
  const validatePhone = (val: string) => {
    if (!val.trim()) return 'Phone number is required';
    const cleaned = val.replace(/[\s\-()]/g, '');

    // International format: +263XXXXXXXXX (13 chars total)
    if (cleaned.startsWith('+263')) {
      if (cleaned.length !== 13) return 'International number must be +263 followed by 9 digits';
      if (!/^\+263\d{9}$/.test(cleaned)) return 'Invalid international format. Use +263771234567';
      return '';
    }

    // Local format: 0XXXXXXXXX (10 digits)
    if (cleaned.startsWith('0')) {
      if (cleaned.length !== 10) return 'Local number must be 10 digits starting with 0';
      if (!/^0\d{9}$/.test(cleaned)) return 'Invalid local format. Use 0771234567';
      return '';
    }

    // Pure digits without prefix — allow if exactly 9 or 10
    if (/^\d+$/.test(cleaned)) {
      if (cleaned.length > 10) return 'Phone number cannot exceed 10 digits';
      if (cleaned.length < 9) return 'Phone number is too short';
      return '';
    }

    return 'Enter a valid Zimbabwe phone number (e.g. 0771234567 or +263771234567)';
  };

  const validateReg = (r: string) => {
    if (!r.trim()) return 'Registration number is required';
    const val = r.trim();
    if (val.length < 5) return 'Reg number is too short (minimum 5 characters)';
    if (val.length > 12) return 'Reg number is too long (maximum 12 characters)';
    // Must start with R, end with any letter A-Z, digits in between
    if (!/^R[0-9]+[A-Za-z]$/i.test(val)) return 'Format: starts with R, digits in middle, ends with any letter (e.g. R2211952R, R12345B)';
    return '';
  };

  const validateEmail = (e: string) => {
    if (!e.trim()) return 'Email is required';
    if (!e.toLowerCase().endsWith('@students.msu.ac.zw')) return 'Must be your MSU email: R2211952R@students.msu.ac.zw';
    return '';
  };

  // Auto-complete email from reg number
  const handleRegNumberChange = (text: string) => {
    const upper = text.toUpperCase().replace(/\s/g, '');
    if (upper.length > 12) return; // enforce max length
    setRegNumber(upper);
    setRegError('');
    // Auto-fill email once reg looks complete (valid pattern)
    if (/^R[0-9]+[A-Za-z]$/i.test(upper) && upper.length >= 5) {
      setEmail(`${upper}@students.msu.ac.zw`);
      setEmailError('');
    } else if (upper.length > 0) {
      setEmail(`${upper}@students.msu.ac.zw`);
    } else {
      setEmail('');
    }
  };

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

  // ── HANDLERS ────────────────────────────────────────────────

  const handleLogin = async () => {
    if (loading) return;
    const regErr = validateReg(loginReg);
    if (regErr) { Alert.alert('Invalid Reg Number', regErr); return; }
    if (!loginPassword) { Alert.alert('Missing', 'Please enter your password'); return; }
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
        Alert.alert('Account Suspended', `Your account has been suspended.\nReason: ${result.reason || 'Contact admin'}`);
      } else {
        Alert.alert('Login Failed', 'Incorrect reg number or password. Please check and try again.');
      }
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (loading) return;

    // Validate all fields
    const nErr = validateName(name, 'First name');
    const sErr = validateName(surname, 'Surname');
    const pErr = validateProgram(program);
    const rErr = validateReg(regNumber);
    const eErr = validateEmail(email);
    const phErr = validatePhone(phone);

    setNameError(nErr);
    setSurnameError(sErr);
    setProgramError(pErr);
    setRegError(rErr);
    setEmailError(eErr);
    setPhoneError(phErr);

    if (nErr || sErr || pErr || rErr || eErr || phErr) {
      Alert.alert('Fix Errors', 'Please correct the highlighted fields before continuing.');
      return;
    }

    if (strength === 'Weak' || password.length < 8) {
      Alert.alert('Weak Password', 'Password needs 8+ characters with uppercase, lowercase, number and special character.\n\nExample: Campus@2026');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match. Please check again.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerStudent(
        name.trim(), surname.trim(), program.trim(),
        regNumber.trim().toUpperCase(),
        email.trim().toLowerCase(),
        password, phone.trim()
      );
      if (result.success) {
        setPendingEmail(result.email || email.toLowerCase());
        setCooldown(60);
        if (result.otp) {
          setDevOtp(result.otp);
          Alert.alert(
            '✅ Account Created!',
            `Your verification code is:\n\n${result.otp}\n\nEnter this code on the next screen.\n⚠️ Save it now — it expires in 10 minutes.`,
            [{ text: 'Got it', onPress: () => setScreen('verify') }]
          );
        } else if (result.resent) {
          Alert.alert('Code Resent', 'A new verification code has been generated.', [{ text: 'OK', onPress: () => setScreen('verify') }]);
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
    if (!otpCode || otpCode.length !== 6) { Alert.alert('Invalid Code', 'Please enter the full 6-digit code'); return; }
    setLoading(true);
    try {
      const result = await verifyStudentOTP(pendingEmail, otpCode);
      if (result.success) {
        await AsyncStorage.setItem('current_student', JSON.stringify(result.student));
        Alert.alert('✅ Verified!', 'Welcome to Campus IQ!', [{ text: 'Continue', onPress: () => router.push('/student-home') }]);
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
        Alert.alert('Error', result.error || 'Could not resend code');
      }
    } finally { setLoading(false); }
  };

  // ── VERIFY SCREEN ────────────────────────────────────────────
  if (screen === 'verify') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={50} color="#1D9E75" />
        </View>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code for:</Text>
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
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Get a new code'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
          <Text style={styles.infoText}>Save your code immediately. Codes expire in 10 minutes.</Text>
        </View>

        <TouchableOpacity style={styles.backLink} onPress={() => { setScreen('signup'); setOtpCode(''); setDevOtp(''); }}>
          <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
          <Text style={styles.backLinkText}>Back to Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── SIGNUP SCREEN ────────────────────────────────────────────
  if (screen === 'signup') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Ionicons name="person-add" size={60} color="#1D9E75" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register your MSU student account</Text>

        {/* First Name */}
        <View style={[styles.inputBox, nameError ? styles.inputError : null]}>
          <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="First Name (letters only, max 16)"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={(t) => handleNameChange(t, setName, setNameError, 'First name')}
            autoCapitalize="words"
            keyboardType="default"
            maxLength={16}
          />
          {name.length > 0 && !nameError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
        </View>
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

        {/* Surname */}
        <View style={[styles.inputBox, surnameError ? styles.inputError : null]}>
          <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Surname (letters only, max 16)"
            placeholderTextColor="#aaa"
            value={surname}
            onChangeText={(t) => handleNameChange(t, setSurname, setSurnameError, 'Surname')}
            autoCapitalize="words"
            keyboardType="default"
            maxLength={16}
          />
          {surname.length > 0 && !surnameError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
        </View>
        {surnameError ? <Text style={styles.errorText}>{surnameError}</Text> : null}

        {/* Program */}
        <View style={[styles.inputBox, programError ? styles.inputError : null]}>
          <Ionicons name="library-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Program e.g. BSc Computer Science"
            placeholderTextColor="#aaa"
            value={program}
            onChangeText={(t) => { setProgram(t); setProgramError(validateProgram(t)); }}
            autoCapitalize="words"
          />
          {program.length > 0 && !programError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
        </View>
        {programError ? <Text style={styles.errorText}>{programError}</Text> : null}

        {/* Reg Number — auto-fills email */}
        <View style={[styles.inputBox, regError ? styles.inputError : null]}>
          <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Reg Number e.g. R2211952B"
            placeholderTextColor="#aaa"
            value={regNumber}
            onChangeText={handleRegNumberChange}
            autoCapitalize="characters"
            maxLength={12}
          />
          {regNumber.length > 0 && !regError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
        </View>
        {regError ? <Text style={styles.errorText}>{regError}</Text> : null}

        {/* Email — auto-filled */}
        <View style={[styles.inputBox, emailError ? styles.inputError : (email.endsWith('@students.msu.ac.zw') ? styles.inputSuccess : null)]}>
          <Ionicons name="mail-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email (auto-filled from reg)"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(validateEmail(t)); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {email.length > 0 && !emailError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        {/* Phone */}
        <View style={[styles.inputBox, phoneError ? styles.inputError : null]}>
          <Ionicons name="phone-portrait-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Phone e.g. 0771234567 or +263771234567"
            placeholderTextColor="#aaa"
            value={phone}
            onChangeText={(t) => { setPhone(t); setPhoneError(validatePhone(t)); }}
            keyboardType="phone-pad"
            maxLength={15}
          />
          {phone.length > 0 && !phoneError && <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />}
        </View>
        {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

        {/* Phone hint */}
        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={14} color="#a0c4ff" />
          <Text style={styles.hintText}>Local: 0771234567 (10 digits) · International: +263771234567 (13 chars)</Text>
        </View>

        {/* Password */}
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={(t) => { setPassword(t); setStrength(getStrength(t)); }}
            secureTextEntry={!showPassword}
          />
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

        {/* Confirm Password */}
        <View style={[styles.inputBox, confirmPassword.length > 0 && password !== confirmPassword ? styles.inputError : null]}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
          </TouchableOpacity>
        </View>
        {confirmPassword.length > 0 && password !== confirmPassword &&
          <Text style={styles.errorText}>Passwords do not match</Text>
        }

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#a0c4ff" />
          <Text style={styles.infoText}>After signup a verification code will appear. Save it immediately — it expires in 10 minutes.</Text>
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

  // ── LOGIN SCREEN ─────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="person-circle" size={80} color="#1D9E75" />
      <Text style={styles.title}>Student Login</Text>
      <Text style={styles.subtitle}>Welcome back to Campus IQ</Text>

      <View style={styles.inputBox}>
        <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Reg Number e.g. R2211952B"
          placeholderTextColor="#aaa"
          value={loginReg}
          onChangeText={setLoginReg}
          autoCapitalize="characters"
          maxLength={12}
        />
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={loginPassword}
          onChangeText={setLoginPassword}
          secureTextEntry={!showLoginPwd}
        />
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
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', width: '100%', padding: 14, borderRadius: 12, marginBottom: 4 },
  inputError: { borderColor: '#D85A30' },
  inputSuccess: { borderColor: '#1D9E75' },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  errorText: { color: '#D85A30', fontSize: 12, width: '100%', marginBottom: 8, marginTop: 2, paddingLeft: 4 },
  hintBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, width: '100%', marginBottom: 10, marginTop: 2 },
  hintText: { color: '#7a9cc4', fontSize: 11, flex: 1 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 10 },
  strengthBar: { flex: 1, height: 6, backgroundColor: '#0a2a4a', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: 'bold', minWidth: 50 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 16, marginTop: 8 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#1D9E75' },
  rememberText: { color: '#a0c4ff', fontSize: 14 },
  btn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, marginTop: 8 },
  btnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#a0c4ff', fontSize: 14, marginBottom: 12, textDecorationLine: 'underline' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0a2a4a', padding: 12, borderRadius: 10, marginBottom: 16, gap: 8, width: '100%' },
  infoText: { color: '#a0c4ff', fontSize: 12, flex: 1, lineHeight: 18 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backLinkText: { color: '#a0c4ff', fontSize: 14 },
});
