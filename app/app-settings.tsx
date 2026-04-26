import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View,
} from 'react-native';

// Personal settings — stored locally per device
const SETTINGS_KEY = 'campusiq_personal_settings';

export default function AppSettings() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [theme, setTheme] = useState('dark');
  const [notifSound, setNotifSound] = useState(true);
  const [compactCards, setCompactCards] = useState(false);

  useEffect(() => { loadSettings(); checkAdmin(); }, []);

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    setIsAdmin(!!admin);
  };

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        setFontSize(s.fontSize || 'medium');
        setTheme(s.theme || 'dark');
        setNotifSound(s.notifSound !== false);
        setCompactCards(s.compactCards || false);
      }
    } catch (e) {}
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      const current = saved ? JSON.parse(saved) : {};
      const updated = { ...current, [key]: value };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const bg = theme === 'light' ? '#f0f4f8' : '#001f4d';
  const cardBg = theme === 'light' ? '#ffffff' : '#0a2a4a';
  const textColor = theme === 'light' ? '#1a1a2e' : '#ffffff';
  const subColor = theme === 'light' ? '#555' : '#a0c4ff';
  const borderColor = theme === 'light' ? '#e0e0e0' : '#534AB7';

  const FONT_SIZES = [
    { key: 'small', label: 'Small', size: 13 },
    { key: 'medium', label: 'Medium', size: 15 },
    { key: 'large', label: 'Large', size: 18 },
    { key: 'xlarge', label: 'Extra Large', size: 21 },
  ];

  const THEMES = [
    { key: 'dark', label: 'Dark (MSU Blue)', emoji: '🌙', bg: '#001f4d' },
    { key: 'light', label: 'Light', emoji: '☀️', bg: '#f0f4f8' },
    { key: 'green', label: 'Green (MSU)', emoji: '🌿', bg: '#0a3d2e' },
    { key: 'purple', label: 'Purple', emoji: '💜', bg: '#1a1650' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme === 'light' ? '#1a1a2e' : '#fff'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFD700' }]}>Personal Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor }]}>
        <Ionicons name="person-circle-outline" size={20} color="#1D9E75" />
        <Text style={[styles.infoText, { color: subColor }]}>These settings are personal to your device only and do not affect other users</Text>
      </View>

      {/* THEME */}
      <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>App Theme</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {THEMES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.themeOption, theme === t.key && styles.themeOptionActive]}
            onPress={() => { setTheme(t.key); saveSettings('theme', t.key); Alert.alert('Theme Applied', `${t.label} theme set. Restart the app for full effect.`); }}
          >
            <View style={[styles.themePreview, { backgroundColor: t.bg }]} />
            <Text style={[styles.themeLabel, { color: textColor }]}>{t.emoji} {t.label}</Text>
            {theme === t.key && <Ionicons name="checkmark-circle" size={22} color="#1D9E75" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* FONT SIZE */}
      <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>Font Size</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.fontSizeRow}>
          {FONT_SIZES.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.fontSizeBtn, fontSize === f.key && styles.fontSizeBtnActive]}
              onPress={() => { setFontSize(f.key); saveSettings('fontSize', f.key); }}
            >
              <Text style={[styles.fontSizeSample, { fontSize: f.size }, fontSize === f.key && { color: '#fff' }]}>Aa</Text>
              <Text style={[styles.fontSizeLabel, fontSize === f.key && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.settingHint, { color: subColor }]}>Current: {FONT_SIZES.find(f => f.key === fontSize)?.label} — full effect on next app open</Text>
      </View>

      {/* OTHER SETTINGS */}
      <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>Preferences</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="volume-high-outline" size={22} color="#1D9E75" />
            <View>
              <Text style={[styles.settingLabel, { color: textColor }]}>Notification Sound</Text>
              <Text style={[styles.settingHint, { color: subColor }]}>Play sound for new notifications</Text>
            </View>
          </View>
          <Switch
            value={notifSound}
            onValueChange={(v) => { setNotifSound(v); saveSettings('notifSound', v); }}
            trackColor={{ false: '#534AB7', true: '#1D9E75' }}
            thumbColor="#ffffff"
          />
        </View>
        <View style={[styles.divider, { backgroundColor: borderColor }]} />
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="grid-outline" size={22} color="#534AB7" />
            <View>
              <Text style={[styles.settingLabel, { color: textColor }]}>Compact Cards</Text>
              <Text style={[styles.settingHint, { color: subColor }]}>Show smaller cards on home screen</Text>
            </View>
          </View>
          <Switch
            value={compactCards}
            onValueChange={(v) => { setCompactCards(v); saveSettings('compactCards', v); }}
            trackColor={{ false: '#534AB7', true: '#1D9E75' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* ADMIN APP SETTINGS */}
      {isAdmin && (
        <>
          <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>App-Wide Settings (Admin Only)</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.settingHint, { color: subColor, marginBottom: 14 }]}>These changes affect ALL users of the app</Text>
            <TouchableOpacity style={styles.adminSettingBtn} onPress={() => Alert.alert('Coming Soon', 'App-wide announcement banner settings coming in next update')}>
              <Ionicons name="megaphone-outline" size={22} color="#D85A30" />
              <View style={styles.adminSettingInfo}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Announcement Banner</Text>
                <Text style={[styles.settingHint, { color: subColor }]}>Show a message to all users on home screen</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={subColor} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.adminSettingBtn} onPress={() => Alert.alert('Coming Soon', 'Maintenance mode settings coming in next update')}>
              <Ionicons name="construct-outline" size={22} color="#FFD700" />
              <View style={styles.adminSettingInfo}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Maintenance Mode</Text>
                <Text style={[styles.settingHint, { color: subColor }]}>Temporarily disable student access</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={subColor} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.adminSettingBtn} onPress={() => router.push('/emergency-services')}>
              <Ionicons name="medical-outline" size={22} color="#1D9E75" />
              <View style={styles.adminSettingInfo}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Emergency Contacts</Text>
                <Text style={[styles.settingHint, { color: subColor }]}>Edit contacts shown to all users</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={subColor} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* RESET */}
      <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>Reset</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <TouchableOpacity style={styles.resetBtn} onPress={() => {
          Alert.alert('Reset Settings', 'Reset all personal settings to default?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: async () => {
              await AsyncStorage.removeItem(SETTINGS_KEY);
              setFontSize('medium'); setTheme('dark');
              setNotifSound(true); setCompactCards(false);
              Alert.alert('Reset', 'Settings restored to default');
            }}
          ]);
        }}>
          <Ionicons name="refresh-outline" size={20} color="#D85A30" />
          <Text style={styles.resetBtnText}>Reset to Default Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 16, marginTop: 16, marginBottom: 10, letterSpacing: 1 },
  card: { marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 8 },
  themeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderRadius: 10, paddingHorizontal: 4 },
  themeOptionActive: { backgroundColor: '#1D9E7522', borderRadius: 10 },
  themePreview: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#ffffff33' },
  themeLabel: { fontSize: 15, flex: 1, fontWeight: '600' },
  fontSizeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  fontSizeBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#0a2a4a' },
  fontSizeBtnActive: { backgroundColor: '#534AB7', borderColor: '#534AB7' },
  fontSizeSample: { fontWeight: 'bold', color: '#a0c4ff' },
  fontSizeLabel: { fontSize: 11, color: '#a0c4ff', marginTop: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingHint: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  adminSettingBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  adminSettingInfo: { flex: 1 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D85A30' },
  resetBtnText: { color: '#D85A30', fontWeight: 'bold', fontSize: 15 },
});
