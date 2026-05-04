import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from './_layout';

const SETTINGS_KEY = 'campusiq_personal_settings';

export default function AppSettings() {
  const router = useRouter();
  const theme = useAppTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [appTheme, setAppTheme] = useState('dark');
  const [notifSound, setNotifSound] = useState(true);
  const [compactCards, setCompactCards] = useState(false);
  const [vibration, setVibration] = useState(true);
  const [language, setLanguage] = useState('English');
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); checkAdmin(); }, []);

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    setIsAdmin(!!admin);
  };

  const loadSettings = async () => {
    try {
      const s = await AsyncStorage.getItem(SETTINGS_KEY);
      if (s) {
        const p = JSON.parse(s);
        setFontSize(p.fontSize || 'medium');
        setAppTheme(p.theme || 'dark');
        setNotifSound(p.notifSound !== false);
        setCompactCards(p.compactCards || false);
        setVibration(p.vibration !== false);
        setLanguage(p.language || 'English');
      }
    } catch (e) {}
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      const s = await AsyncStorage.getItem(SETTINGS_KEY);
      const current = s ? JSON.parse(s) : {};
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, [key]: value }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {}
  };

  const isLight = appTheme === 'light';
  const bg = isLight ? '#f4f6fb' : '#001f4d';
  const cardBg = isLight ? '#ffffff' : '#0a2a4a';
  const textColor = isLight ? '#1a1a2e' : '#ffffff';
  const subColor = isLight ? '#445566' : '#a0c4ff';
  const borderColor = isLight ? '#c8d4e8' : '#534AB7';
  const accentColor = isLight ? '#1a1a2e' : '#FFD700';
  const fs = theme.fontSize;

  const FONT_SIZES = [
    { key: 'small', label: 'Small', size: 12 },
    { key: 'medium', label: 'Medium', size: 15 },
    { key: 'large', label: 'Large', size: 18 },
    { key: 'xlarge', label: 'Very Large', size: 21 },
  ];

  const THEMES = [
    { key: 'dark', label: 'Dark (MSU Blue)', emoji: '🌙', bg: '#001f4d', accent: '#FFD700' },
    { key: 'light', label: 'Light', emoji: '☀️', bg: '#f4f6fb', accent: '#1D9E75' },
    { key: 'green', label: 'MSU Green', emoji: '🌿', bg: '#0a3d2e', accent: '#1D9E75' },
    { key: 'purple', label: 'Purple', emoji: '💜', bg: '#1a1650', accent: '#9b7fe8' },
  ];

  const PREFS = [
    { icon: 'volume-high-outline', label: 'Notification Sound', sub: 'Play sound for notifications', val: notifSound, setter: setNotifSound, key: 'notifSound', color: '#1D9E75' },
    { icon: 'phone-portrait-outline', label: 'Vibration', sub: 'Vibrate for notifications', val: vibration, setter: setVibration, key: 'vibration', color: '#534AB7' },
    { icon: 'grid-outline', label: 'Compact Cards', sub: 'Smaller cards on home screen', val: compactCards, setter: setCompactCards, key: 'compactCards', color: '#D85A30' },
  ];

  const LANGUAGES = [
    { key: 'English', label: 'English', flag: '🇬🇧', available: true },
    { key: 'Shona', label: 'Shona', flag: '🇿🇼', available: false },
    { key: 'Ndebele', label: 'Ndebele', flag: '🇿🇼', available: false },
  ];

  const UPCOMING = [
    { icon: 'logo-apple', color: '#a0c4ff', text: 'iOS Version', sub: 'iPhone & iPad support coming soon' },
    { icon: 'chatbubble-ellipses-outline', color: '#1D9E75', text: 'SMS Notifications', sub: 'Get alerts via SMS on your phone' },
    { icon: 'restaurant-outline', color: '#EF9F27', text: 'DH Menu', sub: 'View dining hall menu daily' },
    { icon: 'bag-handle-outline', color: '#534AB7', text: 'Pre-Orders', sub: 'Order food and items in advance' },
    { icon: 'trophy-outline', color: '#FFD700', text: 'Student Rewards', sub: 'Earn points for attendance and participation' },
    { icon: 'calendar-outline', color: '#D85A30', text: 'Event Booking', sub: 'Book seats for campus events' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: isLight ? '#1a1650' : '#0a2a4a' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Settings</Text>
        <View style={[styles.savedBadge, { opacity: saved ? 1 : 0 }]}>
          <Ionicons name="checkmark-circle" size={16} color="#1D9E75" />
          <Text style={styles.savedText}>Saved</Text>
        </View>
      </View>

      <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor }]}>
        <Ionicons name="person-circle-outline" size={20} color="#1D9E75" />
        <Text style={[styles.infoText, { color: subColor, fontSize: fs - 2 }]}>Personal settings — only affect your experience</Text>
      </View>

      {/* PREVIEW */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[{ fontWeight: 'bold', color: accentColor, fontSize: fs + 4, marginBottom: 8 }]}>Preview</Text>
        <Text style={[{ color: textColor, fontSize: fs, lineHeight: 24, marginBottom: 4 }]}>This is how your text looks with current settings.</Text>
        <Text style={[{ color: subColor, fontSize: fs - 2 }]}>Sub-text and details appear like this.</Text>
      </View>

      {/* THEME */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>🎨 App Theme</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {THEMES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.themeRow, { borderColor: appTheme === t.key ? t.accent : 'transparent', backgroundColor: appTheme === t.key ? t.accent + '18' : 'transparent' }]}
            onPress={() => { setAppTheme(t.key); saveSetting('theme', t.key); }}
          >
            <View style={[styles.themeCircle, { backgroundColor: t.bg, borderColor: t.accent }]} />
            <Text style={[{ flex: 1, fontWeight: '600', color: textColor, fontSize: fs }]}>{t.emoji}  {t.label}</Text>
            <View style={[styles.radioOuter, { borderColor: appTheme === t.key ? t.accent : borderColor }]}>
              {appTheme === t.key && <View style={[styles.radioInner, { backgroundColor: t.accent }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* FONT SIZE */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>🔤 Font Size</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.fontRow}>
          {FONT_SIZES.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.fontBtn, { borderColor: fontSize === f.key ? '#1D9E75' : borderColor, backgroundColor: fontSize === f.key ? (isLight ? '#e8f5f0' : '#0a3d2e') : 'transparent' }]}
              onPress={() => { setFontSize(f.key); saveSetting('fontSize', f.key); }}
            >
              <Text style={[{ fontSize: f.size, fontWeight: 'bold', color: fontSize === f.key ? '#1D9E75' : textColor, marginBottom: 4 }]}>Aa</Text>
              <Text style={[{ color: fontSize === f.key ? '#1D9E75' : subColor, fontSize: 10, textAlign: 'center' }]}>{f.label}</Text>
              {fontSize === f.key && <Ionicons name="checkmark-circle" size={14} color="#1D9E75" style={{ position: 'absolute', top: 4, right: 4 }} />}
            </TouchableOpacity>
          ))}
        </View>
        <View style={[{ padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', backgroundColor: isLight ? '#f0f4f8' : '#001f4d', borderColor }]}>
          <Text style={{ color: textColor, fontSize: fs, fontWeight: 'bold' }}>Current: {FONT_SIZES.find(f => f.key === fontSize)?.label}</Text>
        </View>
      </View>

      {/* LANGUAGE */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>🌍 Language</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {LANGUAGES.map((lang, i) => (
          <TouchableOpacity
            key={lang.key}
            style={[styles.langRow, i < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }, !lang.available && { opacity: 0.6 }]}
            onPress={() => {
              if (!lang.available) {
                Alert.alert('Coming Soon', `${lang.label} translation is being developed and will be available in a future update.`);
                return;
              }
              setLanguage(lang.key);
              saveSetting('language', lang.key);
            }}
          >
            <Text style={{ fontSize: fs + 4 }}>{lang.flag}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[{ fontWeight: '600', color: textColor, fontSize: fs }]}>{lang.label}</Text>
              {!lang.available && <Text style={[{ color: subColor, fontSize: fs - 3 }]}>Coming soon</Text>}
            </View>
            {lang.available ? (
              <View style={[styles.radioOuter, { borderColor: language === lang.key ? '#1D9E75' : borderColor }]}>
                {language === lang.key && <View style={[styles.radioInner, { backgroundColor: '#1D9E75' }]} />}
              </View>
            ) : (
              <View style={[styles.comingSoonBadge, { backgroundColor: isLight ? '#f0f4f8' : '#1a1650' }]}>
                <Text style={[{ color: subColor, fontSize: 10, fontWeight: 'bold' }]}>SOON</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* PREFERENCES */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>🔔 Preferences</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        {PREFS.map((item, i) => (
          <View key={item.key}>
            {i > 0 && <View style={[{ height: 1, marginVertical: 12, backgroundColor: borderColor }]} />}
            <View style={styles.switchRow}>
              <View style={[styles.switchIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontWeight: '600', color: textColor, fontSize: fs, marginBottom: 2 }]}>{item.label}</Text>
                <Text style={[{ color: subColor, fontSize: fs - 3 }]}>{item.sub}</Text>
              </View>
              <Switch
                value={item.val}
                onValueChange={(v) => { item.setter(v); saveSetting(item.key, v); }}
                trackColor={{ false: isLight ? '#c8d4e8' : '#2a2a4a', true: item.color }}
                thumbColor="#ffffff"
                ios_backgroundColor={isLight ? '#c8d4e8' : '#2a2a4a'}
              />
            </View>
          </View>
        ))}
      </View>

      {/* ADMIN */}
      {isAdmin && (
        <>
          <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>⚙️ Admin Controls</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/emergency-services')}>
              <View style={[styles.switchIcon, { backgroundColor: '#D85A3022' }]}>
                <Ionicons name="medical-outline" size={20} color="#D85A30" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ fontWeight: '600', color: textColor, fontSize: fs }]}>Emergency Contacts</Text>
                <Text style={[{ color: subColor, fontSize: fs - 3 }]}>Edit contacts visible to all users</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={subColor} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ABOUT */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>ℹ️ About Campus IQ</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.aboutHeader}>
          <View style={[styles.aboutIcon, { backgroundColor: isLight ? '#f0f4f8' : '#001f4d', borderColor: '#534AB7' }]}>
            <Ionicons name="school" size={36} color={isLight ? '#534AB7' : '#FFD700'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[{ fontWeight: 'bold', color: isLight ? '#534AB7' : '#FFD700', fontSize: fs + 4 }]}>Campus IQ</Text>
            <Text style={[{ color: subColor, fontSize: fs - 2, marginTop: 2 }]}>Smart Campus Companion</Text>
            <Text style={[{ color: subColor, fontSize: fs - 3, marginTop: 2 }]}>Version 1.0.0 · MSU 2026</Text>
          </View>
        </View>

        {[
          ['University', 'Midlands State University'],
          ['Faculty', 'Faculty of Business Sciences'],
          ['Department', 'Information & Marketing Sciences'],
          ['Degree', 'BCom Honours Information Systems'],
          ['Backend', 'Supabase · PostgreSQL · Real-time'],
          ['Platform', 'React Native · Expo SDK 54'],
        ].map(([label, value]) => (
          <View key={label} style={[styles.aboutRow, { borderBottomColor: borderColor }]}>
            <Text style={[{ color: subColor, fontSize: fs - 2, flex: 1 }]}>{label}</Text>
            <Text style={[{ color: textColor, fontSize: fs - 1, fontWeight: '600', flex: 1, textAlign: 'right' }]}>{value}</Text>
          </View>
        ))}

        {/* SUPERVISOR */}
        <View style={[styles.supervisorBox, { backgroundColor: isLight ? '#f0f4f8' : '#001f4d', borderColor: '#1D9E75' }]}>
          <Text style={[{ color: '#1D9E75', fontWeight: 'bold', fontSize: fs, marginBottom: 8 }]}>👩‍🏫 Project Supervisor</Text>
          <Text style={[{ color: textColor, fontWeight: 'bold', fontSize: fs + 1, marginBottom: 2 }]}>Mrs. Marambi</Text>
          <Text style={[{ color: subColor, fontSize: fs - 1, marginBottom: 6 }]}>Midlands State University · ICT Department</Text>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:marambis@staff.msu.ac.zw')}>
            <Ionicons name="mail-outline" size={18} color="#1D9E75" />
            <Text style={[{ color: '#1D9E75', fontSize: fs - 1, fontWeight: '600' }]}>marambis@staff.msu.ac.zw</Text>
          </TouchableOpacity>
        </View>

        {/* DEVELOPER */}
        <View style={[styles.devBox, { backgroundColor: isLight ? '#f0f4f8' : '#001f4d', borderColor }]}>
          <Text style={[{ color: isLight ? '#534AB7' : '#FFD700', fontWeight: 'bold', fontSize: fs, marginBottom: 6 }]}>👨‍💻 Developer</Text>
          <Text style={[{ color: textColor, fontWeight: 'bold', fontSize: fs + 2 }]}>Paneinyasha N Makuvire</Text>
          <Text style={[{ color: isLight ? '#534AB7' : '#FFD700', fontWeight: 'bold', fontSize: fs - 1, marginBottom: 8 }]}>R2211952R</Text>
          {[
            { icon: 'mail-outline', text: 'paneinyashamakuvire@gmail.com', url: 'mailto:paneinyashamakuvire@gmail.com' },
            { icon: 'school-outline', text: 'r2211952r@students.msu.ac.zw', url: 'mailto:r2211952r@students.msu.ac.zw' },
            { icon: 'call-outline', text: '+263 077 779 1206', url: 'tel:+2630777791206' },
          ].map(item => (
            <TouchableOpacity key={item.text} style={styles.contactRow} onPress={() => Linking.openURL(item.url)}>
              <Ionicons name={item.icon as any} size={18} color="#1D9E75" />
              <Text style={[{ color: '#1D9E75', fontSize: fs - 1, fontWeight: '600' }]}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* UPCOMING FEATURES */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>🚀 Upcoming Features</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[{ color: subColor, fontSize: fs - 2, marginBottom: 14 }]}>Features currently in development for future Campus IQ updates:</Text>
        {UPCOMING.map((item, i) => (
          <View key={i} style={[styles.upcomingRow, i < UPCOMING.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <View style={[styles.upcomingIcon, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontWeight: '600', color: textColor, fontSize: fs }]}>{item.text}</Text>
              <Text style={[{ color: subColor, fontSize: fs - 3, marginTop: 2 }]}>{item.sub}</Text>
            </View>
            <View style={[styles.comingSoonBadge, { backgroundColor: isLight ? '#f0f4f8' : '#1a1650', borderColor: borderColor }]}>
              <Text style={[{ color: subColor, fontSize: 9, fontWeight: 'bold' }]}>COMING</Text>
            </View>
          </View>
        ))}
      </View>

      {/* RESET */}
      <Text style={[styles.sectionTitle, { color: accentColor, fontSize: fs }]}>🔄 Reset</Text>
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <TouchableOpacity style={[styles.resetBtn, { borderColor: '#D85A30' }]} onPress={() => {
          Alert.alert('Reset Settings', 'Reset all personal settings to default?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reset', style: 'destructive', onPress: async () => {
                await AsyncStorage.removeItem(SETTINGS_KEY);
                setFontSize('medium'); setAppTheme('dark');
                setNotifSound(true); setCompactCards(false); setVibration(true); setLanguage('English');
                Alert.alert('Reset', 'Settings restored to default');
              }
            }
          ]);
        }}>
          <Ionicons name="refresh-outline" size={20} color="#D85A30" />
          <Text style={[{ color: '#D85A30', fontWeight: 'bold', fontSize: fs }]}>Reset to Default Settings</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', flex: 1, textAlign: 'center' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedText: { color: '#1D9E75', fontSize: 13, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, lineHeight: 18 },
  sectionTitle: { fontWeight: 'bold', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  card: { marginHorizontal: 16, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 4 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, borderWidth: 2, marginBottom: 6 },
  themeCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 2 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  fontRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  fontBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 2, position: 'relative' },
  langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  comingSoonBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  aboutHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  aboutIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  supervisorBox: { marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1 },
  devBox: { marginTop: 14, padding: 14, borderRadius: 12, borderWidth: 1, gap: 6 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  upcomingIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
});