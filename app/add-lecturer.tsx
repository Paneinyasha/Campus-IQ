import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addLecturer } from '../database/db';

export default function AddLecturer() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAdd = () => {
    if (!name || !surname || !department || !email || !phone || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    const result = addLecturer(name, surname, department, email, password, phone);

    if (result.success) {
      Alert.alert(
        'Lecturer Added!',
        `Account created for ${name} ${surname}.\n\nLogin details:\nEmail: ${email}\nTemporary Password: ${password}\n\nThe lecturer will be asked to change their password on first login.`
      );
      setName('');
      setSurname('');
      setDepartment('');
      setEmail('');
      setPhone('');
      setPassword('');
    } else {
      Alert.alert('Error', 'This email already exists');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.header}>
        <Ionicons name="person-add" size={70} color="#1D9E75" />
        <Text style={styles.title}>Add Lecturer</Text>
        <Text style={styles.subtitle}>Create a new lecturer account</Text>
      </View>

      <View style={styles.noticebox}>
        <Ionicons name="information-circle-outline" size={18} color="#FFD700" />
        <Text style={styles.noticeText}>
          The lecturer will be required to change their password on first login
        </Text>
      </View>

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
        <Ionicons name="business-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Department e.g. Computer Science"
          placeholderTextColor="#aaa"
          value={department}
          onChangeText={setDepartment}
        />
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="mail-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
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

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Temporary Password e.g. MSU1234"
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

      <View style={styles.hintBox}>
        <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
        <Text style={styles.hintText}>
          Share the email and temporary password with the lecturer. They will be asked to set a new password on first login.
        </Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleAdd}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
        <Text style={styles.btnText}>Create Lecturer Account</Text>
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
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  noticeText: {
    color: '#FFD700',
    fontSize: 13,
    flex: 1,
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
  btn: {
    backgroundColor: '#1D9E75',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
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