import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Linking, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

const DEFAULT_CONTACTS = [
  { title: 'Campus Security', number: '+263 54 223 113', icon: 'shield-checkmark', color: '#1D9E75', description: 'MSU Campus Security Control Room' },
  { title: 'MSU Health Centre', number: '+263 54 223 215', icon: 'medical', color: '#D85A30', description: 'Campus clinic and medical emergencies' },
  { title: 'Ambulance (Zimbabwe)', number: '994', icon: 'car', color: '#D85A30', description: 'National Emergency Ambulance' },
  { title: 'Police Emergency', number: '995', icon: 'call', color: '#534AB7', description: 'Zimbabwe Republic Police' },
  { title: 'Fire Brigade', number: '993', icon: 'flame', color: '#D85A30', description: 'Gweru City Fire Services' },
  { title: 'MSU Student Affairs', number: '+263 54 223 002', icon: 'people', color: '#534AB7', description: 'Student welfare and support' },
  { title: 'MSU Counselling', number: '+263 54 223 440', icon: 'heart', color: '#1D9E75', description: 'Mental health and counselling services' },
  { title: 'Gweru General Hospital', number: '+263 54 222 402', icon: 'business', color: '#D85A30', description: 'Nearest referral hospital' },
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
  const [contacts, setContacts] = useState(DEFAULT_CONTACTS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => { checkAdmin(); loadContacts(); }, []);

  useFocusEffect(useCallback(() => { loadContacts(); }, []));

  const checkAdmin = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    setIsAdmin(!!admin);
  };

  const loadContacts = async () => {
    try {
      const { data } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data && data.length > 0) {
        setContacts(data.map((c: any) => ({
          title: c.title,
          number: c.number,
          icon: c.icon || 'call',
          color: c.color || '#534AB7',
          description: c.description,
          id: c.id,
          sort_order: c.sort_order,
        })));
      }
    } catch (e) {
      // Use defaults if table doesn't exist yet
      setContacts(DEFAULT_CONTACTS);
    }
  };

  const openEdit = (index: number) => {
    const c = contacts[index];
    setEditingIndex(index);
    setEditTitle(c.title);
    setEditNumber(c.number);
    setEditDesc(c.description);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editTitle || !editNumber) { Alert.alert('Missing', 'Title and number are required'); return; }
    const updated = [...contacts];
    const c = updated[editingIndex!];
    updated[editingIndex!] = { ...c, title: editTitle, number: editNumber, description: editDesc };
    setContacts(updated);
    setShowEditModal(false);

    try {
      if ((c as any).id) {
        await supabase.from('emergency_contacts').update({
          title: editTitle, number: editNumber, description: editDesc,
        }).eq('id', (c as any).id);
      } else {
        await supabase.from('emergency_contacts').upsert({
          title: editTitle, number: editNumber, description: editDesc,
          icon: c.icon, color: c.color, sort_order: editingIndex,
        });
      }
      Alert.alert('✅ Updated', 'Contact updated. All users will see the new details.');
    } catch (e) {
      Alert.alert('Saved locally', 'Could not sync to database. Check your emergency_contacts table.');
    }
  };

  const deleteContact = (index: number) => {
    Alert.alert('Delete Contact', `Remove "${contacts[index].title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const c = contacts[index];
          const updated = contacts.filter((_, i) => i !== index);
          setContacts(updated);
          if ((c as any).id) {
            await supabase.from('emergency_contacts').delete().eq('id', (c as any).id);
          }
        }
      }
    ]);
  };

  const addContact = async () => {
    if (!newTitle || !newNumber) { Alert.alert('Missing', 'Title and number are required'); return; }
    const newContact = {
      title: newTitle, number: newNumber, description: newDesc,
      icon: 'call', color: '#534AB7', sort_order: contacts.length,
    };
    try {
      const { data } = await supabase.from('emergency_contacts').insert(newContact).select().single();
      setContacts(prev => [...prev, { ...newContact, id: data?.id }]);
    } catch (e) {
      setContacts(prev => [...prev, newContact]);
    }
    setNewTitle(''); setNewNumber(''); setNewDesc('');
    setShowAddModal(false);
    Alert.alert('✅ Added', 'New contact added. All users will see it.');
  };

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
        {isAdmin ? (
          <TouchableOpacity onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle-outline" size={26} color="#FFD700" />
          </TouchableOpacity>
        ) : <View style={{ width: 26 }} />}
      </View>

      {isAdmin && (
        <View style={styles.adminBanner}>
          <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
          <Text style={styles.adminBannerText}>Admin Mode — tap any contact to edit or delete</Text>
        </View>
      )}

      <View style={styles.alertBanner}>
        <Ionicons name="warning" size={24} color="#D85A30" />
        <Text style={styles.alertText}>In life-threatening emergency call 994 (Ambulance) or 995 (Police) immediately</Text>
      </View>

      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      {contacts.map((contact, i) => (
        <View key={i} style={[styles.contactCard, { borderLeftColor: contact.color }]}>
          <View style={[styles.contactIcon, { backgroundColor: contact.color + '22' }]}>
            <Ionicons name={contact.icon as any} size={28} color={contact.color} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>{contact.title}</Text>
            <Text style={styles.contactDesc}>{contact.description}</Text>
            <Text style={styles.contactNumber}>{contact.number}</Text>
          </View>
          <View style={styles.contactActions}>
            <TouchableOpacity style={[styles.callBtn, { backgroundColor: contact.color }]} onPress={() => call(contact.number)}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
            {isAdmin && (
              <View style={styles.adminBtns}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(i)}>
                  <Ionicons name="pencil-outline" size={16} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteContact(i)}>
                  <Ionicons name="trash-outline" size={16} color="#D85A30" />
                </TouchableOpacity>
              </View>
            )}
          </View>
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

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Contact</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="text-outline" size={18} color="#FFD700" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Contact Title" placeholderTextColor="#aaa" value={editTitle} onChangeText={setEditTitle} />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color="#FFD700" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#aaa" value={editNumber} onChangeText={setEditNumber} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="information-circle-outline" size={18} color="#FFD700" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#aaa" value={editDesc} onChangeText={setEditDesc} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Contact</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="text-outline" size={18} color="#1D9E75" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Contact Title e.g. Campus Clinic" placeholderTextColor="#aaa" value={newTitle} onChangeText={setNewTitle} />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={18} color="#1D9E75" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#aaa" value={newNumber} onChangeText={setNewNumber} keyboardType="phone-pad" />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="information-circle-outline" size={18} color="#1D9E75" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#aaa" value={newDesc} onChangeText={setNewDesc} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={addContact}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  adminBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2a1a00', borderWidth: 1, borderColor: '#FFD700', margin: 16, marginBottom: 0, padding: 12, borderRadius: 10 },
  adminBannerText: { color: '#FFD700', fontSize: 13 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', margin: 16, padding: 14, borderRadius: 12 },
  alertText: { color: '#ffaaaa', fontSize: 13, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginHorizontal: 16, marginTop: 8, marginBottom: 12, letterSpacing: 1 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderLeftWidth: 4, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 12, gap: 12 },
  contactIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  contactDesc: { fontSize: 12, color: '#a0c4ff', marginBottom: 4 },
  contactNumber: { fontSize: 14, color: '#FFD700', fontWeight: 'bold' },
  contactActions: { alignItems: 'center', gap: 6 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  callBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  adminBtns: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 6, backgroundColor: '#2a2000', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  deleteBtn: { padding: 6, backgroundColor: '#3d0a0a', borderRadius: 8, borderWidth: 1, borderColor: '#D85A30' },
  tipsCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 16 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  tipText: { color: '#a0c4ff', fontSize: 14, flex: 1, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  footerText: { color: '#FFD700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 12 },
  input: { flex: 1, color: '#fff', fontSize: 14 },
  saveBtn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
