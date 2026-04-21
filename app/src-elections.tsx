import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert, Animated, Image, Modal, RefreshControl,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function SRCElections() {
  const router = useRouter();
  const [userType, setUserType] = useState('');
  const [user, setUser] = useState<any>(null);
  const [elections, setElections] = useState<any[]>([]);
  const [activeElection, setActiveElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddElection, setShowAddElection] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Election form
  const [electionTitle, setElectionTitle] = useState('');
  const [electionDesc, setElectionDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Candidate form
  const [candName, setCandName] = useState('');
  const [candPosition, setCandPosition] = useState('');
  const [candManifesto, setCandManifesto] = useState('');
  const [candImageUri, setCandImageUri] = useState('');
  const [loading, setLoading] = useState(false);

  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const student = await AsyncStorage.getItem('current_student');
    const admin = await AsyncStorage.getItem('current_admin');
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (student) { setUser(JSON.parse(student)); setUserType('student'); }
    else if (admin) { setUser(JSON.parse(admin)); setUserType('admin'); }
    else if (lecturer) { setUser(JSON.parse(lecturer)); setUserType('lecturer'); }
    loadElections();
  };

  const loadElections = async () => {
    const { data } = await supabase.from('elections').select('*').order('created_at', { ascending: false });
    setElections(data || []);
  };

  const loadCandidates = async (electionId: string) => {
    const { data } = await supabase.from('candidates').select('*').eq('election_id', electionId).order('vote_count', { ascending: false });
    setCandidates(data || []);
  };

  const loadMyVotes = async (electionId: string, studentId: string) => {
    const { data } = await supabase.from('votes').select('candidate_id').eq('election_id', electionId).eq('student_id', studentId);
    setMyVotes((data || []).map((v: any) => v.candidate_id));
  };

  const openElection = async (election: any) => {
    setActiveElection(election);
    await loadCandidates(election.id);
    if (userType === 'student' && user) await loadMyVotes(election.id, user.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadElections();
    if (activeElection) await loadCandidates(activeElection.id);
    setRefreshing(false);
  };

  const pickCandidateImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setCandImageUri(result.assets[0].uri);
  };

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `candidates/${Date.now()}.jpg`;
      await supabase.storage.from('campus-iq').upload(fileName, blob, { contentType: 'image/jpeg' });
      const { data } = supabase.storage.from('campus-iq').getPublicUrl(fileName);
      return data.publicUrl;
    } catch { return ''; }
  };

  const handleCreateElection = async () => {
    if (!electionTitle) { Alert.alert('Missing', 'Please enter election title'); return; }
    setLoading(true);
    try {
      await supabase.from('elections').insert({ title: electionTitle, description: electionDesc, status: 'upcoming', start_date: startDate || null, end_date: endDate || null });
      Alert.alert('Success', 'Election created!');
      setShowAddElection(false);
      setElectionTitle(''); setElectionDesc(''); setStartDate(''); setEndDate('');
      loadElections();
    } finally { setLoading(false); }
  };

  const handleAddCandidate = async () => {
    if (!candName || !candPosition) { Alert.alert('Missing', 'Name and position required'); return; }
    setLoading(true);
    try {
      let imageUrl = '';
      if (candImageUri) imageUrl = await uploadImage(candImageUri);
      await supabase.from('candidates').insert({ election_id: activeElection.id, name: candName, position: candPosition, manifesto: candManifesto, image_url: imageUrl || null, vote_count: 0 });
      Alert.alert('Success', 'Candidate added!');
      setShowAddCandidate(false);
      setCandName(''); setCandPosition(''); setCandManifesto(''); setCandImageUri('');
      loadCandidates(activeElection.id);
    } finally { setLoading(false); }
  };

  const handleVote = async (candidate: any) => {
    if (!user || userType !== 'student') { Alert.alert('Error', 'Only students can vote'); return; }
    if (myVotes.includes(candidate.id)) { Alert.alert('Already Voted', 'You already voted for this position'); return; }
    if (activeElection.status !== 'active') { Alert.alert('Not Active', 'Voting is not open yet'); return; }

    Alert.alert('Confirm Vote', `Vote for ${candidate.name} as ${candidate.position}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Vote', onPress: async () => {
        try {
          await supabase.from('votes').insert({ election_id: activeElection.id, candidate_id: candidate.id, student_id: user.id, position: candidate.position });
          await supabase.from('candidates').update({ vote_count: candidate.vote_count + 1 }).eq('id', candidate.id);
          setMyVotes(v => [...v, candidate.id]);
          loadCandidates(activeElection.id);
          Alert.alert('Vote Cast!', `You voted for ${candidate.name}`);
        } catch (e: any) {
          Alert.alert('Error', 'Could not cast vote. You may have already voted for this position.');
        }
      }}
    ]);
  };

  const handleUpdateStatus = async (election: any, status: string) => {
    await supabase.from('elections').update({ status }).eq('id', election.id);
    if (status === 'completed') {
      // Announce winner via notification
      const byPosition: any = {};
      candidates.forEach(c => {
        if (!byPosition[c.position] || c.vote_count > byPosition[c.position].vote_count) byPosition[c.position] = c;
      });
      const winners = Object.values(byPosition) as any[];
      const announcement = winners.map(w => `${w.position}: ${w.name} (${w.vote_count} votes)`).join('\n');
      await supabase.from('notifications').insert({ title: `SRC Election Results: ${election.title}`, message: `Winners:\n${announcement}`, type: 'election' });
      Alert.alert('Election Completed', 'Results announced via notifications!');
    }
    loadElections();
    setActiveElection({ ...election, status });
  };

  const getStatusColor = (s: string) => s === 'active' ? '#1D9E75' : s === 'completed' ? '#FFD700' : '#a0c4ff';

  const groupByPosition = () => {
    const groups: any = {};
    candidates.forEach(c => { if (!groups[c.position]) groups[c.position] = []; groups[c.position].push(c); });
    return groups;
  };

  if (activeElection) {
    const groups = groupByPosition();
    const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setActiveElection(null); setCandidates([]); setMyVotes([]); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{activeElection.title}</Text>
          {userType === 'admin' && (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddCandidate(true)}>
              <Ionicons name="person-add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}>
          {/* Election Status Banner */}
          <View style={[styles.statusBanner, { borderColor: getStatusColor(activeElection.status) }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(activeElection.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(activeElection.status) }]}>{activeElection.status?.toUpperCase()}</Text>
            <Text style={styles.totalVotesText}>{totalVotes} total votes</Text>
          </View>

          {activeElection.description ? <Text style={styles.electionDesc}>{activeElection.description}</Text> : null}

          {/* Admin Controls */}
          {userType === 'admin' && (
            <View style={styles.adminControls}>
              {activeElection.status === 'upcoming' && (
                <TouchableOpacity style={[styles.controlBtn, { borderColor: '#1D9E75' }]} onPress={() => handleUpdateStatus(activeElection, 'active')}>
                  <Ionicons name="play-circle-outline" size={18} color="#1D9E75" />
                  <Text style={[styles.controlBtnText, { color: '#1D9E75' }]}>Open Voting</Text>
                </TouchableOpacity>
              )}
              {activeElection.status === 'active' && (
                <TouchableOpacity style={[styles.controlBtn, { borderColor: '#FFD700' }]} onPress={() => handleUpdateStatus(activeElection, 'completed')}>
                  <Ionicons name="trophy-outline" size={18} color="#FFD700" />
                  <Text style={[styles.controlBtnText, { color: '#FFD700' }]}>Close & Announce Results</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Candidates by Position */}
          {Object.keys(groups).map(position => (
            <View key={position}>
              <Text style={styles.positionTitle}>{position}</Text>
              {groups[position]
                .sort((a: any, b: any) => b.vote_count - a.vote_count)
                .map((candidate: any, idx: number) => {
                  const isFirst = idx === 0 && activeElection.status === 'completed';
                  const pct = totalVotes > 0 ? Math.round((candidate.vote_count / totalVotes) * 100) : 0;
                  const hasVotedThis = myVotes.includes(candidate.id);
                  return (
                    <View key={candidate.id} style={[styles.candidateCard, isFirst && styles.candidateCardWinner]}>
                      {isFirst && <View style={styles.winnerBadge}><Text style={styles.winnerBadgeText}>🏆 WINNER</Text></View>}
                      <View style={styles.candidateTop}>
                        {candidate.image_url ? (
                          <Image source={{ uri: candidate.image_url }} style={styles.candidateImage} />
                        ) : (
                          <View style={styles.candidateAvatar}>
                            <Ionicons name="person" size={28} color="#534AB7" />
                          </View>
                        )}
                        <View style={styles.candidateInfo}>
                          <Text style={styles.candidateName}>{candidate.name}</Text>
                          <Text style={styles.candidatePosition}>{candidate.position}</Text>
                          {candidate.manifesto ? <Text style={styles.candidateManifesto} numberOfLines={2}>{candidate.manifesto}</Text> : null}
                        </View>
                        <View style={styles.candidateVotes}>
                          <Text style={styles.voteCount}>{candidate.vote_count}</Text>
                          <Text style={styles.voteLabel}>votes</Text>
                          <Text style={styles.votePct}>{pct}%</Text>
                        </View>
                      </View>
                      <View style={styles.voteBar}>
                        <View style={[styles.voteBarFill, { width: `${pct}%`, backgroundColor: isFirst ? '#FFD700' : '#534AB7' }]} />
                      </View>
                      {userType === 'student' && activeElection.status === 'active' && !hasVotedThis && (
                        <TouchableOpacity style={styles.voteBtn} onPress={() => handleVote(candidate)}>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={styles.voteBtnText}>Vote</Text>
                        </TouchableOpacity>
                      )}
                      {hasVotedThis && (
                        <View style={styles.votedBadge}>
                          <Ionicons name="checkmark-circle" size={16} color="#1D9E75" />
                          <Text style={styles.votedText}>You voted for this candidate</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          ))}

          {candidates.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Candidates Yet</Text>
              {userType === 'admin' && <Text style={styles.emptyText}>Tap the + button to add candidates</Text>}
            </View>
          )}
        </ScrollView>

        {/* Add Candidate Modal */}
        <Modal visible={showAddCandidate} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Candidate</Text>
                <TouchableOpacity onPress={() => setShowAddCandidate(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
              </View>
              <ScrollView>
                <TouchableOpacity style={styles.imagePicker} onPress={pickCandidateImage}>
                  {candImageUri ? <Image source={{ uri: candImageUri }} style={styles.pickedImage} /> : (
                    <View style={styles.imagePickerInner}>
                      <Ionicons name="person-add-outline" size={36} color="#534AB7" />
                      <Text style={styles.imagePickerText}>Add Candidate Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {[
                  { label: 'Full Name *', value: candName, set: setCandName, ph: 'e.g. John Moyo' },
                  { label: 'Position *', value: candPosition, set: setCandPosition, ph: 'e.g. SRC President' },
                  { label: 'Manifesto', value: candManifesto, set: setCandManifesto, ph: 'Campaign promises...' },
                ].map((f, i) => (
                  <View key={i} style={styles.formGroup}>
                    <Text style={styles.formLabel}>{f.label}</Text>
                    <TextInput style={[styles.formInput, f.label === 'Manifesto' && { height: 80, textAlignVertical: 'top' }]} placeholder={f.ph} placeholderTextColor="#aaa" value={f.value} onChangeText={f.set} multiline={f.label === 'Manifesto'} />
                  </View>
                ))}
                <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleAddCandidate} disabled={loading}>
                  <Text style={styles.submitBtnText}>{loading ? 'Adding...' : 'Add Candidate'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SRC Elections</Text>
        {userType === 'admin' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddElection(true)}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}>
        {elections.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="ballot-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No Elections Yet</Text>
            {userType === 'admin' && <Text style={styles.emptyText}>Tap + to create an election</Text>}
          </View>
        ) : (
          elections.map(election => (
            <TouchableOpacity key={election.id} style={styles.electionCard} onPress={() => openElection(election)}>
              <View style={styles.electionCardTop}>
                <Text style={styles.electionCardTitle}>{election.title}</Text>
                <View style={[styles.statusPill, { borderColor: getStatusColor(election.status), backgroundColor: getStatusColor(election.status) + '22' }]}>
                  <Text style={[styles.statusPillText, { color: getStatusColor(election.status) }]}>{election.status?.toUpperCase()}</Text>
                </View>
              </View>
              {election.description ? <Text style={styles.electionCardDesc} numberOfLines={2}>{election.description}</Text> : null}
              <View style={styles.electionCardBottom}>
                <Ionicons name="people-outline" size={14} color="#a0c4ff" />
                <Text style={styles.electionCardMeta}>Tap to view candidates & vote</Text>
                <Ionicons name="chevron-forward" size={16} color="#a0c4ff" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Create Election Modal */}
      <Modal visible={showAddElection} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Election</Text>
              <TouchableOpacity onPress={() => setShowAddElection(false)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            <ScrollView>
              {[
                { label: 'Election Title *', value: electionTitle, set: setElectionTitle, ph: 'e.g. SRC Elections 2026' },
                { label: 'Description', value: electionDesc, set: setElectionDesc, ph: 'Brief description...' },
                { label: 'Start Date (optional)', value: startDate, set: setStartDate, ph: 'e.g. 2026-05-01' },
                { label: 'End Date (optional)', value: endDate, set: setEndDate, ph: 'e.g. 2026-05-07' },
              ].map((f, i) => (
                <View key={i} style={styles.formGroup}>
                  <Text style={styles.formLabel}>{f.label}</Text>
                  <TextInput style={styles.formInput} placeholder={f.ph} placeholderTextColor="#aaa" value={f.value} onChangeText={f.set} />
                </View>
              ))}
              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.6 }]} onPress={handleCreateElection} disabled={loading}>
                <Text style={styles.submitBtnText}>{loading ? 'Creating...' : 'Create Election'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#FFD700' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', flex: 1, textAlign: 'center' },
  addBtn: { backgroundColor: '#534AB7', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 14 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  electionCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 16 },
  electionCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  electionCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 8 },
  electionCardDesc: { fontSize: 13, color: '#a0c4ff', marginBottom: 10, lineHeight: 20 },
  electionCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  electionCardMeta: { fontSize: 12, color: '#a0c4ff', flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusPillText: { fontSize: 11, fontWeight: 'bold' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: 'bold', flex: 1 },
  totalVotesText: { fontSize: 13, color: '#a0c4ff' },
  electionDesc: { fontSize: 14, color: '#a0c4ff', marginBottom: 16, lineHeight: 22 },
  adminControls: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  controlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, backgroundColor: '#0a2a4a' },
  controlBtnText: { fontWeight: 'bold', fontSize: 14 },
  positionTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', marginBottom: 10, marginTop: 8, letterSpacing: 1 },
  candidateCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 14, marginBottom: 10 },
  candidateCardWinner: { borderColor: '#FFD700', backgroundColor: '#1a1000' },
  winnerBadge: { backgroundColor: '#FFD70022', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  winnerBadgeText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  candidateTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  candidateImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#534AB7' },
  candidateAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1650', borderWidth: 2, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  candidatePosition: { fontSize: 13, color: '#FFD700', marginBottom: 4 },
  candidateManifesto: { fontSize: 12, color: '#a0c4ff' },
  candidateVotes: { alignItems: 'center' },
  voteCount: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  voteLabel: { fontSize: 11, color: '#a0c4ff' },
  votePct: { fontSize: 13, color: '#a0c4ff' },
  voteBar: { height: 6, backgroundColor: '#001f4d', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  voteBarFill: { height: 6, borderRadius: 3 },
  voteBtn: { backgroundColor: '#534AB7', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  voteBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  votedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  votedText: { color: '#1D9E75', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  imagePicker: { backgroundColor: '#001f4d', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', height: 120, marginBottom: 16, overflow: 'hidden' },
  imagePickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerText: { color: '#a0c4ff', fontSize: 14 },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, color: '#a0c4ff', marginBottom: 6, fontWeight: '600' },
  formInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14 },
  submitBtn: { backgroundColor: '#534AB7', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
