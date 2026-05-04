import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Image, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function LostFound() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [userType, setUserType] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [foundAt, setFoundAt] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [contact, setContact] = useState('');
  const [staffId, setStaffId] = useState('');
  const [office, setOffice] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Documents', 'Keys', 'Bag', 'Wallet', 'Other'];

  useEffect(() => { loadUser(); loadItems(); }, []);

  const loadUser = async () => {
    const student = await AsyncStorage.getItem('current_student');
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    const admin = await AsyncStorage.getItem('current_admin');
    if (admin) { setCurrentUser(JSON.parse(admin)); setUserType('admin'); }
    else if (lecturer) { setCurrentUser(JSON.parse(lecturer)); setUserType('lecturer'); }
    else if (student) { setCurrentUser(JSON.parse(student)); setUserType('student'); }
  };

  const loadItems = async () => {
    const { data } = await supabase.from('lost_found').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const path = `lost-found/${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('campus-iq').upload(path, blob, { contentType: 'image/jpeg' });
      if (error) return '';
      const { data } = supabase.storage.from('campus-iq').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) { return ''; }
  };

  const handleSubmit = async () => {
    if (!itemName || !foundAt || !contact) { Alert.alert('Missing', 'Please fill in item name, found at location, and contact info'); return; }
    setLoading(true);
    try {
      let finalImageUrl = '';
      if (imageUri) {
        setUploading(true);
        finalImageUrl = await uploadImage(imageUri);
        setUploading(false);
      }

      const reporterName = currentUser?.name || 'Anonymous';
      const { error } = await supabase.from('lost_found').insert({
        item_name: itemName.trim(),
        category: itemCategory || 'Other',
        found_at: foundAt.trim(),
        submitted_to: submittedTo.trim(),
        contact: contact.trim(),
        staff_id: staffId.trim(),
        office: office.trim(),
        reported_by: reporterName,
        image_url: finalImageUrl || null,
        status: 'unclaimed',
      });

      if (error) throw error;
      Alert.alert('Submitted!', 'Lost item reported successfully.');
      setItemName(''); setItemCategory(''); setFoundAt(''); setSubmittedTo('');
      setContact(''); setStaffId(''); setOffice(''); setImageUri(''); setImageUrl('');
      setShowForm(false);
      loadItems();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setLoading(false); setUploading(false); }
  };

  const markClaimed = async (id: string) => {
    await supabase.from('lost_found').update({ status: 'claimed' }).eq('id', id);
    loadItems();
    setShowDetail(null);
  };

  const deleteItem = (item: any) => {
    Alert.alert('Delete', `Remove "${item.item_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('lost_found').delete().eq('id', item.id); loadItems(); } }
    ]);
  };

  const filtered = items.filter(i => {
    const matchSearch = i.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.found_at?.toLowerCase().includes(searchQuery.toLowerCase()) || i.category?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'all') return matchSearch;
    return matchSearch && i.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
        <Text style={styles.title}>Lost & Found</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={26} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['all', 'unclaimed', 'claimed'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countText}>{filtered.length} items</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#a0c4ff" />
        <TextInput style={styles.searchInput} placeholder="Search items..." placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Report Lost Item</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <View>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={styles.changeImageBtn} onPress={() => setImageUri('')}>
                    <Ionicons name="close-circle" size={22} color="#D85A30" />
                    <Text style={styles.changeImageText}>Remove photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerInner}>
                  <Ionicons name="camera-outline" size={32} color="#534AB7" />
                  <Text style={styles.imagePickerText}>Tap to add photo (optional)</Text>
                </View>
              )}
            </TouchableOpacity>

            {[
              { ph: 'Item Name *', val: itemName, set: setItemName },
              { ph: 'Found At (location) *', val: foundAt, set: setFoundAt },
              { ph: 'Submitted To (office/person)', val: submittedTo, set: setSubmittedTo },
              { ph: 'Contact (phone/email) *', val: contact, set: setContact },
              { ph: 'Your Staff/Student ID', val: staffId, set: setStaffId },
              { ph: 'Your Office/Room Number', val: office, set: setOffice },
            ].map((f, i) => (
              <View key={i} style={styles.inputBox}>
                <TextInput style={styles.input} placeholder={f.ph} placeholderTextColor="#aaa" value={f.val} onChangeText={f.set} />
              </View>
            ))}

            <Text style={styles.catLabel}>Category</Text>
            <View style={styles.catRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={[styles.catBtn, itemCategory === cat && styles.catBtnActive]} onPress={() => setItemCategory(cat)}>
                  <Text style={[styles.catBtnText, itemCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, (loading || uploading) && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading || uploading}>
                <Text style={styles.submitBtnText}>{uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptyText}>Tap + to report a lost item</Text>
          </View>
        ) : (
          filtered.map((item: any) => (
            <TouchableOpacity key={item.id} style={[styles.itemCard, item.status === 'claimed' && styles.itemCardClaimed]} onPress={() => setShowDetail(item)}>
              {/* Show image if available */}
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.itemCardImage} resizeMode="cover" />
              ) : (
                <View style={styles.itemCardNoImage}>
                  <Ionicons name="image-outline" size={28} color="#534AB7" />
                </View>
              )}
              <View style={styles.itemCardInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'claimed' ? '#0a3d2e' : '#3d1a0a', borderColor: item.status === 'claimed' ? '#1D9E75' : '#D85A30' }]}>
                    <Text style={[styles.statusBadgeText, { color: item.status === 'claimed' ? '#1D9E75' : '#D85A30' }]}>{item.status?.toUpperCase()}</Text>
                  </View>
                  {item.category && <Text style={styles.categoryText}>{item.category}</Text>}
                </View>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <View style={styles.itemMeta}>
                  <Ionicons name="location-outline" size={13} color="#a0c4ff" />
                  <Text style={styles.itemMetaText}>{item.found_at}</Text>
                </View>
                <View style={styles.itemMeta}>
                  <Ionicons name="person-outline" size={13} color="#a0c4ff" />
                  <Text style={styles.itemMetaText}>By {item.reported_by} · {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Item Detail Modal */}
      <Modal visible={!!showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {showDetail && (
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Item Details</Text>
                <TouchableOpacity onPress={() => setShowDetail(null)}><Ionicons name="close" size={26} color="#ffffff" /></TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image display */}
                {showDetail.image_url ? (
                  <Image source={{ uri: showDetail.image_url }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <View style={styles.modalNoImage}>
                    <Ionicons name="image-outline" size={48} color="#534AB7" />
                    <Text style={styles.modalNoImageText}>No photo</Text>
                  </View>
                )}

                <View style={[styles.statusBadge, { alignSelf: 'flex-start', margin: 16, marginBottom: 8, backgroundColor: showDetail.status === 'claimed' ? '#0a3d2e' : '#3d1a0a', borderColor: showDetail.status === 'claimed' ? '#1D9E75' : '#D85A30' }]}>
                  <Text style={[styles.statusBadgeText, { color: showDetail.status === 'claimed' ? '#1D9E75' : '#D85A30' }]}>{showDetail.status?.toUpperCase()}</Text>
                </View>

                <Text style={styles.modalItemName}>{showDetail.item_name}</Text>
                {showDetail.category && <Text style={styles.modalCategory}>{showDetail.category}</Text>}

                <View style={styles.detailsList}>
                  {[
                    { icon: 'location-outline', label: 'Found At', value: showDetail.found_at },
                    { icon: 'business-outline', label: 'Submitted To', value: showDetail.submitted_to },
                    { icon: 'call-outline', label: 'Contact', value: showDetail.contact },
                    { icon: 'card-outline', label: 'Staff ID', value: showDetail.staff_id },
                    { icon: 'home-outline', label: 'Office', value: showDetail.office },
                    { icon: 'person-outline', label: 'Reported By', value: showDetail.reported_by },
                    { icon: 'calendar-outline', label: 'Date Reported', value: new Date(showDetail.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  ].filter(d => d.value).map((d, i) => (
                    <View key={i} style={styles.detailRow}>
                      <View style={styles.detailIcon}><Ionicons name={d.icon as any} size={18} color="#1D9E75" /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>{d.label}</Text>
                        <Text style={styles.detailValue}>{d.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  {showDetail.status === 'unclaimed' && (
                    <TouchableOpacity style={styles.claimedBtn} onPress={() => markClaimed(showDetail.id)}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                      <Text style={styles.claimedBtnText}>Mark as Claimed</Text>
                    </TouchableOpacity>
                  )}
                  {(userType === 'admin' || userType === 'lecturer') && (
                    <TouchableOpacity style={styles.deleteItemBtn} onPress={() => deleteItem(showDetail)}>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.deleteItemBtnText}>Delete Report</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0a2a4a' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7' },
  filterBtnActive: { backgroundColor: '#534AB7' },
  filterBtnText: { color: '#a0c4ff', fontSize: 13 },
  filterBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  countText: { color: '#7a9cc4', fontSize: 12, marginLeft: 'auto' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a2a4a', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a2a3a' },
  searchInput: { flex: 1, fontSize: 14, color: '#ffffff' },
  form: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  imagePicker: { backgroundColor: '#001f4d', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', marginBottom: 12, overflow: 'hidden' },
  imagePickerInner: { alignItems: 'center', padding: 24, gap: 8 },
  imagePickerText: { color: '#a0c4ff', fontSize: 14 },
  imagePreview: { width: '100%', height: 180 },
  changeImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, backgroundColor: '#0a2a4a' },
  changeImageText: { color: '#D85A30', fontSize: 13 },
  inputBox: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 10 },
  input: { fontSize: 14, color: '#ffffff' },
  catLabel: { color: '#a0c4ff', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#534AB7' },
  catBtnActive: { backgroundColor: '#534AB7' },
  catBtnText: { color: '#a0c4ff', fontSize: 12 },
  catBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  formBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontWeight: 'bold' },
  submitBtn: { flex: 2, backgroundColor: '#534AB7', padding: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  itemCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, marginBottom: 12, flexDirection: 'row', overflow: 'hidden' },
  itemCardClaimed: { opacity: 0.7 },
  itemCardImage: { width: 90, height: 90 },
  itemCardNoImage: { width: 90, height: 90, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center' },
  itemCardInfo: { flex: 1, padding: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold' },
  categoryText: { color: '#a0c4ff', fontSize: 11 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  itemMetaText: { color: '#a0c4ff', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#001f4d', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  modalImage: { width: '100%', height: 220 },
  modalNoImage: { height: 120, backgroundColor: '#0a2a4a', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modalNoImageText: { color: '#a0c4ff', fontSize: 13 },
  modalItemName: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', paddingHorizontal: 16, marginBottom: 4 },
  modalCategory: { fontSize: 13, color: '#a0c4ff', paddingHorizontal: 16, marginBottom: 12 },
  detailsList: { padding: 16, paddingTop: 0 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#0a2a4a', borderRadius: 12, padding: 12, marginBottom: 8 },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#001f4d', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { color: '#a0c4ff', fontSize: 11, marginBottom: 2 },
  detailValue: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  modalActions: { padding: 16, paddingTop: 8, gap: 10 },
  claimedBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  claimedBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  deleteItemBtn: { backgroundColor: '#D85A30', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  deleteItemBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});