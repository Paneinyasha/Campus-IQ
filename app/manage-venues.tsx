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
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    loadUser();
    // Real-time subscription
    channelRef.current = supabase
      .channel(`venues-live-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'venues' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setVenues(prev => prev.map(v => v.id === payload.new.id ? { ...v, ...payload.new } : v));
        } else if (payload.eventType === 'INSERT') {
          setVenues(prev => [...prev, payload.new].sort((a, b) => a.name?.localeCompare(b.name)));
        } else if (payload.eventType === 'DELETE') {
          setVenues(prev => prev.filter(v => v.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, []);

  const loadUser = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    if (admin) { setUserRole('admin'); setCanEdit(true); setCanToggle(true); fetchVenues(); return; }
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (lecturer) {
      const l = JSON.parse(lecturer); setUserRole('lecturer'); setCurrentUser(l); setCanEdit(true); setCanToggle(true);
      fetchVenues(); loadLecturerClasses(l.id); loadMonitors(l.id); return;
    }
    const student = await AsyncStorage.getItem('current_student');
    if (student) {
      const s = JSON.parse(student); setUserRole('student'); setCurrentUser(s); setCanEdit(false);
      const { data } = await supabase.from('venue_monitors').select('id').eq('student_id', s.id).maybeSingle();
      setCanToggle(!!data); fetchVenues();
    }
  };

  const fetchVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('campus').order('name');
    setVenues(data || []);
  };

  const loadLecturerClasses = async (lid: string) => {
    const { data } = await supabase.from('classes').select('id, class_name, class_code').eq('lecturer_id', lid).order('class_name');
    setLecturerClasses(data || []);
  };

  const loadMonitors = async (lid: string) => {
    const { data: mc } = await supabase.from('classes').select('id').eq('lecturer_id', lid);
    if (!mc?.length) { setMonitors([]); return; }
    const { data: mon } = await supabase.from('venue_monitors').select('id, student_id, class_id, classes(class_name)').in('class_id', mc.map((c: any) => c.id));
    if (!mon?.length) { setMonitors([]); return; }
    const { data: studs } = await supabase.from('students').select('id, name, surname, reg_number').in('id', mon.map((m: any) => m.student_id));
    const sm: any = {}; (studs || []).forEach((s: any) => { sm[s.id] = s; });
    setMonitors(mon.map((m: any) => ({ ...m, student: sm[m.student_id] })));
  };

  const loadClassStudents = async (classId: string) => {
    const { data: enr } = await supabase.from('class_enrollments').select('student_id').eq('class_id', classId);
    if (!enr?.length) { setClassStudents([]); return; }
    const { data: studs } = await supabase.from('students').select('id, name, surname, reg_number').in('id', enr.map((e: any) => e.student_id));
    setClassStudents(studs || []);
  };

  const assignMonitor = async (studentId: string, classId: string) => {
    const existing = monitors.filter((m: any) => m.class_id === classId);
    if (existing.length >= 2) { Alert.alert('Limit Reached', 'Max 2 monitors per class.'); return; }
    if (existing.find((m: any) => m.student_id === studentId)) { Alert.alert('Already Assigned', 'This student is already a monitor'); return; }
    const { error } = await supabase.from('venue_monitors').insert({ student_id: studentId, class_id: classId, assigned_by: currentUser.id });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Assigned!', 'Student can now toggle venue status.'); loadMonitors(currentUser.id);
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
    // Optimistic update immediately
    setVenues(prev => prev.map(v => v.id === venue.id ? { ...v, status: next } : v));
    const { error } = await supabase.from('venues').update({ status: next }).eq('id', venue.id);
    if (error) {
      // Revert on error
      setVenues(prev => prev.map(v => v.id === venue.id ? { ...v, status: venue.status } : v));
      Alert.alert('Error', error.message);
    }
  };

  const handleSave = async () => {
    if (!vName.trim() || !vCampus.trim() || !vCapacity.trim()) { Alert.alert('Missing', 'Fill in all fields'); return; }
    const cap = parseInt(vCapacity.replace(/[^0-9]/g, '')) || 0;
    setLoading(true);
    try {
      if (editingVenue) {
        await supabase.from('venues').update({ name: vName.trim(), campus: vCampus.trim(), capacity: cap, status: vStatus }).eq('id', editingVenue.id);
      } else {
        await supabase.from('venues').insert({ name: vName.trim(), campus: vCampus.trim(), capacity: cap, status: vStatus });
      }
      setShowForm(false); setVName(''); setVCampus(''); setVCapacity(''); setVStatus('available'); setEditingVenue(null);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = (venue: any) => {
    Alert.alert('Delete', `Remove ${venue.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('venues').delete().eq('id', venue.id); } }
    ]);
  };

  // Status colours
  const statusConfig: any = {
    available: { color: '#1D9E75', bg: '#0a3d2e', darkBg: '#0a5a3a', label: 'Available', icon: 'checkmark-circle' },
    occupied:  { color: '#D85A30', bg: '#3d1a0a', darkBg: '#5a2a0a', label: 'Occupied',  icon: 'close-circle' },
    maintenance:{ color: '#D8832A', bg: '#2a1500', darkBg: '#3a2000', label: 'Maintenance', icon: 'construct' },
  };
  const getStatus = (s: string) => statusConfig[s] || statusConfig['occupied'];

  const filtered = venues.filter(v =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.campus?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const stats = {
    total: venues.length,
    free: venues.filter(v => v.status === 'available').length,
    occupied: venues.filter(v => v.status === 'occupied').length,
    maintenance: venues.filter(v => v.status === 'maintenance').length,
  };
  const campuses = [...new Set(filtered.map((v: any) => v.campus).filter(Boolean))].sort();

  const capNum = (v: any) => {
    const n = parseInt(v.capacity);
    return isNaN(n) ? 0 : n;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Venues</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
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
        <View style={[styles.statCard, { borderColor: '#a0c4ff' }]}>
          <Ionicons name="location" size={20} color="#a0c4ff" />
          <Text style={[styles.statNum, { color: '#ffffff' }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#1D9E75', backgroundColor: '#0a3d2e' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#1D9E75" />
          <Text style={[styles.statNum, { color: '#1D9E75' }]}>{stats.free}</Text>
          <Text style={[styles.statLabel, { color: '#1D9E75' }]}>Free</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D85A30', backgroundColor: '#3d1a0a' }]}>
          <Ionicons name="close-circle" size={20} color="#D85A30" />
          <Text style={[styles.statNum, { color: '#D85A30' }]}>{stats.occupied}</Text>
          <Text style={[styles.statLabel, { color: '#D85A30' }]}>Occupied</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D8832A', backgroundColor: '#2a1500' }]}>
          <Ionicons name="construct" size={20} color="#D8832A" />
          <Text style={[styles.statNum, { color: '#D8832A' }]}>{stats.maintenance}</Text>
          <Text style={[styles.statLabel, { color: '#D8832A' }]}>Maint.</Text>
        </View>
      </View>

      {/* Banner */}
      <View style={[styles.banner, { borderColor: canToggle ? '#1D9E75' : '#534AB7', backgroundColor: canToggle ? '#0a3d2e' : '#1a1650' }]}>
        <Ionicons name={canToggle ? 'shield-checkmark' : 'eye-outline'} size={16} color={canToggle ? '#1D9E75' : '#a0c4ff'} />
        <Text style={[styles.bannerText, { color: canToggle ? '#1D9E75' : '#a0c4ff' }]}>
          {userRole === 'admin' ? 'Admin — Full venue management access' :
           userRole === 'lecturer' ? 'Lecturer — Tap venue to toggle status. Tap 👤+ to assign monitors' :
           canToggle ? 'You are a Venue Monitor — Tap any venue card to toggle its status' :
           'View only — Venue status is managed by assigned monitors and staff'}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#a0c4ff" />
        <TextInput style={styles.searchInput} placeholder="Search venues..." placeholderTextColor="#aaa" value={searchQuery} onChangeText={setSearchQuery} />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#a0c4ff" /></TouchableOpacity>
        )}
      </View>

      {/* Monitors list for lecturer */}
      {userRole === 'lecturer' && monitors.length > 0 && (
        <View style={styles.monitorsBox}>
          <Text style={styles.monitorsTitle}>🛡️ Assigned Venue Monitors</Text>
          {monitors.map((m: any) => (
            <View key={m.id} style={styles.monitorRow}>
              <View style={styles.monitorAvatar}>
                <Text style={styles.monitorAvatarText}>{(m.student?.name || '?')[0].toUpperCase()}</Text>
              </View>
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

      {/* Add/Edit form */}
      {showForm && canEdit && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingVenue ? '✏️ Edit Venue' : '➕ Add New Venue'}</Text>
          {[
            { ph: 'Venue Name *', val: vName, set: setVName, kb: 'default' as any },
            { ph: 'Campus / Block *', val: vCampus, set: setVCampus, kb: 'default' as any },
            { ph: 'Capacity (number of seats) *', val: vCapacity, set: setVCapacity, kb: 'numeric' as any },
          ].map((f, i) => (
            <View key={i} style={styles.inputBox}>
              <TextInput style={styles.input} placeholder={f.ph} placeholderTextColor="#666" value={f.val} onChangeText={f.set} keyboardType={f.kb} />
            </View>
          ))}
          <Text style={styles.label}>Initial Status</Text>
          <View style={styles.statusBtnRow}>
            {['available', 'occupied', 'maintenance'].map(s => {
              const cfg = getStatus(s);
              return (
                <TouchableOpacity key={s} style={[styles.statusPickerBtn, vStatus === s && { backgroundColor: cfg.bg, borderColor: cfg.color }]} onPress={() => setVStatus(s)}>
                  <Ionicons name={cfg.icon as any} size={16} color={vStatus === s ? cfg.color : '#a0c4ff'} />
                  <Text style={[styles.statusPickerText, vStatus === s && { color: cfg.color, fontWeight: 'bold' }]}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setEditingVenue(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Ionicons name={editingVenue ? 'checkmark-circle' : 'add-circle'} size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : editingVenue ? 'Update Venue' : 'Add Venue'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Venue list */}
      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="location-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Venues Found</Text>
          <Text style={styles.emptyText}>{canEdit ? 'Tap + to add a venue' : 'No venues available'}</Text>
        </View>
      ) : (
        campuses.map(camp => (
          <View key={camp}>
            <View style={styles.campusHeaderRow}>
              <Ionicons name="business-outline" size={14} color="#FFD700" />
              <Text style={styles.campusHeader}>{camp}</Text>
              <Text style={styles.campusCount}>{filtered.filter(v => v.campus === camp).length} venue{filtered.filter(v => v.campus === camp).length !== 1 ? 's' : ''}</Text>
            </View>
            {filtered.filter(v => v.campus === camp).map((v: any) => {
              const cfg = getStatus(v.status || 'occupied');
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.venueCard, { borderColor: cfg.color, backgroundColor: cfg.bg }]}
                  onPress={() => canToggle ? toggleStatus(v) : null}
                  activeOpacity={canToggle ? 0.75 : 1}
                >
                  <View style={styles.venueCardInner}>
                    {/* Status icon circle */}
                    <View style={[styles.statusCircle, { backgroundColor: cfg.darkBg, borderColor: cfg.color }]}>
                      <Ionicons name={cfg.icon as any} size={26} color={cfg.color} />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.venueName}>{v.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="people-outline" size={13} color="#a0c4ff" />
                          <Text style={styles.venueMeta}>{capNum(v)} seats</Text>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: cfg.color, backgroundColor: cfg.darkBg }]}>
                          <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={{ gap: 8, alignItems: 'flex-end' }}>
                      {canEdit && (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity style={styles.editBtn} onPress={() => { setEditingVenue(v); setVName(v.name); setVCampus(v.campus); setVCapacity(capNum(v).toString()); setVStatus(v.status || 'available'); setShowForm(true); }}>
                            <Ionicons name="pencil" size={15} color="#a0c4ff" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(v)}>
                            <Ionicons name="trash" size={15} color="#D85A30" />
                          </TouchableOpacity>
                        </View>
                      )}
                      {canToggle && !canEdit && (
                        <View style={[styles.toggleIndicator, { borderColor: cfg.color }]}>
                          <Ionicons name="swap-horizontal" size={16} color={cfg.color} />
                          <Text style={[styles.toggleIndicatorText, { color: cfg.color }]}>Tap to toggle</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      )}

      {/* Assign Monitor Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Assign Venue Monitors</Text>
            <Text style={styles.modalSub}>Select a class then choose up to 2 students as monitors</Text>
            {!selectedClass ? (
              <>
                <Text style={styles.modalLabel}>Your Classes:</Text>
                {lecturerClasses.length === 0 ? (
                  <Text style={styles.noClassText}>No classes found. Create classes in Classroom first.</Text>
                ) : (
                  lecturerClasses.map((c: any) => (
                    <TouchableOpacity key={c.id} style={styles.classOption} onPress={() => { setSelectedClass(c); loadClassStudents(c.id); }}>
                      <View style={styles.classOptionIcon}><Ionicons name="school-outline" size={18} color="#1D9E75" /></View>
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
                <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedClass(null); setClassStudents([]); }}>
                  <Ionicons name="arrow-back" size={16} color="#a0c4ff" />
                  <Text style={styles.backBtnText}>Back to classes</Text>
                </TouchableOpacity>
                <Text style={styles.modalLabel}>Students in {selectedClass.class_name}:</Text>
                {classStudents.length === 0 ? (
                  <Text style={styles.noClassText}>No students enrolled in this class yet.</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 300 }}>
                    {classStudents.map((s: any) => {
                      const isM = monitors.some((m: any) => m.student_id === s.id);
                      return (
                        <View key={s.id} style={styles.studentRow}>
                          <View style={styles.studentAvatar}>
                            <Text style={styles.studentAvatarText}>{(s.name || '?')[0].toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentName}>{s.name} {s.surname}</Text>
                            <Text style={styles.studentReg}>{s.reg_number}</Text>
                          </View>
                          {isM ? (
                            <View style={styles.monitorBadge}>
                              <Ionicons name="shield-checkmark" size={14} color="#1D9E75" />
                              <Text style={styles.monitorBadgeText}>Monitor</Text>
                            </View>
                          ) : (
                            <TouchableOpacity style={styles.assignBtn} onPress={() => assignMonitor(s.id, selectedClass.id)}>
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
            <TouchableOpacity style={styles.doneBtn} onPress={() => { setShowAssignModal(false); setSelectedClass(null); setClassStudents([]); }}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001029', paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#0a1a2e', borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center', gap: 3 },
  statNum: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#a0c4ff', fontWeight: '600' },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  bannerText: { fontSize: 12, flex: 1, lineHeight: 17 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 12, padding: 12, marginBottom: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#ffffff' },
  monitorsBox: { backgroundColor: '#0a2a1e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 14, marginBottom: 14 },
  monitorsTitle: { color: '#1D9E75', fontWeight: 'bold', fontSize: 13, marginBottom: 12 },
  monitorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0a3d2e' },
  monitorAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center' },
  monitorAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  monitorName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  monitorSub: { color: '#a0c4ff', fontSize: 12 },
  removeMonitorBtn: { padding: 8, backgroundColor: '#3d1a0a', borderRadius: 10 },
  form: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 16, padding: 16, marginBottom: 14 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  inputBox: { backgroundColor: '#001029', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 10, padding: 13, marginBottom: 10 },
  input: { fontSize: 14, color: '#ffffff' },
  label: { color: '#a0c4ff', fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  statusBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusPickerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#2a3a5a', backgroundColor: '#0a1a2e' },
  statusPickerText: { color: '#a0c4ff', fontSize: 12 },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#2a3a5a', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontWeight: '600' },
  saveBtn: { flex: 2, backgroundColor: '#534AB7', padding: 13, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  campusHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
  campusHeader: { color: '#FFD700', fontWeight: 'bold', fontSize: 14, flex: 1, letterSpacing: 0.5 },
  campusCount: { color: '#7a9cc4', fontSize: 11 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  emptyText: { color: '#a0c4ff', fontSize: 14 },
  venueCard: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5 },
  venueCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  venueName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  venueMeta: { fontSize: 12, color: '#a0c4ff' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  editBtn: { padding: 8, backgroundColor: '#1a2a3a', borderRadius: 10 },
  deleteBtn: { padding: 8, backgroundColor: '#3d1a0a', borderRadius: 10 },
  toggleIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  toggleIndicatorText: { fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#001029', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, maxHeight: '88%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 18 },
  modalLabel: { color: '#a0c4ff', fontWeight: 'bold', fontSize: 13, marginBottom: 10 },
  noClassText: { color: '#7a9cc4', fontStyle: 'italic', marginBottom: 14, fontSize: 14 },
  classOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#2a3a5a', borderRadius: 12, padding: 14, marginBottom: 8 },
  classOptionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0a3d2e', alignItems: 'center', justifyContent: 'center' },
  classOptionName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  classOptionCode: { color: '#FFD700', fontSize: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backBtnText: { color: '#a0c4ff', fontSize: 14 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a1a2e', borderRadius: 10, padding: 12, marginBottom: 8 },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  studentName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  studentReg: { color: '#a0c4ff', fontSize: 12 },
  monitorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0a3d2e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#1D9E75' },
  monitorBadgeText: { color: '#1D9E75', fontSize: 12, fontWeight: 'bold' },
  assignBtn: { backgroundColor: '#1D9E75', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  assignBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  doneBtn: { backgroundColor: '#534AB7', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});