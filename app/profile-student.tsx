import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

const AVATARS = [
  { id: 1, icon: 'person-circle', color: '#1D9E75' },
  { id: 2, icon: 'happy', color: '#534AB7' },
  { id: 3, icon: 'star', color: '#FFD700' },
  { id: 4, icon: 'heart', color: '#D85A30' },
  { id: 5, icon: 'rocket', color: '#a0c4ff' },
  { id: 6, icon: 'planet', color: '#F0997B' },
  { id: 7, icon: 'leaf', color: '#5DCAA5' },
  { id: 8, icon: 'flash', color: '#EF9F27' },
  { id: 9, icon: 'diamond', color: '#ED93B1' },
  { id: 10, icon: 'flame', color: '#E24B4A' },
  { id: 11, icon: 'game-controller', color: '#7F77DD' },
  { id: 12, icon: 'musical-notes', color: '#1D9E75' },
];

export default function ProfileStudent() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        const s = JSON.parse(saved);
        setStudent(s);
        if (s.avatar_id) setSelectedAvatar(s.avatar_id);
      }
    } catch (e) {}
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

  const getStrengthColor = () => {
    if (passwordStrength === 'Weak') return '#D85A30';
    if (passwordStrength === 'Medium') return '#FFD700';
    return '#1D9E75';
  };

  const saveAvatar = async () => {
    try {
      db.runSync(
        `UPDATE students SET avatar_id = ? WHERE id = ?`,
        [selectedAvatar, student.id]
      );
      const updated = { ...student, avatar_id: selectedAvatar };
      await AsyncStorage.setItem('current_student', JSON.stringify(updated));
      setStudent(updated);
      Alert.alert('Success', 'Avatar updated!');
    } catch (e) {
      Alert.alert('Error', 'Could not update avatar');
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields');
      return;
    }
    if (!validatePassword(newPassword)) {
      Alert.alert('Weak Password', 'New password must be 8+ characters with uppercase, lowercase, number and special character');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match');
      return;
    }

    try {
      const check = db.getFirstSync(
        `SELECT * FROM students WHERE id = ? AND password = ?`,
        [student.id, currentPassword]
      );
      if (!check) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }
      db.runSync(
        `UPDATE students SET password = ? WHERE id = ?`,
        [newPassword, student.id]
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (e) {
      Alert.alert('Error', 'Could not change password');
    }
  };

  const currentAvatar = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileBox}>
        <View style={[styles.bigAvatar, { borderColor: currentAvatar.color }]}>
          <Ionicons name={currentAvatar.icon as any} size={60} color={currentAvatar.color} />
        </View>
        <Text style={styles.profileName}>{student?.name} {student?.surname}</Text>
        <Text style={styles.profileReg}>{student?.reg_number}</Text>
        <Text style={styles.profileProgram}>{student?.program}</Text>
        <Text style={styles.profileEmail}>{student?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose Avatar</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarOption,
              selectedAvatar === avatar.id && { borderColor: avatar.color, borderWidth: 3 }
            ]}
            onPress={() => setSelectedAvatar(avatar.id)}
          >
            <Ionicons name={avatar.icon as any} size={32} color={avatar.color} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveAvatarBtn} onPress={saveAvatar}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
        <Text style={styles.saveAvatarBtnText}>Save Avatar</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Change Password</Text>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#aaa"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrent}
        />
        <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
          <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#aaa"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setPasswordStrength(getPasswordStrength(text));
          }}
          secureTextEntry={!showNew}
        />
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
          <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {newPassword.length > 0 && (
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

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.changePasswordBtn} onPress={changePassword}>
        <Ionicons name="key-outline" size={22} color="#ffffff" />
        <Text style={styles.changePasswordBtnText}>Change Password</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileBox: {
    alignItems: 'center',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  bigAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#001f4d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 14,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileReg: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 4,
  },
  profileProgram: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: '#7a9cc4',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
    letterSpacing: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a2a4a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
  },
  saveAvatarBtn: {
    backgroundColor: '#1D9E75',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  saveAvatarBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  inputIcon: { marginRight: 10 },
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
  changePasswordBtn: {
    backgroundColor: '#534AB7',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  changePasswordBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});