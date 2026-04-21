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

export default function AnonymousReport() {
  const router = useRouter();
  const [userType, setUserType] = useState('');
  const [user, setUser] = useState<any>(null);
  const [studentToken, setStudentToken] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [reportText, setReportText] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState<any>(null);
  const [imageUri, setImageUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const student = await AsyncStorage.getItem('current_student');
      const lecturer = await AsyncStorage.getItem('current_lecturer');
      const admin = await AsyncStorage.getItem('current_admin');
      if (student) {
        const s = JSON.parse(student);
        setUser(s); setUserType('student');
        // Generate anonymous token from student id
        const token = 'anon_' + btoa(s.id).replace(/=/g, '').substring(0, 16);
        setStudentToken(token);
        loadStudentReports(token);
      } else if (lecturer) {
        const l = JSON.parse(lecturer);
        setUser(l); setUserType('lecturer');
        loadLecturerReports(l.id);
      } else if (admin) {
        const a = JSON.parse(admin);
        setUser(a); setUserType('admin');
        loadAllReports();
      }
      loadLecturers();
    } catch (e) {}
  };

  const loadLecturers = async () => {
    const { data } = await supabase.from('lecturers').select('id, name, surname, department').order('name');
    setLecturers(data || []);
  };

  const loadStudentReports = async (token: string) => {
    const { data } = await supabase
      .from('anonymous_reports')
      .select('*, lecturers(name, surname)')
      .eq('student_token', token)
      .order('created_at', { ascending: false });
    setReports(data || []);
  };

  const loadLecturerReports = async (lecturerId: string) => {
    const { data } = await supabase
      .from('anonymous_reports')
      .select('*')
      .eq('lecturer_id', lecturerId)
      .order('created_at', { ascending: false });
    setReports(data || []);
  };

  const loadAllReports = async () => {
    const { data } = await supabase
      .from('anonymous_reports')
      .select('*, lecturers(name, surname)')
      .order('created_at', { ascending: false });
    setReports(data || []);
  };

  const loadMessages = async (reportId: string) => {
    const { data } = await supabase
      .from('report_messages')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (userType === 'student') await loadStudentReports(studentToken);
    else if (userType === 'lecturer') await loadLecturerReports(user.id);
    else await loadAllReports();
    setRefreshing(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
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
      const fileName = `reports/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('campus-iq').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (error) return '';
      const { data } = supabase.storage.from('campus-iq').getPublicUrl(fileName);
      return data.publicUrl;
    } catch { return ''; }
  };

  const handleSubmit = async () => {
    if (!reportText.trim()) { Alert.alert('Empty Report', 'Please describe what you want to report'); return; }
    setLoading(true);
    try {
      let imageUrl = '';
      if (imageUri) imageUrl = await uploadImage(imageUri);
      const { error } = await supabase.from('anonymous_reports').insert({
        report_text: reportText,
        image_url: imageUrl || null,
        lecturer_id: selectedLecturer?.id || null,
        student_token: studentToken,
        status: 'open',
      });
      if (error) throw error;
      Alert.alert('Report Submitted', 'Your report has been submitted anonymously. You can track it here.');
      setShowForm(false);
      setReportText(''); setImageUri(''); setSelectedLecturer(null);
      loadStudentReports(studentToken);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    await supabase.from('report_messages').insert({
      report_id: showDetail.id,
      sender_type: userType === 'student' ? 'student' : 'admin',
      message: replyText,
    });
    setReplyText('');
    loadMessages(showDetail.id);
  };

  const handleCloseReport = async (report: any) => {
    Alert.alert('Close Report', 'Mark this report as resolved?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: async () => {
        await supabase.from('anonymous_reports').update({ status: 'resolved' }).eq('id', report.id);
        setShowDetail(null);
        onRefresh();
      }}
    ]);
  };

  const openDetail = async (report: any) => {
    setShowDetail(report);
    await loadMessages(report.id);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusColor = (s: string) => s === 'open' ? '#D85A30' : '#1D9E75';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Anonymous Reports</Text>
        {userType === 'student' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        {userType !== 'student' && <View style={{ width: 36 }} />}
      </View>

      {userType === 'student' && (
        <View style={styles.privacyBanner}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#1D9E75" />
          <Text style={styles.privacyText}>Your identity is fully protected. Reports are anonymous.</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
      >
        {reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="shield-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptyText}>
              {userType === 'student' ? 'Tap + to submit an anonymous report' : 'No reports assigned to you yet'}
            </Text>
          </View>
        ) : (
          reports.map(r => (
            <TouchableOpacity key={r.id} style={styles.reportCard} onPress={() => openDetail(r)}>
              <View style={styles.reportTop}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(r.status) }]} />
                <Text style={styles.reportDate}>{formatDate(r.created_at)}</Text>
                <View style={[styles.statusBadge, { borderColor: statusColor(r.status), backgroundColor: statusColor(r.status) + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor(r.status) }]}>{r.status?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.reportText} numberOfLines={3}>{r.report_text}</Text>
              {r.image_url && (
                <View style={styles.hasImageTag}>
                  <Ionicons name="image-outline" size={14} color="#a0c4ff" />
                  <Text style={styles.hasImageText}>Has photo</Text>
                </View>
              )}
              {userType !== 'student' && r.lecturers && (
                <Text style={styles.reportMeta}>Assigned to: {r.lecturers.name} {r.lecturers.surname}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Submit Report Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Anonymous Report</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); setReportText(''); setImageUri(''); setSelectedLecturer(null); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.privacyBanner}>
                <Ionicons name="eye-off-outline" size={16} color="#1D9E75" />
                <Text style={styles.privacyText}>Your name will never be revealed to anyone</Text>
              </View>

              <Text style={styles.formLabel}>What do you want to report? *</Text>
              <TextInput
                style={[styles.formInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Describe the issue in detail..."
                placeholderTextColor="#aaa"
                value={reportText}
                onChangeText={setReportText}
                multiline
              />

              <Text style={styles.formLabel}>Assign to Lecturer (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <TouchableOpacity
                  style={[styles.lecturerChip, !selectedLecturer && styles.lecturerChipActive]}
                  onPress={() => setSelectedLecturer(null)}
                >
                  <Text style={[styles.lecturerChipText, !selectedLecturer && { color: '#fff' }]}>Admin Only</Text>
                </TouchableOpacity>
                {lecturers.map(l => (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.lecturerChip, selectedLecturer?.id === l.id && styles.lecturerChipActive]}
                    onPress={() => setSelectedLecturer(l)}
                  >
                    <Text style={[styles.lecturerChipText, selectedLecturer?.id === l.id && { color: '#fff' }]}>
                      {l.name} {l.surname}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Attach Photo (optional)</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                ) : (
                  <View style={styles.imagePickerInner}>
                    <Ionicons name="camera-outline" size={32} color="#534AB7" />
                    <Text style={styles.imagePickerText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
                <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Anonymously'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail & Message Modal */}
      <Modal visible={!!showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Detail</Text>
              <TouchableOpacity onPress={() => { setShowDetail(null); setMessages([]); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            {showDetail && (
              <View style={{ flex: 1 }}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginBottom: 12, borderColor: statusColor(showDetail.status), backgroundColor: statusColor(showDetail.status) + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor(showDetail.status) }]}>{showDetail.status?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.detailDate}>{formatDate(showDetail.created_at)}</Text>
                  <Text style={styles.detailReportText}>{showDetail.report_text}</Text>
                  {showDetail.image_url && (
                    <Image source={{ uri: showDetail.image_url }} style={styles.detailImage} />
                  )}

                  <Text style={styles.messagesTitle}>Conversation</Text>
                  {messages.length === 0 ? (
                    <Text style={styles.noMessages}>No messages yet</Text>
                  ) : (
                    messages.map(m => (
                      <View key={m.id} style={[styles.messageBubble, m.sender_type === 'student' ? styles.bubbleRight : styles.bubbleLeft]}>
                        <Text style={styles.bubbleSender}>{m.sender_type === 'student' ? 'You (Anonymous)' : 'Admin/Lecturer'}</Text>
                        <Text style={styles.bubbleText}>{m.message}</Text>
                        <Text style={styles.bubbleTime}>{formatDate(m.created_at)}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>

                {showDetail.status === 'open' && (
                  <View style={styles.replyBox}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Type a message..."
                      placeholderTextColor="#aaa"
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply}>
                      <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {userType === 'admin' && showDetail.status === 'open' && (
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => handleCloseReport(showDetail)}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#1D9E75" />
                    <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  addBtn: { backgroundColor: '#534AB7', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  privacyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a3d2e', margin: 16, padding: 12, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: '#1D9E75' },
  privacyText: { color: '#a0c4ff', fontSize: 13, flex: 1 },
  list: { padding: 16, gap: 12 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  reportCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14 },
  reportTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  reportDate: { fontSize: 12, color: '#a0c4ff', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  reportText: { fontSize: 14, color: '#fff', lineHeight: 22, marginBottom: 8 },
  hasImageTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hasImageText: { fontSize: 12, color: '#a0c4ff' },
  reportMeta: { fontSize: 12, color: '#FFD700', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '92%', flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  formLabel: { fontSize: 13, color: '#a0c4ff', marginBottom: 6, fontWeight: '600' },
  formInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 16 },
  lecturerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', marginRight: 8 },
  lecturerChipActive: { backgroundColor: '#534AB7' },
  lecturerChipText: { color: '#a0c4ff', fontSize: 13 },
  imagePicker: { backgroundColor: '#001f4d', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', height: 100, marginBottom: 16, overflow: 'hidden' },
  imagePickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  imagePickerText: { color: '#a0c4ff', fontSize: 13 },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitBtn: { backgroundColor: '#534AB7', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  detailDate: { fontSize: 12, color: '#a0c4ff', marginBottom: 8 },
  detailReportText: { fontSize: 15, color: '#fff', lineHeight: 24, marginBottom: 12 },
  detailImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 16, resizeMode: 'cover' },
  messagesTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', marginBottom: 12, marginTop: 4 },
  noMessages: { fontSize: 13, color: '#a0c4ff', textAlign: 'center', marginBottom: 12 },
  messageBubble: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '85%' },
  bubbleRight: { backgroundColor: '#1a1650', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  bubbleLeft: { backgroundColor: '#0a3d2e', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  bubbleSender: { fontSize: 11, color: '#FFD700', marginBottom: 4, fontWeight: 'bold' },
  bubbleText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: '#a0c4ff', marginTop: 4, textAlign: 'right' },
  replyBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1a1650', marginTop: 8 },
  replyInput: { flex: 1, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 10, color: '#fff', fontSize: 14, maxHeight: 80 },
  sendBtn: { backgroundColor: '#534AB7', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#1D9E75', marginTop: 8 },
  resolveBtnText: { color: '#1D9E75', fontWeight: 'bold', fontSize: 14 },
});
