import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const EMERGENCY_CONTACTS = [
  { title: 'Campus Security', number: '+263 54 223 113', icon: 'shield-checkmark', color: '#1D9E75', desc: 'MSU Campus Security Control Room' },
  { title: 'MSU Health Centre', number: '+263 54 223 215', icon: 'medical', color: '#D85A30', desc: 'Campus clinic and medical emergencies' },
  { title: 'Ambulance (Zimbabwe)', number: '994', icon: 'car', color: '#D85A30', desc: 'National Emergency Ambulance' },
  { title: 'Police Emergency', number: '995', icon: 'call', color: '#534AB7', desc: 'Zimbabwe Republic Police' },
  { title: 'Fire Brigade', number: '993', icon: 'flame', color: '#D85A30', desc: 'Gweru City Fire Services' },
  { title: 'MSU Student Affairs', number: '+263 54 223 002', icon: 'people', color: '#534AB7', desc: 'Student welfare and support' },
  { title: 'MSU Counselling', number: '+263 54 223 440', icon: 'heart', color: '#1D9E75', desc: 'Mental health and counselling services' },
  { title: 'Gweru General Hospital', number: '+263 54 222 402', icon: 'business', color: '#D85A30', desc: 'Nearest referral hospital' },
];

const SAFETY_TIPS = [
  'Always walk in groups at night on campus',
  'Save campus security number on your phone',
  'Know where the nearest clinic is located',
  'Report suspicious activity to security immediately',
  'Keep your ID card with you at all times',
  'In case of fire, use the nearest emergency exit',
];

export default function EmergencyServices() {
  const router = useRouter();

  const call = (number: string) => {
    Linking.openURL(`tel:${number.replace(/\s/g, '')}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Alert Banner */}
      <View style={styles.alertBanner}>
        <Ionicons name="warning" size={24} color="#D85A30" />
        <Text style={styles.alertText}>In life-threatening emergency, call 994 (Ambulance) or 995 (Police) immediately</Text>
      </View>

      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      {EMERGENCY_CONTACTS.map((contact, i) => (
        <View key={i} style={[styles.contactCard, { borderLeftColor: contact.color }]}>
          <View style={[styles.contactIcon, { backgroundColor: contact.color + '22' }]}>
            <Ionicons name={contact.icon as any} size={28} color={contact.color} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>{contact.title}</Text>
            <Text style={styles.contactDesc}>{contact.desc}</Text>
            <Text style={styles.contactNumber}>{contact.number}</Text>
          </View>
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: contact.color }]} onPress={() => call(contact.number)}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Campus Safety Tips</Text>
      <View style={styles.tipsCard}>
        {SAFETY_TIPS.map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={20} color="#FFD700" />
        <Text style={styles.footerText}>MSU Campus IQ — Your Safety Matters</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', margin: 16, padding: 14, borderRadius: 12 },
  alertText: { color: '#ffaaaa', fontSize: 13, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginHorizontal: 16, marginTop: 8, marginBottom: 12, letterSpacing: 1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderLeftWidth: 4, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 12, gap: 12 },
  contactIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  contactDesc: { fontSize: 12, color: '#a0c4ff', marginBottom: 4 },
  contactNumber: { fontSize: 14, color: '#FFD700', fontWeight: 'bold' },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  callBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  tipsCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  tipText: { color: '#a0c4ff', fontSize: 14, flex: 1, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  footerText: { color: '#FFD700', fontSize: 13 },
});
