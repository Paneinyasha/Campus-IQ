import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loginStudent, registerStudent } from '../database/db';

export default function StudentLogin() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
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

  useEffect(() => {
    checkRemembered();
  }, []);

  const checkRemembered = async () => {
    try {
      const saved = await AsyncStorage.getItem('student_remember');
      if (saved) {
        const { reg, password } = JSON.parse(saved);
        setLoginReg(reg);
        setPassword(password);
        setRememberMe(true);
      }
    } catch (e) {}
  };

  const validateRegNumber = (reg: string) => {
    return /^R\d{7}R$/.test(reg);
  };

  const validateEmail = (em: string) => {
    return em.endsWith('@students.msu.ac.zw') && em.startsWith('R');
  };

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);
    const hasLength = pass.length >= 8;
    return hasUpper && hasLower && hasNumber && hasSpecial && hasLength;
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

  const handlePasswordChange = (pass: string) => {
    setPassword(pass);
    setPasswordStrength(getPasswordStrength(pass));
  };

  const getStrengthColor = () => {
    if (passwordStrength === 'Weak') return '#D85A30';
    if (passwordStrength === 'Medium') return '#FFD700';
    return '#1D9E75';
  };

  const handleSubmit = async () => {
    if (isSignUp) {
      if (!name || !surname || !program || !regNumber || !email || !phone || !password || !confirmPassword) {
        Alert.alert('Missing Fields', 'Please fill in all fields including phone number');
        return;
      }
      if (!validateRegNumber(regNumber)) {
        Alert.alert('Invalid Reg Number', 'Reg number must be in format R2211952R');
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert('Invalid Email', 'Email must be in format R2211952R@students.msu.ac.zw');
        return;
      }
      if (phone.length < 10) {
        Alert.alert('Invalid Phone', 'Please enter a valid phone number');
        return;
      }
      if (!validatePassword(password)) {
        Alert.alert('Weak Password', 'Password must be at least 8 characters with uppercase, lowercase, number and special character e.g. Campus@2026');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return;
      }

      const result = registerStudent(name, surname, program, regNumber, email, password, phone);

      if (result.success) {
        Alert.alert(
          'Account Created!',
          `Welcome to Campus IQ, ${name}! Your account has been created successfully. You can now log in using your reg number.`,
          [{ text: 'Login Now' }]
        );
        setIsSignUp(false);
        setName('');
        setSurname('');
        setProgram('');
        setRegNumber('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', 'This email or reg number already exists');
      }

    } else {
      if (!loginReg || !password) {
        Alert.alert('Error', 'Please enter your reg number and password');
        return;
      }
      if (!validateRegNumber(loginReg)) {
        Alert.alert('Invalid Reg Number', 'Please enter a valid reg number e.g. R2211952R');
        return;
      }

      const email = `${loginReg}@students.msu.ac.zw`;
      const result = loginStudent(email, password);

      if (result.success) {
        if (rememberMe) {
          await AsyncStorage.setItem('student_remember', JSON.stringify({ reg: loginReg, password }));
        } else {
          await AsyncStorage.removeItem('student_remember');
        }
        await AsyncStorage.setItem('current_student', JSON.stringify(result.student));
        router.push('/student-home');
      } else {
        Alert.alert('Login Failed', 'Incorrect reg number or password. Please check your details and try again.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <Ionicons name="person-circle" size={70} color="#1D9E75" />
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Student Login'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Register your MSU student account' : 'Welcome back, student!'}
        </Text>
      </View>

      {isSignUp && (
        <>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Surname"
              placeholderTextColor="#aaa"
              value={surname}
              onChangeText={setSurname}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="library-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Program e.g. BSc Computer Science"
              placeholderTextColor="#aaa"
              value={program}
              onChangeText={setProgram}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="card-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Reg Number e.g. R2211952R"
              placeholderTextColor="#aaa"
              value={regNumber}
              onChangeText={setRegNumber}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="R2211952R@students.msu.ac.zw"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="phone-portrait-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone e.g. 0771234567"
              placeholderTextColor="#aaa"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
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
            onChangeText={setLoginReg}
            autoCapitalize="characters"
          />
        </View>
      )}

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={handlePasswordChange}
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

      {isSignUp && password.length > 0 && (
        <View style={styles.strengthBox}>
          <View style={styles.strengthBar}>
            <View style={[
              styles.strengthFill,
              {
                width: passwordStrength === 'Weak' ? '33%' : passwordStrength === 'Medium' ? '66%' : '100%',
                backgroundColor: getStrengthColor()
              }
            ]} />
          </View>
          <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
            {passwordStrength} password
          </Text>
        </View>
      )}

      {isSignUp && (
        <View style={styles.inputBox}>
          <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#aaa"
            />
          </TouchableOpacity>
        </View>
      )}

      {isSignUp && (
        <View style={styles.hintBox}>
          <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
          <Text style={styles.hintText}>
            Password must be 8+ characters with uppercase, lowercase, number and special character e.g. Campus@2026
          </Text>
        </View>
      )}

      {!isSignUp && (
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
        <Text style={styles.btnText}>{isSignUp ? 'Create Account' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setIsSignUp(!isSignUp);
        setPassword('');
        setConfirmPassword('');
        setPasswordStrength('');
      }}>
        <Text style={styles.switchText}>
          {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </Text>
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#1D9E75',
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
  strengthBox: {
    width: '100%',
    marginBottom: 14,
    gap: 6,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#0a2a4a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 6,
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0a2a4a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  hintText: {
    color: '#a0c4ff',
    fontSize: 12,
    flex: 1,
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
    borderColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1D9E75',
  },
  rememberText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#1D9E75',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#a0c4ff',
    fontSize: 14,
    marginBottom: 16,
    textDecorationLine: 'underline',
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