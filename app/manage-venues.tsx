import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('available');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<any>(null);
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    if (admin) { setUserRole('admin'); setCanEdit(true); setCanToggle(true); loadVenues(); return; }

    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (lecturer) {
      const l = JSON.parse(lecturer);
      setUserRole('lecturer');
      setCurrentUser(l);
      setCanEdit(true);
      setCanToggle(true);
      loadVenues();
      loadLecturerClasses(l.id);
      loadMonitors(l.id);
      return;
    }

    const student = await AsyncStorage.getItem('current_student');
    if (student) {
      const s = JSON.parse(student);
      setUserRole('student');
      setCurrentUser(s);
      setCanEdit(false);
      const { data } = await supabase.from('venue_monitors').select('id').eq('student_id', s.id).maybeSingle();
      setCanToggle(!!data);
      loadVenues();
    }
  };

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('campus', { ascending: true }).order('name');
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
    const { data } = await supabase
      .from('venue_monitors')
      .select('id, student_id, class_id, classes(class_name)')
      .in('class_id', classIds);
    if (!data || data.length === 0) { setMonitors([]); return; }
    const studentIds = data.map((m: any) => m.student_id);
    const { data: students } = await supabase.from('students').select('id, name, surname, reg_number').in('id', studentIds);
    const sMap: any = {};
    (students || []).forEach((s: any) => { sMap[s.id] = s; });
    setMonitors(data.map((m: any) => ({ ...m, student: sMap[m.student_id] })));
  };

  const loadClassStudents = async (classId: string) => {
    const { data: enrollments } = await supabase.from('class_enrollments').select('student_id').eq('class_id', classId);
    if (!enrollments || enrollments.length === 0) { setClassStudents([]); return; }
    const ids = enrollments.map((e: any) => e.student_id);
    const { data: students } = await supabase.from('students').select('id, name, surname, reg_number').in('id', ids);
    setClassStudents(students || []);
  };

  const assignMonitor = async (studentId: string, classId: string) => {
    const existing = monitors.filter((m: any) => m.class_id === classId);
    if (existing.length >= 2) {
      Alert.alert('Limit Reached', 'Maximum 2 venue monitors per class. Remove one first.'); return;
    }
    const alreadyAssigned = existing.find((m: any) => m.student_id === studentId);
    if (alreadyAssigned) { Alert.alert('Already Assigned', 'This student is already a venue monitor'); return; }

    const { error } = await supabase.from('venue_monitors').insert({
      student_id: studentId,
      class_id: classId,
      assigned_by: currentUser.id,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Assigned!', 'This student can now toggle venue status.');
    loadMonitors(currentUser.id);
  };

  const removeMonitor = async (monitorId: string) => {
    Alert.alert('Remove Monitor', 'Remove this student as venue monitor?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('venue_monitors').delete().eq('id', monitorId);
          loadMonitors(currentUser.id);
        }
      }
    ]);
  };

  const toggleStatus = async (venue: any) => {
    if (!canToggle) {
      Alert.alert('View Only', 'Only assigned venue monitors and staff can update venue status'); return;
    }
    const next = venue.status === 'available' ? 'occupied' : venue.status === 'occupied' ? 'maintenance' : 'available';
    await supabase.from('venues').update({ status: next }).eq('id', venue.id);
    loadVenues();
  };

  const handleSave = async () => {
    if (!name || !campus || !capacity) { Alert.alert('Missing', 'Fill in all fields'); return; }
    setLoading(true);
    try {
      if (editingVenue) {
        await supabase.from('venues').update({ name, campus, capacity: parseInt(capacity), status }).eq('id', editingVenue.id);
      } else {
        await supabase.from('venues').insert({ name, campus, capacity: parseInt(capacity), status });
      }
      setShowForm(false); setName(''); setCampus(''); setCapacity(''); setStatus('available'); setEditingVenue(null);
      loadVenues();
    } finally { setLoading(false); }
  };

  const handleDelete = (venue: any) => {
    Alert.alert('Delete', `Remove ${venue.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('venues').delete().eq('id', venue.id); loadVenues(); } }
    ]);
  };

  const statusColor = (s: string) => s === 'available' ? '#1D9E75' : s === 'maintenance' ? '#D8832A' : '#D85A30';
  const statusBg = (s: string) => s === 'available' ? '#0a3d2e' : s === 'maintenance' ? '#2a1500' : '#3d1a0a';
  const statusIcon = (s: string) => s === 'available' ? 'checkmark-circle' : s === 'maintenance' ? 'construct' : 'close-circle';

  const filtered = venues.filter(v =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.campus?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const campuses = [...new Set(filtered.map((v: any) => v.campus))].sort();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Venues</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {userRole === 'lecturer' && (
            <TouchableOpacity onPress={() => setShowAssignModal(true)}>
              <Ionicons name="person-add-outline" size={24} color="#FFD700" />
            </TouchableOpacity>
          )}
          {canEdit && (
            <TouchableOpacity onPress={() => { setShowForm(!showForm); setEditingVenue(null); setName(''); setCampus(''); setCapacity(''); setStatus('available'); }}>
              <Ionicons name={showForm ? 'close' : 'add'} size={26} color="#FFD700" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Role banner */}
      <View style={[styles.banner, { borderColor: canToggle ? '#1D9E75' : '#534AB7', backgroundColor: canToggle ? '#0a3d2e' : '#1a1650' }]}>
        <Ionicons name={canToggle ? 'shield-checkmark' : 'eye-outline'} size={16} color={canToggle ? '#1D9E75' : '#a0c4ff'} />
        <Text style={[styles.bannerText, { color: canToggle ? '#1D9E75' : '#a0c4ff' }]}>
          {userRole === 'admin' ? 'Admin — Full venue management access' :
            userRole === 'lecturer' ? 'Lecturer — Can manage venues and assign monitors' :
              canToggle ? 'You are a venue monitor — tap a venue to toggle its status' :
                'View only — Venue status is managed by assigned monitors and staff'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#a0c4ff" />
        <TextInput style={styles.searchInput} placeholder="Search venues..." placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      {/* Monitors list for lecturer */}
      {userRole === 'lecturer' && monitors.length > 0 && (
        <View style={styles.monitorsBox}>
          <Text style={styles.monitorsTitle}>Current Venue Monitors</Text>
          {monitors.map((m: any) => (
            <View key={m.id} style={styles.monitorRow}>
              <Ionicons name="shield-checkmark" size={16} color="#1D9E75" />
              <View style={{ flex: 1 }}>
                <Text style={styles.monitorName}>{m.student?.name} {m.student?.surname}</Text>
                <Text style={styles.monitorDetail}>{m.student?.reg_number} · {m.classes?.class_name}</Text>
              </View>
              <TouchableOpacity style={styles.removeMonitorBtn} onPress={() => removeMonitor(m.id)}>
                <Ionicons name="person-remove-outline" size={16} color="#D85A30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add/Edit form */}
      {showForm && canEdit && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingVenue ? 'Edit Venue' : 'Add Venue'}</Text>
          {[
            { ph: 'Venue Name e.g. Lecture Hall A', val: name, set: setName, kb: 'default' as any },
            { ph: 'Campus e.g. Main Campus', val: campus, set: setCampus, kb: 'default' as any },
            { ph: 'Capacity e.g. 200', val: capacity, set: setCapacity, kb: 'numeric' as any },
          ].map((f, i) => (
            <View key={i} style={styles.inputBox}>
              <TextInput style={styles.input} placeholder={f.ph} placeholderTextColor="#aaa" value={f.val} onChangeText={f.set} keyboardType={f.kb} />
            </View>
          ))}
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusBtnRow}>
            {['available', 'occupied', 'maintenance'].map(s => (
              <TouchableOpacity key={s} style={[styles.statusOptionBtn, status === s && { backgroundColor: statusColor(s) + '33', borderColor: statusColor(s) }]} onPress={() => setStatus(s)}>
                <Text style={[styles.statusOptionText, status === s && { color: statusColor(s), fontWeight: 'bold' }]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
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

      {/* Venues grouped by campus */}
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
              <TouchableOpacity key={v.id} style={[styles.venueCard, { borderLeftColor: statusColor(v.status), borderLeftWidth: 4 }]} onPress={() => canToggle ? toggleStatus(v) : null} activeOpacity={canToggle ? 0.7 : 1}>
                <View style={styles.venueRow}>
                  <View style={[styles.statusIconBox, { backgroundColor: statusBg(v.status) }]}>
                    <Ionicons name={statusIcon(v.status) as any} size={24} color={statusColor(v.status)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueName}>{v.name}</Text>
                    <Text style={styles.venueDetail}>Capacity: {v.capacity} seats</Text>
                    <View style={[styles.statusPill, { backgroundColor: statusBg(v.status), borderColor: statusColor(v.status) }]}>
                      <Text style={[styles.statusPillText, { color: statusColor(v.status) }]}>{v.status?.charAt(0).toUpperCase() + v.status?.slice(1)}</Text>
                    </View>
                  </View>
                  {canEdit && (
                    <View style={{ gap: 6 }}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingVenue(v); setName(v.name); setCampus(v.campus); setCapacity(v.capacity?.toString()); setStatus(v.status); setShowForm(true); }}>
                        <Ionicons name="pencil-outline" size={16} color="#a0c4ff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(v)}>
                        <Ionicons name="trash-outline" size={16} color="#D85A30" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {canToggle && !canEdit && (
                    <TouchableOpacity style={styles.toggleBtn} onPress={() => toggleStatus(v)}>
                      <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
                      <Text style={styles.toggleBtnText}>Toggle</Text>
                    </TouchableOpacity>
                  )}
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
            <Text style={styles.modalSub}>Select a class then choose up to 2 students as venue monitors</Text>

            {!selectedClassForAssign ? (
              <>
                <Text style={styles.modalLabel}>Select Class:</Text>
                {lecturerClasses.length === 0 ? (
                  <Text style={styles.noClassText}>No classes created yet. Create classes in Classroom first.</Text>
                ) : (
                  lecturerClasses.map((c: any) => (
                    <TouchableOpacity key={c.id} style={styles.classOption} onPress={() => { setSelectedClassForAssign(c); loadClassStudents(c.id); }}>
                      <Ionicons name="school-outline" size={18} color="#1D9E75" />
                      <View>
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
                      const isMonitor = monitors.some((m: any) => m.student_id === s.id);
                      return (
                        <View key={s.id} style={styles.studentAssignRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentAssignName}>{s.name} {s.surname}</Text>
                            <Text style={styles.studentAssignReg}>{s.reg_number}</Text>
                          </View>
                          {isMonitor ? (
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
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  bannerText: { fontSize: 12, flex: 1, lineHeight: 18 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, marginBottom: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#ffffff' },
  monitorsBox: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 14 },
  monitorsTitle: { color: '#1D9E75', fontWeight: 'bold', fontSize: 13, marginBottom: 10 },
  monitorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0a5a3e' },
  monitorName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  monitorDetail: { color: '#a0c4ff', fontSize: 12 },
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
  venueCard: { backgroundColor: '#0a2a4a', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1a2a3a' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  venueName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  venueDetail: { fontSize: 12, color: '#a0c4ff', marginBottom: 6 },
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