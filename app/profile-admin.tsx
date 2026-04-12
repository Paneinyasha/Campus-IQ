import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AVATARS } from './profile-student';

export default function ProfileAdmin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(13);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const ADMIN_PASSWORD = '1945';

  useEffect(() => {
    loadAdmin();
  }, []);

  const loadAdmin = async () => {
    try {
      const saved = await AsyncStorage.getItem('current_admin');
      if (saved) {
        const a = JSON.parse(saved);
        setAdmin(a);
        if (a.avatar_id) setSelectedAvatar(a.avatar_id);
      }
    } catch (e) {}
  };

  const saveAvatar = async () => {
    try {
      const updated = { ...admin, avatar_id: selectedAvatar };
      await AsyncStorage.setItem('current_admin', JSON.stringify(updated));
      setAdmin(updated);
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
    if (currentPassword !== ADMIN_PASSWORD) {
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('Too Short', 'New password must be at least 4 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match');
      return;
    }
    Alert.alert(
      'Password Changed',
      'Your admin password has been updated. Please remember your new password.',
      [{ text: 'OK' }]
    );
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const currentAvatar = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[12];

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.profileBox}>
        <View style={[styles.bigAvatar, { borderColor: currentAvatar.color }]}>
          <Ionicons name={currentAvatar.icon as any} size={60} color={currentAvatar.color} />
        </View>
        <Text style={styles.profileName}>Campus Admin</Text>
        <Text style={styles.profileRole}>Super Administrator</Text>
        <Text style={styles.profileSub}>Midlands State University</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#D85A30" />
          <Text style={styles.adminBadgeText}>Full System Access</Text>
        </View>
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

      <View style={styles.warningBox}>
        <Ionicons name="warning-outline" size={18} color="#FFD700" />
        <Text style={styles.warningText}>
          Keep your admin password safe. If lost it cannot be recovered without developer access.
        </Text>
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#D85A30" style={styles.inputIcon} />
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
        <Ionicons name="lock-closed-outline" size={20} color="#D85A30" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="New Password"
          placeholderTextColor="#aaa"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNew}
        />
        <TouchableOpacity onPress={() => setShowNew(!showNew)}>
          <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={20} color="#D85A30" style={styles.inputIcon} />
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
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  bigAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
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
  profileRole: {
    fontSize: 14,
    color: '#D85A30',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileSub: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3d1a0a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D85A30',
  },
  adminBadgeText: {
    color: '#D85A30',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 6,
    letterSpacing: 1,
  },
  sectionSub: {
    fontSize: 12,
    color: '#a0c4ff',
    marginBottom: 14,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#0a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 4,
  },
  avatarLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  saveAvatarBtn: {
    backgroundColor: '#D85A30',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
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
  changePasswordBtn: {
    backgroundColor: '#D85A30',
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