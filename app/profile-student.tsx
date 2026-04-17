import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Added Supabase client
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

  useEffect(() => {
    loadStudent();
  }, []);

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

  // UPDATED: Now uses Supabase to update avatar
  const saveAvatar = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ avatar_id: selectedAvatar })
        .eq('id', student.id);

      if (error) throw error;

      const updated = { ...student, avatar_id: selectedAvatar };
      await AsyncStorage.setItem('current_student', JSON.stringify(updated));
      setStudent(updated);
      Alert.alert('Success', 'Avatar updated!');
    } catch (e) {
      Alert.alert('Error', 'Could not update avatar');
    }
  };

  // UPDATED: Now uses Supabase to change password
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
      // Verify current password first
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .eq('password', currentPassword)
        .maybeSingle();

      if (!data || error) {
        Alert.alert('Error', 'Current password is incorrect');
        return;
      }

      // Proceed with update
      const { error: updateError } = await supabase
        .from('students')
        .update({ password: newPassword })
        .eq('id', student.id);

      if (updateError) throw updateError;

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
      {/* ... (UI code remains the same) */}
