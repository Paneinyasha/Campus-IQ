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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAdd = () => {
    if (!name || !surname || !department || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    const result = addLecturer(name, surname, department, email, password);

    if (result.success) {
      Alert.alert('Success', 'Lecturer account created successfully!');
      setName('');
      setSurname('');
      setDepartment('');
      setEmail('');
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
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Temporary Password"
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
          Share the email and temporary password with the lecturer so they can log in
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