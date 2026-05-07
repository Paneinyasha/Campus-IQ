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
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const CATEGORIES = ['General', 'Harassment', 'Academic Dishonesty', 'Racism', 'Bullying', 'Corruption', 'Facilities', 'Safety', 'Other'];

  useEffect(() => { initPage(); }, []);

  const initPage = async () => {
    await loadUser();
    await loadReporterToken();
  };

  const loadUser = async () => {
    try {
      const admin = await AsyncStorage.getItem('current_admin');
      if (admin) { setUserRole('admin'); setCurrentUser(JSON.parse(admin)); setActiveTab('reports'); loadReports(); return; }
      const lecturer = await AsyncStorage.getItem('current_lecturer');
      if (lecturer) { setUserRole('lecturer'); setCurrentUser(JSON.parse(lecturer)); setActiveTab('reports'); loadReports(); return; }
      setUserRole('student'); setActiveTab('submit');
    } catch (e) {}
  };

  const loadReporterToken = async () => {
    try {
      let token = await AsyncStorage.getItem('anonymous_reporter_token');
      if (!token) {
        token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('anonymous_reporter_token', token);
      }
      setReporterToken(token);
    } catch (e) {}
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase.from('anonymous_reports').select('*').order('created_at', { ascending: false });
      if (error) { console.log('loadReports:', error.message); return; }
      setReports(data || []);
    } catch (e) {}
  };

  const loadMyReports = async (token: string) => {
    try {
      if (!token) return;
      // Try reporter_token first
      let { data } = await supabase.from('anonymous_reports').select('*').eq('reporter_token', token).order('created_at', { ascending: false });
      // If nothing found, try student_token
      if (!data || data.length === 0) {
        const r2 = await supabase.from('anonymous_reports').select('*').eq('student_token', token).order('created_at', { ascending: false });
        data = r2.data;
      }
      setReports(data || []);
    } catch (e) {}
  };

  const loadFollowUps = async (reportId: string) => {
    try {
      const { data, error } = await supabase.from('anonymous_followups').select('*').eq('report_id', reportId).order('created_at', { ascending: true });
      if (error) { console.log('loadFollowUps:', error.message); return; }
      setFollowUps(data || []);
    } catch (e) {}
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType(result.assets[0].type || 'image');
      }
    } catch (e) {}
  };

  const uploadMedia = async (uri: string, type: string): Promise<string> => {
    try {
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `anonymous-reports/${Date.now()}.${ext}`;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const { error } = await supabase.storage.from('campus-iq').upload(path, blob, {
        contentType: type === 'video' ? 'video/mp4' : 'image/jpeg'
      });
      if (error) { console.log('upload error:', error.message); return ''; }
      const { data } = supabase.storage.from('campus-iq').getPublicUrl(path);
      return data.publicUrl;
    } catch (e) { return ''; }
  };

  const submitReport = async () => {
    if (!message.trim()) { Alert.alert('Missing', 'Please describe the issue'); return; }
    setSubmitting(true);
    try {
      let uploadedMediaUrl = '';
      if (mediaUri) uploadedMediaUrl = await uploadMedia(mediaUri, mediaType);

      const token = reporterToken || `tok_${Date.now()}`;

      // Try submitting with all column variants — from most complete to minimal
      const payloads = [
        // All columns including both token variants
        {
          report_text: message.trim(), message: message.trim(),
          category, status: 'pending',
          reporter_token: token, student_token: token,
          ...(uploadedMediaUrl ? { media_url: uploadedMediaUrl, media_type: mediaType } : {}),
        },
        // Without student_token
        {
          report_text: message.trim(), message: message.trim(),
          category, status: 'pending', reporter_token: token,
          ...(uploadedMediaUrl ? { media_url: uploadedMediaUrl, media_type: mediaType } : {}),
        },
        // Without reporter_token
        {
          report_text: message.trim(), message: message.trim(),
          category, status: 'pending', student_token: token,
          ...(uploadedMediaUrl ? { media_url: uploadedMediaUrl, media_type: mediaType } : {}),
        },
        // report_text only
        { report_text: message.trim(), category, status: 'pending' },
        // message only
        { message: message.trim(), category, status: 'pending' },
      ];

      let success = false;
      for (const payload of payloads) {
        try {
          const { error } = await supabase.from('anonymous_reports').insert(payload);
          if (!error) { success = true; break; }
          console.log('payload attempt failed:', error.message);
          const msg = error.message.toLowerCase();
          if (!msg.includes('null') && !msg.includes('column') && !msg.includes('constraint')) {
            Alert.alert('Error', error.message); setSubmitting(false); return;
          }
        } catch (e: any) { console.log('attempt exception:', e.message); }
      }

      if (!success) { Alert.alert('Error', 'Could not submit. Run the SQL fix in Supabase first.'); setSubmitting(false); return; }

      setMessage(''); setMediaUri(''); setMediaType('');
      Alert.alert('✅ Report Submitted', 'Your anonymous report has been submitted successfully.', [
        { text: 'View My Reports', onPress: () => { loadMyReports(token); setActiveTab('reports'); } },
        { text: 'OK' }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit');
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
      const senderName = isReporter ? 'Anonymous Reporter'
        : currentUser?.name ? `${currentUser.name} ${currentUser.surname || ''}`.trim() : userRole;
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
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSendingFollowUp(false); }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    await supabase.from('anonymous_reports').update({ status: newStatus }).eq('id', reportId);
    loadReports();
  };

  const statusColor = (s: string) => s === 'resolved' ? '#1D9E75' : s === 'investigating' ? '#FFD700' : '#D85A30';
  const getReportText = (r: any) => r.message || r.report_text || r.text || '(No message)';
  const isImageType = (url: string, type: string) => (type === 'image') || !!url?.match(/\.(jpg|jpeg|png|gif|webp)/i);

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
            if (userRole === 'student') loadMyReports(reporterToken);
            else loadReports();
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
            <TextInput
              style={styles.msgInput}
              placeholder="Describe what happened, where, when..."
              placeholderTextColor="#aaa"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Attach Evidence (optional)</Text>
            <TouchableOpacity style={styles.mediaPicker} onPress={pickMedia}>
              {mediaUri ? (
                <View style={{ position: 'relative' }}>
                  {mediaType === 'image' ? (
                    <Image source={{ uri: mediaUri }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
                  ) : (
                    <View style={{ alignItems: 'center', justifyContent: 'center', height: 120, gap: 8 }}>
                      <Ionicons name="videocam" size={40} color="#534AB7" />
                      <Text style={{ color: '#a0c4ff' }}>Video selected — tap to change</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15 }}
                    onPress={() => { setMediaUri(''); setMediaType(''); }}
                  >
                    <Ionicons name="close-circle" size={30} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
                  <Ionicons name="image-outline" size={36} color="#534AB7" />
                  <Text style={{ color: '#a0c4ff', fontSize: 14 }}>Tap to attach photo or video</Text>
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
            {(userRole === 'admin' || userRole === 'lecturer') && (
              <TouchableOpacity style={styles.refreshBtn} onPress={loadReports}>
                <Ionicons name="refresh-outline" size={16} color="#FFD700" />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            )}

            {reports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-outline" size={60} color="#534AB7" />
                <Text style={styles.emptyTitle}>{userRole === 'student' ? 'No Reports Yet' : 'No Reports'}</Text>
                <Text style={styles.emptyText}>
                  {userRole === 'student' ? 'Use Submit Report tab to submit' : 'No anonymous reports yet'}
                </Text>
              </View>
            ) : (
              reports.map((r: any) => (
                <View key={r.id} style={styles.reportCard}>
                  <View style={styles.reportTop}>
                    <View style={styles.catPill}>
                      <Text style={styles.catPillText}>{r.category || 'General'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColor(r.status || 'pending') + '22', borderColor: statusColor(r.status || 'pending') }]}>
                      <Text style={[styles.statusPillText, { color: statusColor(r.status || 'pending') }]}>
                        {(r.status || 'pending').charAt(0).toUpperCase() + (r.status || 'pending').slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.reportDate}>
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>

                  <Text style={styles.reportMessage}>{getReportText(r)}</Text>

                  {/* MEDIA — full inline image display */}
                  {r.media_url ? (
                    <View style={styles.mediaSection}>
                      <Text style={styles.mediaSectionLabel}>📎 Attached Evidence:</Text>
                      {isImageType(r.media_url, r.media_type || '') ? (
                        <TouchableOpacity onPress={() => Linking.openURL(r.media_url)} activeOpacity={0.85}>
                          <View style={styles.mediaImgBox}>
                            <Image
                              source={{ uri: r.media_url }}
                              style={styles.mediaImg}
                              resizeMode="cover"
                            />
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
                  ) : null}

                  {(userRole === 'admin' || userRole === 'lecturer') && (
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      {['pending', 'investigating', 'resolved'].map(s => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.statusBtn, r.status === s && { backgroundColor: statusColor(s) + '33', borderColor: statusColor(s) }]}
                          onPress={() => updateStatus(r.id, s)}
                        >
                          <Text style={[styles.statusBtnText, r.status === s && { color: statusColor(s), fontWeight: 'bold' }]}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

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
                  <Text style={styles.chatSub}>
                    {userRole === 'student' ? 'Identity protected' : `Category: ${selectedReport?.category || 'Report'}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setShowFollowUpModal(false); setFollowUps([]); setFollowUpMsg(''); }}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.anonNote}>
                <Ionicons name="shield-checkmark" size={14} color="#1D9E75" />
                <Text style={styles.anonNoteText}>
                  {userRole === 'student' ? 'You appear as "Anonymous Reporter".' : 'Reporter is anonymous — shown as "Anonymous Reporter".'}
                </Text>
              </View>

              <ScrollView ref={scrollRef} style={styles.chatMsgs} contentContainerStyle={{ paddingBottom: 10 }}>
                {followUps.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
                    <Ionicons name="chatbubble-outline" size={40} color="#534AB7" />
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>No messages yet</Text>
                    <Text style={{ color: '#a0c4ff', fontSize: 13, textAlign: 'center' }}>
                      {userRole === 'student' ? 'Send an anonymous follow-up' : 'Reply to the anonymous reporter'}
                    </Text>
                  </View>
                ) : (
                  followUps.map((fu: any) => {
                    const isMine = (userRole === 'student' && fu.sender_role === 'reporter') ||
                      (userRole !== 'student' && fu.sender_role !== 'reporter');
                    return (
                      <View key={fu.id} style={[styles.bubbleWrap, isMine && styles.bubbleWrapRight]}>
                        <View style={[styles.bubble2, isMine ? styles.bubbleMe2 : styles.bubbleThem2]}>
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
                  <Ionicons name="send" size={20} color="#fff" />
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
  container: { flex: 1, backgroundColor: '#001029' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a1a2e', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2a3a5a' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  tabRow: { flexDirection: 'row', backgroundColor: '#0a1a2e', borderBottomWidth: 1, borderBottomColor: '#2a3a5a' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#a0c4ff', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  content: { padding: 16, paddingBottom: 40 },
  anonBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 16 },
  anonBannerText: { color: '#1D9E75', fontSize: 13, flex: 1, lineHeight: 18 },
  label: { color: '#a0c4ff', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7', marginRight: 8, backgroundColor: '#0a1a2e' },
  catBtnActive: { backgroundColor: '#534AB7' },
  catBtnText: { color: '#a0c4ff', fontSize: 13 },
  catBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  msgInput: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, fontSize: 15, color: '#fff', minHeight: 140, marginBottom: 16, textAlignVertical: 'top' },
  mediaPicker: { backgroundColor: '#0a1a2e', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', minHeight: 120, marginBottom: 16, overflow: 'hidden' },
  submitBtn: { backgroundColor: '#534AB7', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 10, marginBottom: 14, alignSelf: 'flex-start' },
  refreshBtnText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  reportCard: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 14, padding: 14, marginBottom: 14 },
  reportTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  catPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#534AB722' },
  catPillText: { color: '#a0c4ff', fontSize: 12, fontWeight: 'bold' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusPillText: { fontSize: 12, fontWeight: 'bold' },
  reportDate: { color: '#7a9cc4', fontSize: 11, marginLeft: 'auto' },
  reportMessage: { color: '#fff', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  mediaSection: { marginBottom: 12 },
  mediaSectionLabel: { color: '#a0c4ff', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  mediaImgBox: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  mediaImg: { width: '100%', height: 200 },
  mediaImgOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
  mediaImgOverlayText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  mediaFileBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12 },
  mediaFileBtnText: { color: '#fff', fontSize: 14, flex: 1 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7' },
  statusBtnText: { color: '#a0c4ff', fontSize: 12 },
  followUpBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 10 },
  followUpBtnText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold', flex: 1 },
  chatOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  chatBox: { backgroundColor: '#001029', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#0a1a2e' },
  chatTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  chatSub: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  anonNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#0a3d2e', margin: 12, marginTop: 0, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1D9E75' },
  anonNoteText: { color: '#1D9E75', fontSize: 12, flex: 1 },
  chatMsgs: { flex: 1, padding: 12 },
  bubbleWrap: { marginBottom: 10, alignItems: 'flex-start' },
  bubbleWrapRight: { alignItems: 'flex-end' },
  bubble2: { maxWidth: '80%', padding: 12, borderRadius: 14 },
  bubbleMe2: { backgroundColor: '#534AB7', borderBottomRightRadius: 4 },
  bubbleThem2: { backgroundColor: '#0a2a4a', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#534AB7' },
  bubbleSender: { fontSize: 11, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: '#a0c4ff', marginTop: 4, textAlign: 'right' },
  chatInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#0a1a2e' },
  chatInput: { flex: 1, backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#534AB7', borderRadius: 20, padding: 12, fontSize: 15, color: '#fff', maxHeight: 100 },
  chatSendBtn: { backgroundColor: '#534AB7', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});