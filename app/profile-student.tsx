import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export const AVATARS = [
  { id: 1, icon: 'paw', color: '#1D9E75', label: 'Dog' },
  { id: 2, icon: 'fish', color: '#378ADD', label: 'Fish' },
  { id: 3, icon: 'bug', color: '#D85A30', label: 'Bug' },
  { id: 4, icon: 'leaf', color: '#639922', label: 'Leaf' },
  { id: 5, icon: 'flower', color: '#ED93B1', label: 'Flower' },
  { id: 6, icon: 'planet', color: '#534AB7', label: 'Planet' },
  { id: 7, icon: 'rocket', color: '#EF9F27', label: 'Rocket' },
  { id: 8, icon: 'star', color: '#FFD700', label: 'Star' },
  { id: 9, icon: 'moon', color: '#7F77DD', label: 'Moon' },
  { id: 10, icon: 'sunny', color: '#E24B4A', label: 'Sun' },
  { id: 11, icon: 'medkit', color: '#F0997B', label: 'Medical' },
  { id: 12, icon: 'bandage', color: '#5DCAA5', label: 'Bandage' },
  { id: 13, icon: 'desktop', color: '#185FA5', label: 'Computer' },
  { id: 14, icon: 'phone-portrait', color: '#0F6E56', label: 'Phone' },
  { id: 15, icon: 'headset', color: '#993556', label: 'Headset' },
  { id: 16, icon: 'musical-notes', color: '#D85A30', label: 'Music' },
  { id: 17, icon: 'football', color: '#639922', label: 'Football' },
  { id: 18, icon: 'basketball', color: '#EF9F27', label: 'Basketball' },
  { id: 19, icon: 'book', color: '#534AB7', label: 'Book' },
  { id: 20, icon: 'flask', color: '#E24B4A', label: 'Science' },
  { id: 21, icon: 'calculator', color: '#378ADD', label: 'Math' },
  { id: 22, icon: 'brush', color: '#ED93B1', label: 'Art' },
  { id: 23, icon: 'camera', color: '#7F77DD', label: 'Camera' },
  { id: 24, icon: 'game-controller', color: '#1D9E75', label: 'Gaming' },
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

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        const s = JSON.parse(saved);
        setStudent(s);
        setSelectedAvatar(s.avatar_id || 1);
      }
    } catch (e) {}
  };

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

  const saveAvatar = async () => {
    try {
      await supabase.from('students').update({ avatar_id: selectedAvatar }).eq('id', student.id);
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
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .eq('password', currentPassword)
        .single();
      if (!data) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }
      await supabase.from('students').update({ password: newPassword }).eq('id', student.id);
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
        {student?.phone && (
          <Text style={styles.profilePhone}>{student?.phone}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
      <Text style={styles.sectionSub}>Tap to select, then tap Save Avatar</Text>

      <View style={styles.avatarGrid}>
        {AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            style={[
              styles.avatarOption,
              { borderColor: avatar.color },
              selectedAvatar === avatar.id && { borderWidth: 3, backgroundColor: avatar.color + '33' }
            ]}
            onPress={() => setSelectedAvatar(avatar.id)}
          >
            <Ionicons name={avatar.icon as any} size={28} color={avatar.color} />
            <Text style={[styles.avatarLabel, { color: avatar.color }]}>{avatar.label}</Text>
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
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  profileBox: { alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 16, padding: 24, marginBottom: 24 },
  bigAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#001f4d', alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 14 },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  profileReg: { fontSize: 14, color: '#FFD700', marginBottom: 4 },
  profileProgram: { fontSize: 13, color: '#a0c4ff', marginBottom: 4 },
  profileEmail: { fontSize: 12, color: '#7a9cc4', marginBottom: 2 },
  profilePhone: { fontSize: 12, color: '#7a9cc4' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 6, letterSpacing: 1 },
  sectionSub: { fontSize: 12, color: '#a0c4ff', marginBottom: 14 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  avatarOption: { width: 70, height: 70, borderRadius: 14, backgroundColor: '#0a2a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, gap: 4 },
  avatarLabel: { fontSize: 9, fontWeight: 'bold' },
  saveAvatarBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  saveAvatarBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', width: '100%', padding: 14, borderRadius: 12, marginBottom: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  strengthBox: { width: '100%', marginBottom: 14, gap: 6 },
  strengthBar: { height: 6, backgroundColor: '#0a2a4a', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: 6, borderRadius: 3 },
  strengthText: { fontSize: 12, fontWeight: 'bold' },
  changePasswordBtn: { backgroundColor: '#534AB7', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 },
  changePasswordBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
