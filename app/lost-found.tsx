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
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Other');
  const [foundAt, setFoundAt] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [contact, setContact] = useState('');
  const [staffId, setStaffId] = useState('');
  const [office, setOffice] = useState('');
  const [imageUri, setImageUri] = useState('');

  const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Documents', 'Keys', 'Bag', 'Wallet', 'Other'];

  useEffect(() => { loadUser(); loadItems(); }, []);

  const loadUser = async () => {
    try {
      const admin = await AsyncStorage.getItem('current_admin');
      const lecturer = await AsyncStorage.getItem('current_lecturer');
      const student = await AsyncStorage.getItem('current_student');
      if (admin) { setCurrentUser(JSON.parse(admin)); setUserType('admin'); }
      else if (lecturer) { setCurrentUser(JSON.parse(lecturer)); setUserType('lecturer'); }
      else if (student) { setCurrentUser(JSON.parse(student)); setUserType('student'); }
    } catch (e) {}
  };

  const loadItems = async () => {
    try {
      const { data, error } = await supabase.from('lost_found').select('*').order('created_at', { ascending: false });
      if (error) { console.log('loadItems:', error.message); return; }
      setItems(data || []);
    } catch (e) {}
  };

  // Helper to get the real item name regardless of column name
  const getItemName = (item: any) => item.item_name || item.title || item.name || '';
  const getLocation = (item: any) => item.found_at || item.location || item.place || '';

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow access to photos'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (!result.canceled && result.assets?.[0]) setImageUri(result.assets[0].uri);
    } catch (e) {}
  };

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `lost-found/${Date.now()}.${ext}`;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const { error } = await supabase.storage.from('campus-iq').upload(path, blob, { contentType: 'image/jpeg' });
      if (error) { console.log('upload image error:', error.message); return ''; }
      const { data } = supabase.storage.from('campus-iq').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) { return ''; }
  };

  const resetForm = () => {
    setItemName(''); setItemCategory('Other'); setFoundAt('');
    setSubmittedTo(''); setContact(''); setStaffId(''); setOffice(''); setImageUri('');
  };

  const handleSubmit = async () => {
    if (!itemName.trim()) { Alert.alert('Missing', 'Item name is required'); return; }
    if (!foundAt.trim()) { Alert.alert('Missing', 'Found at location is required'); return; }
    setLoading(true);
    try {
      let finalImageUrl = '';
      if (imageUri) finalImageUrl = await uploadImage(imageUri);

      const reporterName = currentUser?.name
        ? `${currentUser.name} ${currentUser.surname || ''}`.trim()
        : 'Unknown';

      // Insert both title and item_name so whichever column exists will work
      const basePayload: any = {
        title: itemName.trim(),
        item_name: itemName.trim(),
        name: itemName.trim(),
        found_at: foundAt.trim(),
        location: foundAt.trim(),
        category: itemCategory,
        reported_by: reporterName,
        status: 'unclaimed',
      };
      if (submittedTo.trim()) basePayload.submitted_to = submittedTo.trim();
      if (contact.trim()) basePayload.contact = contact.trim();
      if (staffId.trim()) basePayload.staff_id = staffId.trim();
      if (office.trim()) basePayload.office = office.trim();
      if (finalImageUrl) basePayload.image_url = finalImageUrl;

      // Try inserting, strip problematic columns on error
      let { error } = await supabase.from('lost_found').insert(basePayload);
      if (error) {
        console.log('first attempt error:', error.message);
        // Extract column name from error and remove it
        const match = error.message.match(/"([^"]+)"/);
        if (match) delete basePayload[match[1]];
        const r2 = await supabase.from('lost_found').insert(basePayload);
        if (r2.error) {
          // Try with minimal payload
          const minPayload: any = {
            item_name: itemName.trim(),
            found_at: foundAt.trim(),
            category: itemCategory,
            reported_by: reporterName,
            status: 'unclaimed',
          };
          if (finalImageUrl) minPayload.image_url = finalImageUrl;
          const r3 = await supabase.from('lost_found').insert(minPayload);
          if (r3.error) throw r3.error;
        }
      }

      Alert.alert('✅ Submitted!', 'Lost item reported successfully.');
      resetForm(); setShowForm(false); loadItems();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit');
    } finally { setLoading(false); }
  };

  const markClaimed = async (id: string) => {
    await supabase.from('lost_found').update({ status: 'claimed' }).eq('id', id);
    loadItems(); setShowDetail(null);
  };

  const deleteItem = (item: any) => {
    Alert.alert('Delete', 'Remove this item report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('lost_found').delete().eq('id', item.id);
          loadItems(); setShowDetail(null);
        }
      }
    ]);
  };

  const filtered = items.filter(i => {
    const s = `${getItemName(i)} ${getLocation(i)} ${i.category || ''}`.toLowerCase();
    const match = s.includes(searchQuery.toLowerCase());
    return activeFilter === 'all' ? match : match && i.status === activeFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Lost & Found</Text>
        <TouchableOpacity onPress={() => { setShowForm(!showForm); if (showForm) resetForm(); }}>
          <Ionicons name={showForm ? 'close' : 'add'} size={26} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['all', 'unclaimed', 'claimed'].map(f => (
          <TouchableOpacity key={f} style={[styles.fBtn, activeFilter === f && styles.fBtnActive]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.fBtnText, activeFilter === f && styles.fBtnTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countText}>{filtered.length} items</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#a0c4ff" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Report Found Item</Text>

            <TouchableOpacity style={styles.imgPicker} onPress={pickImage}>
              {imageUri ? (
                <View>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8, backgroundColor: '#0a1a2e' }}
                    onPress={() => setImageUri('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#D85A30" />
                    <Text style={{ color: '#D85A30', fontSize: 13 }}>Remove photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: 'center', padding: 24, gap: 8 }}>
                  <Ionicons name="camera-outline" size={32} color="#534AB7" />
                  <Text style={{ color: '#a0c4ff', fontSize: 14 }}>Tap to add photo (optional)</Text>
                </View>
              )}
            </TouchableOpacity>

            {[
              { ph: 'Item Name *', val: itemName, set: setItemName },
              { ph: 'Found At (location) *', val: foundAt, set: setFoundAt },
              { ph: 'Submitted To (office/person)', val: submittedTo, set: setSubmittedTo },
              { ph: 'Contact (phone/email)', val: contact, set: setContact },
              { ph: 'Your Staff/Student ID', val: staffId, set: setStaffId },
              { ph: 'Your Office/Room Number', val: office, set: setOffice },
            ].map((f, i) => (
              <View key={i} style={styles.inputBox}>
                <TextInput style={styles.input} placeholder={f.ph} placeholderTextColor="#666" value={f.val} onChangeText={f.set} />
              </View>
            ))}

            <Text style={styles.catLabel}>Category</Text>
            <View style={styles.catWrap}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, itemCategory === cat && styles.catBtnActive]}
                  onPress={() => setItemCategory(cat)}
                >
                  <Text style={[styles.catBtnText, itemCategory === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); resetForm(); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {filtered.length === 0 && !showForm ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptyText}>Tap + to report a found item</Text>
          </View>
        ) : (
          filtered.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemCard, item.status === 'claimed' && { opacity: 0.7 }]}
              onPress={() => setShowDetail(item)}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.itemImg} resizeMode="cover" />
              ) : (
                <View style={styles.itemNoImg}>
                  <Ionicons name="image-outline" size={26} color="#534AB7" />
                </View>
              )}
              <View style={styles.itemInfo}>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <View style={[styles.itemStatus, {
                    borderColor: item.status === 'claimed' ? '#1D9E75' : '#D85A30',
                    backgroundColor: item.status === 'claimed' ? '#0a3d2e' : '#3d1a0a'
                  }]}>
                    <Text style={[styles.itemStatusText, { color: item.status === 'claimed' ? '#1D9E75' : '#D85A30' }]}>
                      {(item.status || 'unclaimed').toUpperCase()}
                    </Text>
                  </View>
                  {item.category && <Text style={styles.itemCat}>{item.category}</Text>}
                </View>
                <Text style={styles.itemName}>{getItemName(item)}</Text>
                <View style={styles.itemMeta}>
                  <Ionicons name="location-outline" size={13} color="#a0c4ff" />
                  <Text style={styles.itemMetaTxt}>{getLocation(item)}</Text>
                </View>
                <View style={styles.itemMeta}>
                  <Ionicons name="person-outline" size={13} color="#a0c4ff" />
                  <Text style={styles.itemMetaTxt}>By {item.reported_by}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Detail Modal — with full image display */}
      <Modal visible={!!showDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {showDetail && (
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Item Details</Text>
                <TouchableOpacity onPress={() => setShowDetail(null)}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>

                {/* IMAGE — full display at top of modal */}
                {showDetail.image_url ? (
                  <View>
                    <Image
                      source={{ uri: showDetail.image_url }}
                      style={{ width: '100%', height: 240 }}
                      resizeMode="cover"
                    />
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, alignItems: 'center' }}>
                      <Text style={{ color: '#a0c4ff', fontSize: 11 }}>📷 Photo of the item</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 120, backgroundColor: '#0a1a2e', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={48} color="#534AB7" />
                    <Text style={{ color: '#a0c4ff', marginTop: 8 }}>No photo attached</Text>
                  </View>
                )}

                <View style={{ padding: 16 }}>
                  <View style={[styles.itemStatus, {
                    alignSelf: 'flex-start', marginBottom: 10,
                    borderColor: showDetail.status === 'claimed' ? '#1D9E75' : '#D85A30',
                    backgroundColor: showDetail.status === 'claimed' ? '#0a3d2e' : '#3d1a0a'
                  }]}>
                    <Text style={[styles.itemStatusText, { color: showDetail.status === 'claimed' ? '#1D9E75' : '#D85A30' }]}>
                      {(showDetail.status || 'unclaimed').toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.modalItemName}>{getItemName(showDetail)}</Text>
                  {showDetail.category && <Text style={styles.modalItemCat}>{showDetail.category}</Text>}

                  {[
                    { icon: 'location-outline', label: 'Found At', val: getLocation(showDetail) },
                    { icon: 'business-outline', label: 'Submitted To', val: showDetail.submitted_to },
                    { icon: 'call-outline', label: 'Contact', val: showDetail.contact },
                    { icon: 'card-outline', label: 'Staff/Student ID', val: showDetail.staff_id },
                    { icon: 'home-outline', label: 'Office', val: showDetail.office },
                    { icon: 'person-outline', label: 'Reported By', val: showDetail.reported_by },
                    {
                      icon: 'calendar-outline', label: 'Date Reported',
                      val: showDetail.created_at ? new Date(showDetail.created_at).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : ''
                    },
                  ].filter(d => d.val).map((d, i) => (
                    <View key={i} style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Ionicons name={d.icon as any} size={18} color="#1D9E75" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>{d.label}</Text>
                        <Text style={styles.detailVal}>{d.val}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={{ gap: 10, marginTop: 10 }}>
                    {showDetail.status === 'unclaimed' && (
                      <TouchableOpacity style={styles.claimBtn} onPress={() => markClaimed(showDetail.id)}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                        <Text style={styles.claimBtnText}>Mark as Claimed</Text>
                      </TouchableOpacity>
                    )}
                    {(userType === 'admin' || userType === 'lecturer') && (
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteItem(showDetail)}>
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.deleteBtnText}>Delete Report</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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
  container: { flex: 1, backgroundColor: '#001029' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a1a2e', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2a3a5a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#0a1a2e' },
  fBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#2a3a5a' },
  fBtnActive: { backgroundColor: '#534AB7', borderColor: '#534AB7' },
  fBtnText: { color: '#a0c4ff', fontSize: 13 },
  fBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  countText: { color: '#7a9cc4', fontSize: 12, marginLeft: 'auto' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a1a2e', padding: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#1a2a3a' },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  form: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 16, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  imgPicker: { backgroundColor: '#001029', borderWidth: 2, borderColor: '#2a3a5a', borderRadius: 12, borderStyle: 'dashed', marginBottom: 12, overflow: 'hidden', minHeight: 100 },
  inputBox: { backgroundColor: '#001029', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 10, padding: 13, marginBottom: 10 },
  input: { fontSize: 14, color: '#fff' },
  catLabel: { color: '#a0c4ff', fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#2a3a5a' },
  catBtnActive: { backgroundColor: '#534AB7', borderColor: '#534AB7' },
  catBtnText: { color: '#a0c4ff', fontSize: 12 },
  catBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#2a3a5a', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontWeight: '600' },
  submitBtn: { flex: 2, backgroundColor: '#534AB7', padding: 13, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  itemCard: { flexDirection: 'row', backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  itemImg: { width: 86, height: 86 },
  itemNoImg: { width: 86, height: 86, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, padding: 12 },
  itemStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  itemStatusText: { fontSize: 10, fontWeight: 'bold' },
  itemCat: { color: '#a0c4ff', fontSize: 11 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  itemMetaTxt: { color: '#a0c4ff', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#001029', borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '93%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  modalItemName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  modalItemCat: { fontSize: 13, color: '#a0c4ff', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#0a1a2e', borderRadius: 12, padding: 12, marginBottom: 8 },
  detailIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#001029', alignItems: 'center', justifyContent: 'center' },
  detailLabel: { color: '#a0c4ff', fontSize: 11, marginBottom: 2 },
  detailVal: { color: '#fff', fontSize: 14, fontWeight: '600' },
  claimBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  claimBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  deleteBtn: { backgroundColor: '#D85A30', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  deleteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});