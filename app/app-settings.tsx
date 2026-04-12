import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function AppSettings() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [radioEnabled, setRadioEnabled] = useState(true);
  const [attendanceQR, setAttendanceQR] = useState(true);
  const [attendanceBLE, setAttendanceBLE] = useState(true);
  const [quizzesEnabled, setQuizzesEnabled] = useState(true);

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete ALL app data including students, lecturers, timetables and attendance. This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Done', 'All data has been cleared. Please restart the app.');
            } catch (e) {
              Alert.alert('Error', 'Could not clear data');
            }
          }
        }
      ]
    );
  };

  const SettingRow = ({ icon, color, title, subtitle, value, onToggle }: any) => (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#1a1a2e', true: color + '88' }}
        thumbColor={value ? color : '#7a9cc4'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>App Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="settings-outline" size={20} color="#FFD700" />
        <Text style={styles.infoText}>
          Configure Campus IQ features and preferences
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Features</Text>

      <View style={styles.settingsCard}>
        <SettingRow
          icon="notifications-outline"
          color="#1D9E75"
          title="Push Notifications"
          subtitle="Send notifications to all users"
          value={notifications}
          onToggle={setNotifications}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="chatbubbles-outline"
          color="#534AB7"
          title="Student Chat"
          subtitle="Allow students to chat"
          value={chatEnabled}
          onToggle={setChatEnabled}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="radio-outline"
          color="#FFD700"
          title="MSU Radio"
          subtitle="Enable radio streaming"
          value={radioEnabled}
          onToggle={setRadioEnabled}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="clipboard-outline"
          color="#D85A30"
          title="Quizzes"
          subtitle="Enable quiz features"
          value={quizzesEnabled}
          onToggle={setQuizzesEnabled}
        />
      </View>

      <Text style={styles.sectionTitle}>Attendance</Text>

      <View style={styles.settingsCard}>
        <SettingRow
          icon="qr-code-outline"
          color="#1D9E75"
          title="QR Code Attendance"
          subtitle="Allow QR scanning for attendance"
          value={attendanceQR}
          onToggle={setAttendanceQR}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="bluetooth-outline"
          color="#534AB7"
          title="Bluetooth Attendance"
          subtitle="Allow BLE code attendance"
          value={attendanceBLE}
          onToggle={setAttendanceBLE}
        />
      </View>

      <Text style={styles.sectionTitle}>App Information</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Name</Text>
          <Text style={styles.infoValue}>Campus IQ</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Institution</Text>
          <Text style={styles.infoValue}>Midlands State University</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>iOS & Android</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Built With</Text>
          <Text style={styles.infoValue}>React Native + Expo</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database</Text>
          <Text style={styles.infoValue}>SQLite (Offline)</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Danger Zone</Text>

      <TouchableOpacity style={styles.dangerBtn} onPress={clearAllData}>
        <Ionicons name="trash-outline" size={22} color="#ffffff" />
        <Text style={styles.dangerBtnText}>Clear All App Data</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Campus IQ v1.0.0 © 2026</Text>
        <Text style={styles.footerText}>Midlands State University</Text>
      </View>

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
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  infoText: {
    color: '#FFD700',
    fontSize: 13,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  settingsCard: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#a0c4ff',
  },
  divider: {
    height: 1,
    backgroundColor: '#1a2a3a',
    marginHorizontal: 14,
  },
  infoCard: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: '#a0c4ff',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dangerBtn: {
    backgroundColor: '#D85A30',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  dangerBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 40,
  },
  footerText: {
    color: '#3a5a8a',
    fontSize: 12,
  },
});