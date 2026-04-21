import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert, Image, Modal, RefreshControl, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

const STATUS_COLORS: any = {
  unclaimed: '#D85A30',
  claimed: '#1D9E75',
};

export default function LostFound() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationFound, setLocationFound] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [staffId, setStaffId] = useState('');
  const [officeNumber, setOfficeNumber] = useState('');
  const [imageUri, setImageUri] = useState('');

  useEffect(() => { loadUser(); }, []);
  useEffect(() => { applyFilter(); }, [items, filter, search]);

  const loadUser = async () => {
    try {
      const student = await AsyncStorage.getItem('current_student');
      const lecturer = await AsyncStorage.getItem('current_lecturer');
      const admin = await AsyncStorage.getItem('current_admin');
      if (student) { setUser(JSON.parse(student)); setUserType('student'); }
      else if (lecturer) { setUser(JSON.parse(lecturer)); setUserType('lecturer'); }
      else if (admin) { setUser(JSON.parse(admin)); setUserType('admin'); }
      loadItems();
    } catch (e) {}
  };

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('lost_found')
        .select('*')
        .order('created_at', { ascending: false });
      setItems(data || []);
    } catch (e) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const applyFilter = () => {
    let result = [...items];
    if (filter !== 'all') result = result.filter(i => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.location_found?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo access'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `lost-found/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('campus-iq')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
      if (error) return '';
      const { data: urlData } = supabase.storage.from('campus-iq').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e) { return ''; }
  };

  const handleSubmit = async () => {
    if (!title || !locationFound || !submittedTo) {
      Alert.alert('Missing Fields', 'Please fill in title, location found and submitted to');
      return;
    }
    setLoading(true);
    try {
      let uploadedUrl = '';
      if (imageUri) uploadedUrl = await uploadImage(imageUri);
      const { error } = await supabase.from('lost_found').insert({
        title, description, location_found: locationFound,
        submitted_to: submittedTo, contact_phone: contactPhone,
        staff_id: staffId, office_number: officeNumber,
        image_url: uploadedUrl || null,
        status: 'unclaimed',
        reported_by: user?.name || 'Anonymous',
        reporter_type: userType,
      });
      if (error) throw error;
      Alert.alert('Success', 'Item reported successfully!');
      setShowReport(false);
      resetForm();
      loadItems();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClaimed = async (item: any) => {
    Alert.alert('Mark as Claimed', `Mark "${item.title}" as claimed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Claimed', onPress: async () => {
          await supabase.from('lost_found').update({
            status: 'claimed',
            claimed_at: new Date().toISOString(),
            claimed_by: user?.name || 'Admin',
          }).eq('id', item.id);
          loadItems();
          setShowDetail(null);
          Alert.alert('Updated', 'Item marked as claimed');
        }
      }
    ]);
  };

  const handleDelete = async (item: any) => {
    Alert.alert('Delete Item', `Delete "${item.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('lost_found').delete().eq('id', item.id);
          loadItems();
          setShowDetail(null);
        }
      }
    ]);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setLocationFound('');
    setSubmittedTo(''); setContactPhone(''); setStaffId('');
    setOfficeNumber(''); setImageUri('');
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lost & Found</Text>
        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Row - Admin Only */}
      {userType === 'admin' && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{items.filter(i => i.status === 'unclaimed').length}</Text>
            <Text style={styles.statLabel}>Unclaimed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#1D9E75' }]}>{items.filter(i => i.status === 'claimed').length}</Text>
            <Text style={styles.statLabel}>Claimed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#a0c4ff' }]}>{items.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'unclaimed', 'claimed'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items List */}
      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No lost items reported yet.' : `No ${filter} items.`}
            </Text>
          </View>
        ) : (
          filtered.map(item => (
            <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => setShowDetail(item)}>
              <View style={styles.itemLeft}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.itemThumb} />
                ) : (
                  <View style={styles.itemNoImage}>
                    <Ionicons name="image-outline" size={28} color="#534AB7" />
                  </View>
                )}
              </View>
              <View style={styles.itemInfo}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '33', borderColor: STATUS_COLORS[item.status] }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.itemLocation} numberOfLines={1}>
                  <Ionicons name="location-outline" size={12} color="#a0c4ff" /> {item.location_found}
                </Text>
                <Text style={styles.itemSub} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReport} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Found Item</Text>
              <TouchableOpacity onPress={() => { setShowReport(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePickerInner}>
                    <Ionicons name="camera-outline" size={36} color="#534AB7" />
                    <Text style={styles.imagePickerText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {[
                { label: 'Item Name *', value: title, set: setTitle, placeholder: 'e.g. Black wallet' },
                { label: 'Description', value: description, set: setDescription, placeholder: 'Describe the item...' },
                { label: 'Location Found *', value: locationFound, set: setLocationFound, placeholder: 'e.g. Library Block B' },
                { label: 'Submitted To (Name/Place) *', value: submittedTo, set: setSubmittedTo, placeholder: 'e.g. Security Office' },
                { label: 'Contact Phone', value: contactPhone, set: setContactPhone, placeholder: 'Phone of person holding item' },
                { label: 'Staff ID', value: staffId, set: setStaffId, placeholder: 'Staff ID if applicable' },
                { label: 'Office Number', value: officeNumber, set: setOfficeNumber, placeholder: 'e.g. Admin Block Room 12' },
              ].map((field, i) => (
                <View key={i} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={field.placeholder}
                    placeholderTextColor="#aaa"
                    value={field.value}
                    onChangeText={field.set}
                    multiline={field.label === 'Description'}
                    numberOfLines={field.label === 'Description' ? 3 : 1}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <TouchableOpacity onPress={() => setShowDetail(null)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {showDetail && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {showDetail.image_url ? (
                  <Image source={{ uri: showDetail.image_url }} style={styles.detailImage} />
                ) : (
                  <View style={styles.detailNoImage}>
                    <Ionicons name="image-outline" size={48} color="#534AB7" />
                    <Text style={{ color: '#a0c4ff', marginTop: 8 }}>No photo</Text>
                  </View>
                )}

                <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginBottom: 16, backgroundColor: STATUS_COLORS[showDetail.status] + '33', borderColor: STATUS_COLORS[showDetail.status] }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[showDetail.status] }]}>
                    {showDetail.status?.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.detailTitle}>{showDetail.title}</Text>
                {showDetail.description ? <Text style={styles.detailDesc}>{showDetail.description}</Text> : null}

                {[
                  { icon: 'location-outline', label: 'Found At', value: showDetail.location_found },
                  { icon: 'business-outline', label: 'Submitted To', value: showDetail.submitted_to },
                  { icon: 'call-outline', label: 'Contact', value: showDetail.contact_phone },
                  { icon: 'card-outline', label: 'Staff ID', value: showDetail.staff_id },
                  { icon: 'home-outline', label: 'Office', value: showDetail.office_number },
                  { icon: 'person-outline', label: 'Reported By', value: showDetail.reported_by },
                  { icon: 'calendar-outline', label: 'Date Reported', value: formatDate(showDetail.created_at) },
                  { icon: 'checkmark-circle-outline', label: 'Claimed At', value: showDetail.claimed_at ? formatDate(showDetail.claimed_at) : null },
                  { icon: 'person-circle-outline', label: 'Claimed By', value: showDetail.claimed_by },
                ].filter(r => r.value).map((row, i) => (
                  <View key={i} style={styles.detailRow}>
                    <Ionicons name={row.icon as any} size={18} color="#1D9E75" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.detailRowLabel}>{row.label}</Text>
                      <Text style={styles.detailRowValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}

                {/* Admin Controls */}
                {userType === 'admin' && (
                  <View style={styles.adminActions}>
                    {showDetail.status === 'unclaimed' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#0a3d2e', borderColor: '#1D9E75' }]}
                        onPress={() => handleMarkClaimed(showDetail)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#1D9E75" />
                        <Text style={[styles.actionBtnText, { color: '#1D9E75' }]}>Mark as Claimed</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#3d0a0a', borderColor: '#D85A30' }]}
                      onPress={() => handleDelete(showDetail)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#D85A30" />
                      <Text style={[styles.actionBtnText, { color: '#D85A30' }]}>Delete Item</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#1D9E75' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  reportBtn: { backgroundColor: '#1D9E75', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#a0c4ff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#D85A30' },
  statLabel: { fontSize: 11, color: '#a0c4ff', marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', margin: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#a0c4ff' },
  filterTabActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  filterText: { color: '#a0c4ff', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 8, gap: 12 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  itemCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, flexDirection: 'row', overflow: 'hidden' },
  itemLeft: { width: 90 },
  itemThumb: { width: 90, height: 100, resizeMode: 'cover' },
  itemNoImage: { width: 90, height: 100, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, padding: 12 },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  itemLocation: { fontSize: 12, color: '#a0c4ff', marginBottom: 4 },
  itemSub: { fontSize: 12, color: '#7a9cc4', marginBottom: 4 },
  itemDate: { fontSize: 11, color: '#534AB7' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  imagePicker: { backgroundColor: '#001f4d', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', height: 140, marginBottom: 16, overflow: 'hidden' },
  imagePickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerText: { color: '#a0c4ff', fontSize: 14 },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, color: '#a0c4ff', marginBottom: 6, fontWeight: '600' },
  formInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14 },
  submitBtn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  detailImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16, resizeMode: 'cover' },
  detailNoImage: { width: '100%', height: 120, backgroundColor: '#001f4d', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  detailDesc: { fontSize: 14, color: '#a0c4ff', marginBottom: 16, lineHeight: 22 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#001f4d', borderRadius: 10, padding: 12, marginBottom: 8 },
  detailRowLabel: { fontSize: 11, color: '#a0c4ff', marginBottom: 2 },
  detailRowValue: { fontSize: 14, color: '#fff', fontWeight: '500' },
  adminActions: { gap: 10, marginTop: 16, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontWeight: 'bold', fontSize: 15 },
});
