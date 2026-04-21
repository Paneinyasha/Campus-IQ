import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert, Modal, ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function ManageUsers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'students' | 'lecturers'>('students');
  const [results, setResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Add student form
  const [sName, setSName] = useState('');
  const [sSurname, setSSurname] = useState('');
  const [sProgram, setSProgram] = useState('');
  const [sRegNumber, setSRegNumber] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sPassword, setSPassword] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setResults([]); return; }
    const q = searchQuery.trim().toLowerCase();
    const table = searchType;
    const { data } = await supabase
      .from(table)
      .select('*')
      .or(`name.ilike.%${q}%,surname.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%${searchType === 'students' ? `,reg_number.ilike.%${q}%` : ''}`)
      .limit(20);
    setResults(data || []);
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { Alert.alert('Missing', 'Fill in both fields'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Mismatch', 'Passwords do not match'); return; }
    if (newPassword.length < 6) { Alert.alert('Too Short', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const table = searchType;
      await supabase.from(table).update({ password: newPassword }).eq('id', selectedUser.id);
      Alert.alert('Success', `Password changed for ${selectedUser.name}`);
      setShowChangePassword(false);
      setNewPassword(''); setConfirmPassword('');
    } finally { setLoading(false); }
  };

  const handleAddStudent = async () => {
    if (!sName || !sSurname || !sProgram || !sRegNumber || !sEmail || !sPhone || !sPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields'); return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('students').insert({
        name: sName, surname: sSurname, program: sProgram,
        reg_number: sRegNumber, email: sEmail.toLowerCase(),
        phone: sPhone, password: sPassword,
        is_verified: 1, is_suspended: 0,
      });
      if (error) throw error;
      Alert.alert('Success', `Student ${sName} added successfully!`);
      setShowAddStudent(false);
      setSName(''); setSSurname(''); setSProgram(''); setSRegNumber('');
      setSEmail(''); setSPhone(''); setSPassword('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add student');
    } finally { setLoading(false); }
  };

  const handleToggleSuspend = async (user: any) => {
    const newStatus = user.is_suspended ? 0 : 1;
    const action = newStatus ? 'suspend' : 'unsuspend';
    Alert.alert(`${action.charAt(0).toUpperCase() + action.slice(1)} User`, `Are you sure you want to ${action} ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action.charAt(0).toUpperCase() + action.slice(1), style: newStatus ? 'destructive' : 'default', onPress: async () => {
        await supabase.from(searchType).update({ is_suspended: newStatus }).eq('id', user.id);
        setSelectedUser({ ...user, is_suspended: newStatus });
        handleSearch();
        Alert.alert('Done', `User ${action}ed`);
      }}
    ]);
  };

  const handleRegNumberChange = (text: string) => {
    const upper = text.toUpperCase();
    setSRegNumber(upper);
    if (upper.length >= 2) setSEmail(`${upper.toLowerCase()}@students.msu.ac.zw`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddStudent(true)}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Type Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, searchType === 'students' && styles.toggleBtnActive]} onPress={() => { setSearchType('students'); setResults([]); setSearchQuery(''); }}>
          <Text style={[styles.toggleText, searchType === 'students' && styles.toggleTextActive]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, searchType === 'lecturers' && styles.toggleBtnActive]} onPress={() => { setSearchType('lecturers'); setResults([]); setSearchQuery(''); }}>
          <Text style={[styles.toggleText, searchType === 'lecturers' && styles.toggleTextActive]}>Lecturers</Text>
        </TouchableOpacity>
      </View>

      {/* Search Box */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchType === 'students' ? 'Search by name, reg number, phone...' : 'Search by name, email, phone...'}
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {results.length === 0 && searchQuery.length > 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="person-outline" size={48} color="#534AB7" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
        {results.length === 0 && searchQuery.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={48} color="#534AB7" />
            <Text style={styles.emptyText}>Search for a user above</Text>
          </View>
        )}
        {results.map(u => (
          <TouchableOpacity key={u.id} style={styles.userCard} onPress={() => { setSelectedUser(u); setShowDetail(true); }}>
            <View style={styles.userAvatar}>
              <Ionicons name={searchType === 'students' ? 'person' : 'book'} size={24} color={searchType === 'students' ? '#1D9E75' : '#534AB7'} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.name} {u.surname}</Text>
              <Text style={styles.userSub}>{searchType === 'students' ? u.reg_number : u.department}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
            </View>
            {u.is_suspended ? (
              <View style={styles.suspendedBadge}><Text style={styles.suspendedText}>SUSPENDED</Text></View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#a0c4ff" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Detail Modal */}
      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            {selectedUser && (
              <ScrollView>
                <View style={styles.detailAvatar}>
                  <Ionicons name={searchType === 'students' ? 'person' : 'book'} size={48} color={searchType === 'students' ? '#1D9E75' : '#534AB7'} />
                </View>
                <Text style={styles.detailName}>{selectedUser.name} {selectedUser.surname}</Text>

                {[
                  { label: 'Email', value: selectedUser.email },
                  { label: searchType === 'students' ? 'Reg Number' : 'Department', value: searchType === 'students' ? selectedUser.reg_number : selectedUser.department },
                  { label: 'Phone', value: selectedUser.phone },
                  { label: searchType === 'students' ? 'Program' : 'Role', value: searchType === 'students' ? selectedUser.program : 'Lecturer' },
                  { label: 'Status', value: selectedUser.is_suspended ? 'SUSPENDED' : 'Active' },
                ].filter(r => r.value).map((row, i) => (
                  <View key={i} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={[styles.detailValue, row.label === 'Status' && { color: selectedUser.is_suspended ? '#D85A30' : '#1D9E75' }]}>{row.value}</Text>
                  </View>
                ))}

                <View style={styles.actionBtns}>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: '#534AB7' }]} onPress={() => { setShowDetail(false); setShowChangePassword(true); }}>
                    <Ionicons name="key-outline" size={18} color="#534AB7" />
                    <Text style={[styles.actionBtnText, { color: '#534AB7' }]}>Change Password</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: selectedUser.is_suspended ? '#1D9E75' : '#D85A30' }]} onPress={() => handleToggleSuspend(selectedUser)}>
                    <Ionicons name={selectedUser.is_suspended ? 'checkmark-circle-outline' : 'ban-outline'} size={18} color={selectedUser.is_suspended ? '#1D9E75' : '#D85A30'} />
                    <Text style={[styles.actionBtnText, { color: selectedUser.is_suspended ? '#1D9E75' : '#D85A30' }]}>
                      {selectedUser.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showChangePassword} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            {selectedUser && <Text style={styles.forUserText}>For: {selectedUser.name} {selectedUser.surname}</Text>}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Password</Text>
              <TextInput style={styles.formInput} placeholder="Enter new password" placeholderTextColor="#aaa" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm Password</Text>
              <TextInput style={styles.formInput} placeholder="Confirm new password" placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            </View>
            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Saving...' : 'Save Password'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal visible={showAddStudent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Student Manually</Text>
              <TouchableOpacity onPress={() => setShowAddStudent(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView>
              {[
                { label: 'First Name *', value: sName, set: setSName, ph: 'First name' },
                { label: 'Surname *', value: sSurname, set: setSSurname, ph: 'Surname' },
                { label: 'Program *', value: sProgram, set: setSProgram, ph: 'e.g. BSc Computer Science' },
                { label: 'Phone *', value: sPhone, set: setSPhone, ph: 'e.g. 0771234567' },
                { label: 'Password *', value: sPassword, set: setSPassword, ph: 'Set initial password' },
              ].map((f, i) => (
                <View key={i} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{f.label}</Text>
                  <TextInput style={styles.formInput} placeholder={f.ph} placeholderTextColor="#aaa" value={f.value} onChangeText={f.set} secureTextEntry={f.label === 'Password *'} />
                </View>
              ))}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reg Number *</Text>
                <TextInput style={styles.formInput} placeholder="e.g. R2211952R" placeholderTextColor="#aaa" value={sRegNumber} onChangeText={handleRegNumberChange} autoCapitalize="characters" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email (auto-filled)</Text>
                <TextInput style={[styles.formInput, { color: '#a0c4ff' }]} value={sEmail} editable={false} />
              </View>
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleAddStudent} disabled={loading}>
                <Text style={styles.submitBtnText}>{loading ? 'Adding...' : 'Add Student'}</Text>
              </TouchableOpacity>
            </ScrollView>
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
  addBtn: { backgroundColor: '#1D9E75', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', margin: 16, backgroundColor: '#0a2a4a', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#534AB7' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#534AB7' },
  toggleText: { color: '#a0c4ff', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#fff' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  searchBtn: { backgroundColor: '#534AB7', width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#a0c4ff' },
  userCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  userSub: { fontSize: 12, color: '#FFD700', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#a0c4ff' },
  suspendedBadge: { backgroundColor: '#D85A3022', borderWidth: 1, borderColor: '#D85A30', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  suspendedText: { color: '#D85A30', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  detailAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#001f4d', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderWidth: 2, borderColor: '#534AB7', marginBottom: 12 },
  detailName: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#001f4d', borderRadius: 10, padding: 12, marginBottom: 8 },
  detailLabel: { fontSize: 13, color: '#a0c4ff' },
  detailValue: { fontSize: 13, color: '#fff', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  actionBtns: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: '#001f4d' },
  actionBtnText: { fontWeight: 'bold', fontSize: 14 },
  forUserText: { fontSize: 14, color: '#a0c4ff', marginBottom: 16 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, color: '#a0c4ff', marginBottom: 6, fontWeight: '600' },
  formInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14 },
  submitBtn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

