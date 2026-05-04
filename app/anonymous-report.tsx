import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function AnonymousReport() {
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [mediaUri, setMediaUri] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'reports'>('submit');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [followUpMsg, setFollowUpMsg] = useState('');
  const [reporterToken, setReporterToken] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  const CATEGORIES = ['General', 'Harassment', 'Academic Dishonesty', 'Racism', 'Bullying', 'Corruption', 'Facilities', 'Safety', 'Other'];

  useEffect(() => { loadUser(); loadReporterToken(); }, []);

  const loadUser = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    if (admin) { setUserRole('admin'); setCurrentUser(JSON.parse(admin)); setActiveTab('reports'); return; }
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (lecturer) { setUserRole('lecturer'); setCurrentUser(JSON.parse(lecturer)); setActiveTab('reports'); return; }
    setUserRole('student'); setActiveTab('submit');
  };

  const loadReporterToken = async () => {
    let token = await AsyncStorage.getItem('anonymous_reporter_token');
    if (!token) {
      token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('anonymous_reporter_token', token);
    }
    setReporterToken(token);
  };

  const loadReports = async (role: string) => {
    const { data, error } = await supabase.from('anonymous_reports').select('*').order('created_at', { ascending: false });
    if (error) { console.log('Load reports error:', error.message); return; }
    setReports(data || []);
  };

  const loadMyReports = async () => {
    if (!reporterToken) return;
    const { data, error } = await supabase.from('anonymous_reports').select('*').eq('reporter_token', reporterToken).order('created_at', { ascending: false });
    if (error) { console.log('Load my reports error:', error.message); return; }
    setReports(data || []);
  };

  const loadFollowUps = async (reportId: string) => {
    const { data, error } = await supabase.from('anonymous_followups').select('*').eq('report_id', reportId).order('created_at', { ascending: true });
    if (error) { console.log('Load followups error:', error.message); return; }
    setFollowUps(data || []);
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type || 'image');
    }
  };

  const uploadMedia = async (uri: string, type: string): Promise<string> => {
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const path = `anonymous-reports/${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage.from('campus-iq').upload(path, blob, { contentType: type === 'video' ? 'video/mp4' : 'image/jpeg' });
      if (error) return uri; // fallback to local uri
      const { data } = supabase.storage.from('campus-iq').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      return uri;
    }
  };

  const submitReport = async () => {
    if (!message.trim()) { Alert.alert('Missing', 'Please describe the issue'); return; }
    setSubmitting(true);
    try {
      let uploadedMediaUrl = '';
      if (mediaUri) {
        uploadedMediaUrl = await uploadMedia(mediaUri, mediaType);
      }

      const { error } = await supabase.from('anonymous_reports').insert({
        message: message.trim(),
        category: category,
        media_url: uploadedMediaUrl || null,
        media_type: mediaType || null,
        reporter_token: reporterToken,
        status: 'pending',
      });
      if (error) throw error;
      setMessage(''); setMediaUri(''); setMediaType('');
      Alert.alert('Report Submitted', 'Your anonymous report has been submitted. Check My Reports tab for follow-up responses.', [
        { text: 'OK', onPress: () => setActiveTab('reports') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally { setSubmitting(false); }
  };

  const openFollowUp = async (report: any) => {
    setSelectedReport(report);
    setFollowUps([]);
    setShowFollowUpModal(true);
    await loadFollowUps(report.id);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 400);
  };

  const sendFollowUp = async () => {
    if (!followUpMsg.trim() || !selectedReport || sendingFollowUp) return;
    setSendingFollowUp(true);
    try {
      const isReporter = userRole === 'student';
      const senderName = isReporter
        ? 'Anonymous Reporter'
        : (currentUser?.name ? `${currentUser.name} ${currentUser.surname || ''}`.trim() : userRole);

      const { error } = await supabase.from('anonymous_followups').insert({
        report_id: selectedReport.id,
        sender_role: isReporter ? 'reporter' : userRole,
        sender_name: senderName,
        message: followUpMsg.trim(),
      });
      if (error) { Alert.alert('Error', error.message); return; }
      setFollowUpMsg('');
      await loadFollowUps(selectedReport.id);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } finally { setSendingFollowUp(false); }
  };

  const statusColor = (s: string) => s === 'resolved' ? '#1D9E75' : s === 'investigating' ? '#FFD700' : '#D85A30';

  const isImageUrl = (url: string, type: string) =>
    type === 'image' || url?.match(/\.(jpg|jpeg|png|gif|webp)/i);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Anonymous Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        {userRole === 'student' && (
          <TouchableOpacity style={[styles.tab, activeTab === 'submit' && styles.tabActive]} onPress={() => setActiveTab('submit')}>
            <Ionicons name="create-outline" size={16} color={activeTab === 'submit' ? '#FFD700' : '#a0c4ff'} />
            <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>Submit Report</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
          onPress={() => {
            setActiveTab('reports');
            if (userRole === 'student') loadMyReports();
            else loadReports(userRole);
          }}
        >
          <Ionicons name="list-outline" size={16} color={activeTab === 'reports' ? '#FFD700' : '#a0c4ff'} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            {userRole === 'student' ? 'My Reports' : `All Reports (${reports.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* SUBMIT */}
        {activeTab === 'submit' && userRole === 'student' && (
          <View>
            <View style={styles.anonBanner}>
              <Ionicons name="shield-checkmark" size={20} color="#1D9E75" />
              <Text style={styles.anonBannerText}>Your identity is completely protected. Reports are submitted anonymously.</Text>
            </View>

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catBtnActive]} onPress={() => setCategory(cat)}>
                  <Text style={[styles.catBtnText, category === cat && styles.catBtnTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Describe the issue *</Text>
            <TextInput style={styles.messageInput} placeholder="Describe what happened, where, when..." placeholderTextColor="#aaa" value={message} onChangeText={setMessage} multiline numberOfLines={6} textAlignVertical="top" />

            <Text style={styles.label}>Attach Evidence (optional)</Text>
            <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
              {mediaUri ? (
                <View style={styles.mediaPreview}>
                  {mediaType === 'image' ? (
                    <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
                  ) : (
                    <View style={styles.mediaVideoBox}>
                      <Ionicons name="videocam" size={40} color="#534AB7" />
                      <Text style={styles.mediaVideoText}>Video selected</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeMedia} onPress={() => { setMediaUri(''); setMediaType(''); }}>
                    <Ionicons name="close-circle" size={26} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.mediaPickerInner}>
                  <Ionicons name="image-outline" size={36} color="#534AB7" />
                  <Text style={styles.mediaPickerText}>Tap to attach photo or video</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={submitReport} disabled={submitting}>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Anonymously'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* REPORTS LIST */}
        {activeTab === 'reports' && (
          <>
            {reports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-outline" size={60} color="#534AB7" />
                <Text style={styles.emptyTitle}>{userRole === 'student' ? 'No Reports Yet' : 'No Reports'}</Text>
                <Text style={styles.emptyText}>{userRole === 'student' ? 'Submit a report to see it here' : 'No anonymous reports submitted yet'}</Text>
              </View>
            ) : (
              reports.map((r: any) => (
                <View key={r.id} style={styles.reportCard}>
                  <View style={styles.reportTop}>
                    <View style={styles.catPill}>
                      <Text style={styles.catPillText}>{r.category || 'General'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColor(r.status || 'pending') + '22', borderColor: statusColor(r.status || 'pending') }]}>
                      <Text style={[styles.statusPillText, { color: statusColor(r.status || 'pending') }]}>{r.status || 'Pending'}</Text>
                    </View>
                    <Text style={styles.reportDate}>{new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
                  </View>

                  <Text style={styles.reportMessage}>{r.message}</Text>

                  {/* MEDIA DISPLAY */}
                  {r.media_url && (
                    <View style={styles.mediaSection}>
                      <Text style={styles.mediaSectionLabel}>
                        <Ionicons name="attach-outline" size={13} color="#a0c4ff" /> Attached Evidence:
                      </Text>
                      {isImageUrl(r.media_url, r.media_type) ? (
                        <TouchableOpacity onPress={() => Linking.openURL(r.media_url)}>
                          <View style={styles.mediaImgBox}>
                            <Image source={{ uri: r.media_url }} style={styles.mediaImg} resizeMode="cover" onError={() => {}} />
                            <View style={styles.mediaImgOverlay}>
                              <Ionicons name="expand-outline" size={18} color="#fff" />
                              <Text style={styles.mediaImgOverlayText}>Tap to view full size</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.mediaFileBtn} onPress={() => Linking.openURL(r.media_url)}>
                          <Ionicons name="videocam-outline" size={22} color="#534AB7" />
                          <Text style={styles.mediaFileBtnText}>View / Download Video</Text>
                          <Ionicons name="download-outline" size={20} color="#1D9E75" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Admin/lecturer status change */}
                  {(userRole === 'admin' || userRole === 'lecturer') && (
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {['pending', 'investigating', 'resolved'].map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.statusBtn, r.status === s && { backgroundColor: statusColor(s) + '33', borderColor: statusColor(s) }]}
                          onPress={async () => {
                            await supabase.from('anonymous_reports').update({ status: s }).eq('id', r.id);
                            loadReports(userRole);
                          }}
                        >
                          <Text style={[styles.statusBtnText, r.status === s && { color: statusColor(s), fontWeight: 'bold' }]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Follow-up button */}
                  <TouchableOpacity style={styles.followUpBtn} onPress={() => openFollowUp(r)}>
                    <Ionicons name="chatbubble-outline" size={16} color="#FFD700" />
                    <Text style={styles.followUpBtnText}>
                      {userRole === 'student' ? 'View / Send Follow-up' : 'Reply to Reporter'}
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#a0c4ff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Follow-up Chat Modal */}
      <Modal visible={showFollowUpModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.chatOverlay}>
            <View style={styles.chatBox}>
              <View style={styles.chatHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chatTitle}>Anonymous Follow-up</Text>
                  <Text style={styles.chatSub}>{userRole === 'student' ? 'Your identity remains anonymous' : `Category: ${selectedReport?.category || 'Report'}`}</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowFollowUpModal(false); setFollowUps([]); setFollowUpMsg(''); }}>
                  <Ionicons name="close" size={26} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.anonNote}>
                <Ionicons name="shield-checkmark" size={14} color="#1D9E75" />
                <Text style={styles.anonNoteText}>
                  {userRole === 'student'
                    ? 'You appear as "Anonymous Reporter". Your identity is protected.'
                    : 'The reporter is anonymous. They appear as "Anonymous Reporter".'}
                </Text>
              </View>

              <ScrollView ref={scrollRef} style={styles.chatMsgs} contentContainerStyle={{ paddingBottom: 10 }}>
                {followUps.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
                    <Ionicons name="chatbubble-outline" size={40} color="#534AB7" />
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>No messages yet</Text>
                    <Text style={{ color: '#a0c4ff', fontSize: 13, textAlign: 'center', paddingHorizontal: 30 }}>
                      {userRole === 'student' ? 'Send an anonymous follow-up message' : 'Send a reply to the anonymous reporter'}
                    </Text>
                  </View>
                ) : (
                  followUps.map((fu: any) => {
                    const isMe = (userRole === 'student' && fu.sender_role === 'reporter') ||
                      (userRole !== 'student' && fu.sender_role !== 'reporter');
                    return (
                      <View key={fu.id} style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
                        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                          <Text style={styles.bubbleSender}>
                            {fu.sender_role === 'reporter' ? '🔒 Anonymous Reporter' : `👤 ${fu.sender_name}`}
                          </Text>
                          <Text style={styles.bubbleText}>{fu.message}</Text>
                          <Text style={styles.bubbleTime}>
                            {new Date(fu.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder={userRole === 'student' ? 'Send anonymous follow-up...' : 'Reply to reporter...'}
                  placeholderTextColor="#aaa"
                  value={followUpMsg}
                  onChangeText={setFollowUpMsg}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.chatSendBtn, (!followUpMsg.trim() || sendingFollowUp) && { opacity: 0.5 }]}
                  onPress={sendFollowUp}
                  disabled={!followUpMsg.trim() || sendingFollowUp}
                >
                  <Ionicons name="send" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  tabRow: { flexDirection: 'row', backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#a0c4ff', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  content: { padding: 16, paddingBottom: 40 },
  anonBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 16 },
  anonBannerText: { color: '#1D9E75', fontSize: 13, flex: 1, lineHeight: 18 },
  label: { color: '#a0c4ff', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7', marginRight: 8, backgroundColor: '#0a2a4a' },
  catBtnActive: { backgroundColor: '#534AB7', borderColor: '#534AB7' },
  catBtnText: { color: '#a0c4ff', fontSize: 13 },
  catBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  messageInput: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, fontSize: 15, color: '#ffffff', minHeight: 140, marginBottom: 16, textAlignVertical: 'top' },
  mediaPicker: { backgroundColor: '#0a2a4a', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', minHeight: 120, marginBottom: 16, overflow: 'hidden' },
  mediaPickerInner: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  mediaPickerText: { color: '#a0c4ff', fontSize: 14 },
  mediaPreview: { position: 'relative' },
  mediaImage: { width: '100%', height: 200 },
  mediaVideoBox: { alignItems: 'center', justifyContent: 'center', height: 120, gap: 8 },
  mediaVideoText: { color: '#a0c4ff', fontSize: 14 },
  removeMedia: { position: 'absolute', top: 8, right: 8 },
  submitBtn: { backgroundColor: '#534AB7', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  reportCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 14 },
  reportTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  catPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#534AB722' },
  catPillText: { color: '#a0c4ff', fontSize: 12, fontWeight: 'bold' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusPillText: { fontSize: 12, fontWeight: 'bold' },
  reportDate: { color: '#7a9cc4', fontSize: 11, marginLeft: 'auto' },
  reportMessage: { color: '#ffffff', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  mediaSection: { marginBottom: 12 },
  mediaSectionLabel: { color: '#a0c4ff', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  mediaImgBox: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  mediaImg: { width: '100%', height: 180 },
  mediaImgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 8 },
  mediaImgOverlayText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  mediaFileBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12 },
  mediaFileBtnText: { color: '#ffffff', fontSize: 14, flex: 1 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7' },
  statusBtnText: { color: '#a0c4ff', fontSize: 12 },
  followUpBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 10 },
  followUpBtnText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', flex: 1 },
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  chatBox: { backgroundColor: '#001f4d', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '88%' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#0a2a4a' },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  chatSub: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  anonNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#0a3d2e', margin: 12, marginTop: 0, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1D9E75' },
  anonNoteText: { color: '#1D9E75', fontSize: 12, flex: 1 },
  chatMsgs: { flex: 1, padding: 12 },
  bubbleWrap: { marginBottom: 10, alignItems: 'flex-start' },
  bubbleWrapRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 14 },
  bubbleMe: { backgroundColor: '#534AB7', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#0a2a4a', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#534AB7' },
  bubbleSender: { fontSize: 11, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  bubbleText: { color: '#ffffff', fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: '#a0c4ff', marginTop: 4, textAlign: 'right' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#0a2a4a' },
  chatInput: { flex: 1, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 20, padding: 12, fontSize: 15, color: '#ffffff', maxHeight: 100 },
  chatSendBtn: { backgroundColor: '#534AB7', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});