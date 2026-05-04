import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function ManageVenues() {
  const router = useRouter();
  const [venues, setVenues] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canToggle, setCanToggle] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState<any>(null);
  const [vName, setVName] = useState('');
  const [vCampus, setVCampus] = useState('');
  const [vCapacity, setVCapacity] = useState('');
  const [vStatus, setVStatus] = useState('available');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<any>(null);
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadUser();
    // Realtime subscription — venues update instantly for everyone
    subscriptionRef.current = supabase
      .channel('venues-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venues' }, () => {
        loadVenues();
      })
      .subscribe();

    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, []);

  const loadUser = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    if (admin) { setUserRole('admin'); setCanEdit(true); setCanToggle(true); loadVenues(); return; }
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (lecturer) {
      const l = JSON.parse(lecturer); setUserRole('lecturer'); setCurrentUser(l); setCanEdit(true); setCanToggle(true);
      loadVenues(); loadLecturerClasses(l.id); loadMonitors(l.id); return;
    }
    const student = await AsyncStorage.getItem('current_student');
    if (student) {
      const s = JSON.parse(student); setUserRole('student'); setCurrentUser(s); setCanEdit(false);
      const { data } = await supabase.from('venue_monitors').select('id').eq('student_id', s.id).maybeSingle();
      setCanToggle(!!data); loadVenues();
    }
  };

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('campus').order('name');
    setVenues(data || []);
  };

  const loadLecturerClasses = async (lid: string) => {
    const { data } = await supabase.from('classes').select('id, class_name, class_code').eq('lecturer_id', lid).order('class_name');
    setLecturerClasses(data || []);
  };

  const loadMonitors = async (lid: string) => {
    const { data: myClasses } = await supabase.from('classes').select('id').eq('lecturer_id', lid);
    if (!myClasses || myClasses.length === 0) { setMonitors([]); return; }
    const classIds = myClasses.map((c: any) => c.id);
    const { data } = await supabase.from('venue_monitors').select('id, student_id, class_id, classes(class_name)').in('class_id', classIds);
    if (!data || data.length === 0) { setMonitors([]); return; }
    const { data: students } = await supabase.from('students').select('id, name, surname, reg_number').in('id', data.map((m: any) => m.student_id));
    const sMap: any = {};
    (students || []).forEach((s: any) => { sMap[s.id] = s; });
    setMonitors(data.map((m: any) => ({ ...m, student: sMap[m.student_id] })));
  };

  const loadClassStudents = async (classId: string) => {
    const { data: enrollments } = await supabase.from('class_enrollments').select('student_id').eq('class_id', classId);
    if (!enrollments || enrollments.length === 0) { setClassStudents([]); return; }
    const { data: students } = await supabase.from('students').select('id, name, surname, reg_number').in('id', enrollments.map((e: any) => e.student_id));
    setClassStudents(students || []);
  };

  const assignMonitor = async (studentId: string, classId: string) => {
    const existing = monitors.filter((m: any) => m.class_id === classId);
    if (existing.length >= 2) { Alert.alert('Limit Reached', 'Maximum 2 venue monitors per class.'); return; }
    if (existing.find((m: any) => m.student_id === studentId)) { Alert.alert('Already Assigned', 'This student is already a monitor'); return; }
    const { error } = await supabase.from('venue_monitors').insert({ student_id: studentId, class_id: classId, assigned_by: currentUser.id });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Assigned!', 'Student can now toggle venue status.');
    loadMonitors(currentUser.id);
  };

  const removeMonitor = async (monitorId: string) => {
    Alert.alert('Remove Monitor', 'Remove this venue monitor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await supabase.from('venue_monitors').delete().eq('id', monitorId); loadMonitors(currentUser.id); } }
    ]);
  };

  const toggleStatus = async (venue: any) => {
    if (!canToggle) { Alert.alert('View Only', 'Only assigned monitors and staff can update venue status'); return; }
    const next = venue.status === 'available' ? 'occupied' : venue.status === 'occupied' ? 'maintenance' : 'available';
    await supabase.from('venues').update({ status: next }).eq('id', venue.id);
    // Realtime subscription will auto-refresh
  };

  const handleSave = async () => {
    if (!vName || !vCampus || !vCapacity) { Alert.alert('Missing', 'Fill in all fields'); return; }
    setLoading(true);
    try {
      if (editingVenue) {
        await supabase.from('venues').update({ name: vName, campus: vCampus, capacity: parseInt(vCapacity) || 0, status: vStatus }).eq('id', editingVenue.id);
      } else {
        await supabase.from('venues').insert({ name: vName, campus: vCampus, capacity: parseInt(vCapacity) || 0, status: vStatus });
      }
      setShowForm(false); setVName(''); setVCampus(''); setVCapacity(''); setVStatus('available'); setEditingVenue(null);
    } finally { setLoading(false); }
  };

  const handleDelete = (venue: any) => {
    Alert.alert('Delete', `Remove ${venue.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('venues').delete().eq('id', venue.id); } }
    ]);
  };

  const sc = (s: string) => s === 'available' ? '#1D9E75' : s === 'maintenance' ? '#D8832A' : '#D85A30';
  const sb = (s: string) => s === 'available' ? '#0a3d2e' : s === 'maintenance' ? '#2a1500' : '#3d1a0a';
  const si = (s: string): any => s === 'available' ? 'checkmark-circle' : s === 'maintenance' ? 'construct' : 'close-circle';

  const filtered = venues.filter(v =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.campus?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalVenues = venues.length;
  const freeVenues = venues.filter(v => v.status === 'available').length;
  const occupiedVenues = venues.filter(v => v.status === 'occupied').length;
  const maintenanceVenues = venues.filter(v => v.status === 'maintenance').length;
  const campuses = [...new Set(filtered.map((v: any) => v.campus))].sort();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
        <Text style={styles.title}>Venues</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {userRole === 'lecturer' && (
            <TouchableOpacity onPress={() => setShowAssignModal(true)}>
              <Ionicons name="person-add-outline" size={24} color="#FFD700" />
            </TouchableOpacity>
          )}
          {canEdit && (
            <TouchableOpacity onPress={() => { setShowForm(!showForm); setEditingVenue(null); setVName(''); setVCampus(''); setVCapacity(''); setVStatus('available'); }}>
              <Ionicons name={showForm ? 'close' : 'add'} size={26} color="#FFD700" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="location-outline" size={22} color="#a0c4ff" />
          <Text style={styles.statNum}>{totalVenues}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#1D9E75' }]}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#1D9E75" />
          <Text style={[styles.statNum, { color: '#1D9E75' }]}>{freeVenues}</Text>
          <Text style={styles.statLabel}>Free</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D85A30' }]}>
          <Ionicons name="close-circle-outline" size={22} color="#D85A30" />
          <Text style={[styles.statNum, { color: '#D85A30' }]}>{occupiedVenues}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D8832A' }]}>
          <Ionicons name="construct-outline" size={22} color="#D8832A" />
          <Text style={[styles.statNum, { color: '#D8832A' }]}>{maintenanceVenues}</Text>
          <Text style={styles.statLabel}>Maint.</Text>
        </View>
      </View>

      <View style={[styles.banner, { borderColor: canToggle ? '#1D9E75' : '#534AB7', backgroundColor: canToggle ? '#0a3d2e' : '#1a1650' }]}>
        <Ionicons name={canToggle ? 'shield-checkmark' : 'eye-outline'} size={16} color={canToggle ? '#1D9E75' : '#a0c4ff'} />
        <Text style={[styles.bannerText, { color: canToggle ? '#1D9E75' : '#a0c4ff' }]}>
          {userRole === 'admin' ? 'Admin — Full venue management' :
            userRole === 'lecturer' ? 'Lecturer — Manage venues. Tap person+ to assign monitors' :
              canToggle ? 'Venue Monitor — Tap a venue card to toggle its status' :
                'View only — Status managed by monitors and staff'}
        </Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#a0c4ff" />
        <TextInput style={styles.searchInput} placeholder="Search venues..." placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {userRole === 'lecturer' && monitors.length > 0 && (
        <View style={styles.monitorsBox}>
          <Text style={styles.monitorsTitle}>Venue Monitors</Text>
          {monitors.map((m: any) => (
            <View key={m.id} style={styles.monitorRow}>
              <Ionicons name="shield-checkmark" size={16} color="#1D9E75" />
              <View style={{ flex: 1 }}>
                <Text style={styles.monitorName}>{m.student?.name} {m.student?.surname}</Text>
                <Text style={styles.monitorSub}>{m.student?.reg_number} · {(m.classes as any)?.class_name}</Text>
              </View>
              <TouchableOpacity style={styles.removeMonitorBtn} onPress={() => removeMonitor(m.id)}>
                <Ionicons name="person-remove-outline" size={16} color="#D85A30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {showForm && canEdit && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingVenue ? 'Edit Venue' : 'Add Venue'}</Text>
          {[
            { ph: 'Venue Name e.g. Lecture Hall A', val: vName, set: setVName, kb: 'default' as any },
            { ph: 'Campus e.g. Main Campus', val: vCampus, set: setVCampus, kb: 'default' as any },
            { ph: 'Capacity e.g. 200', val: vCapacity, set: setVCapacity, kb: 'numeric' as any },
          ].map((f, i) => (
            <View key={i} style={styles.inputBox}>
              <TextInput style={styles.input} placeholder={f.ph} placeholderTextColor="#aaa" value={f.val} onChangeText={f.set} keyboardType={f.kb} />
            </View>
          ))}
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusBtnRow}>
            {['available', 'occupied', 'maintenance'].map(s => (
              <TouchableOpacity key={s} style={[styles.statusOptionBtn, vStatus === s && { backgroundColor: sc(s) + '33', borderColor: sc(s) }]} onPress={() => setVStatus(s)}>
                <Text style={[styles.statusOptionText, vStatus === s && { color: sc(s), fontWeight: 'bold' }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setEditingVenue(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : editingVenue ? 'Update' : 'Add Venue'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="location-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Venues Found</Text>
        </View>
      ) : (
        campuses.map(camp => (
          <View key={camp}>
            <Text style={styles.campusHeader}>{camp}</Text>
            {filtered.filter(v => v.campus === camp).map((v: any) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.venueCard, { borderLeftColor: sc(v.status) }]}
                onPress={() => canToggle ? toggleStatus(v) : null}
                activeOpacity={canToggle ? 0.7 : 1}
              >
                <View style={styles.venueRow}>
                  <View style={[styles.statusIconBox, { backgroundColor: sb(v.status) }]}>
                    <Ionicons name={si(v.status)} size={24} color={sc(v.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueName}>{v.name}</Text>
                    <View style={styles.venueMetaRow}>
                      <Ionicons name="people-outline" size={13} color="#a0c4ff" />
                      <Text style={styles.venueMeta}>{v.capacity || 0} seats</Text>
                      <View style={[styles.statusPill, { backgroundColor: sb(v.status), borderColor: sc(v.status) }]}>
                        <Text style={[styles.statusPillText, { color: sc(v.status) }]}>{v.status?.charAt(0).toUpperCase() + v.status?.slice(1)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ gap: 6, alignItems: 'flex-end' }}>
                    {canEdit && (
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingVenue(v); setVName(v.name); setVCampus(v.campus); setVCapacity((v.capacity || 0).toString()); setVStatus(v.status); setShowForm(true); }}>
                          <Ionicons name="pencil-outline" size={16} color="#a0c4ff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(v)}>
                          <Ionicons name="trash-outline" size={16} color="#D85A30" />
                        </TouchableOpacity>
                      </View>
                    )}
                    {canToggle && !canEdit && (
                      <TouchableOpacity style={styles.toggleBtn} onPress={() => toggleStatus(v)}>
                        <Ionicons name="swap-horizontal" size={18} color="#FFD700" />
                        <Text style={styles.toggleBtnText}>Toggle</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))
      )}

      {/* Assign Monitor Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign Venue Monitors</Text>
            <Text style={styles.modalSub}>Select a class then choose up to 2 students</Text>
            {!selectedClassForAssign ? (
              <>
                <Text style={styles.modalLabel}>Select Class:</Text>
                {lecturerClasses.length === 0 ? (
                  <Text style={styles.noClassText}>No classes yet. Create in Classroom first.</Text>
                ) : (
                  lecturerClasses.map((c: any) => (
                    <TouchableOpacity key={c.id} style={styles.classOption} onPress={() => { setSelectedClassForAssign(c); loadClassStudents(c.id); }}>
                      <Ionicons name="school-outline" size={18} color="#1D9E75" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.classOptionName}>{c.class_name}</Text>
                        <Text style={styles.classOptionCode}>{c.class_code}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#a0c4ff" />
                    </TouchableOpacity>
                  ))
                )}
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.backToClasses} onPress={() => { setSelectedClassForAssign(null); setClassStudents([]); }}>
                  <Ionicons name="arrow-back" size={16} color="#a0c4ff" />
                  <Text style={styles.backToClassesText}>Back to classes</Text>
                </TouchableOpacity>
                <Text style={styles.modalLabel}>Students in {selectedClassForAssign.class_name}:</Text>
                {classStudents.length === 0 ? (
                  <Text style={styles.noClassText}>No students enrolled yet.</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 300 }}>
                    {classStudents.map((s: any) => {
                      const isM = monitors.some((m: any) => m.student_id === s.id);
                      return (
                        <View key={s.id} style={styles.studentAssignRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentAssignName}>{s.name} {s.surname}</Text>
                            <Text style={styles.studentAssignReg}>{s.reg_number}</Text>
                          </View>
                          {isM ? (
                            <View style={styles.assignedBadge}>
                              <Ionicons name="shield-checkmark" size={14} color="#1D9E75" />
                              <Text style={styles.assignedBadgeText}>Monitor</Text>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.assignBtn} onPress={() => assignMonitor(s.id, selectedClassForAssign.id)}>
                              <Text style={styles.assignBtnText}>Assign</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => { setShowAssignModal(false); setSelectedClassForAssign(null); setClassStudents([]); }}>
              <Text style={styles.closeModalBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#a0c4ff', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  statLabel: { fontSize: 11, color: '#a0c4ff' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  bannerText: { fontSize: 12, flex: 1, lineHeight: 18 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, marginBottom: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#ffffff' },
  monitorsBox: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 14 },
  monitorsTitle: { color: '#1D9E75', fontWeight: 'bold', fontSize: 13, marginBottom: 10 },
  monitorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0a5a3e' },
  monitorName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  monitorSub: { color: '#a0c4ff', fontSize: 12 },
  removeMonitorBtn: { padding: 6, backgroundColor: '#3d1a0a', borderRadius: 8 },
  form: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 14 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  inputBox: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 10 },
  input: { fontSize: 15, color: '#ffffff' },
  label: { color: '#a0c4ff', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  statusBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusOptionBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  statusOptionText: { color: '#a0c4ff', fontSize: 13 },
  formBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontWeight: 'bold' },
  saveBtn: { flex: 2, backgroundColor: '#534AB7', padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  campusHeader: { color: '#FFD700', fontWeight: 'bold', fontSize: 14, marginBottom: 8, marginTop: 10, letterSpacing: 1 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  venueCard: { backgroundColor: '#0a2a4a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a2a3a', borderLeftWidth: 4 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  venueName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  venueMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  venueMeta: { fontSize: 12, color: '#a0c4ff', marginRight: 8 },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusPillText: { fontSize: 12, fontWeight: 'bold' },
  editBtn: { padding: 6, backgroundColor: '#1a2a3a', borderRadius: 8 },
  deleteBtn: { padding: 6, backgroundColor: '#3d1a0a', borderRadius: 8 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2a2a0e', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700' },
  toggleBtnText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#001f4d', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 18 },
  modalLabel: { color: '#a0c4ff', fontWeight: 'bold', fontSize: 13, marginBottom: 10 },
  noClassText: { color: '#7a9cc4', fontSize: 14, fontStyle: 'italic', marginBottom: 14 },
  classOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, marginBottom: 8 },
  classOptionName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  classOptionCode: { color: '#FFD700', fontSize: 12 },
  backToClasses: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backToClassesText: { color: '#a0c4ff', fontSize: 14 },
  studentAssignRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0a2a4a', borderRadius: 10, padding: 12, marginBottom: 8 },
  studentAssignName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  studentAssignReg: { color: '#a0c4ff', fontSize: 12 },
  assignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0a3d2e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#1D9E75' },
  assignedBadgeText: { color: '#1D9E75', fontSize: 12, fontWeight: 'bold' },
  assignBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  assignBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  closeModalBtn: { backgroundColor: '#534AB7', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  closeModalBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});