import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageTimetable() {
  const router = useRouter();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [module, setModule] = useState('');
  const [program, setProgram] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [clashWarning, setClashWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const [lecturer, setLecturer] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any>(null);
  const [enrollmentCounts, setEnrollmentCounts] = useState<any>({});

  useEffect(() => { loadLecturer(); }, []);

  const loadLecturer = async () => {
    const saved = await AsyncStorage.getItem('current_lecturer');
    if (saved) {
      const l = JSON.parse(saved);
      setLecturer(l);
      loadTimetable(l.id);
      loadVenues();
    }
  };

  const loadTimetable = async (lid: string) => {
    const { data } = await supabase
      .from('timetable')
      .select('*, venues(name, campus)')
      .eq('lecturer_id', lid)
      .order('day');
    setTimetable(data || []);
    loadEnrollmentCounts(data || []);
  };

  const loadEnrollmentCounts = async (classes: any[]) => {
    const counts: any = {};
    for (const c of classes) {
      const { count } = await supabase
        .from('class_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('timetable_id', c.id);
      counts[c.id] = count || 0;
    }
    setEnrollmentCounts(counts);
  };

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('name');
    setVenues(data || []);
  };

  const resetForm = () => {
    setModule(''); setProgram(''); setDay(''); setStartTime('');
    setEndTime(''); setSelectedVenue(''); setClashWarning('');
    setEditingClass(null);
  };

  const checkClash = async (excludeId?: string) => {
    let query = supabase.from('timetable').select('*').eq('day', day).eq('venue_id', selectedVenue);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query;
    if (!data) return false;
    return data.some((t: any) => !(endTime <= t.start_time || startTime >= t.end_time));
  };

  const handleSave = async () => {
    if (!module || !program || !day || !startTime || !endTime || !selectedVenue) {
      Alert.alert('Missing Fields', 'Please fill in all fields'); return;
    }
    setLoading(true);
    try {
      const hasClash = await checkClash(editingClass?.id);
      if (hasClash) { setClashWarning('Warning: This time slot clashes with an existing class at this venue!'); setLoading(false); return; }

      if (editingClass) {
        const { error } = await supabase.from('timetable').update({
          module, program, day,
          start_time: startTime, end_time: endTime,
          venue_id: selectedVenue,
        }).eq('id', editingClass.id);
        if (error) { Alert.alert('Error', error.message); return; }
        Alert.alert('Updated!', 'Class updated. All enrolled students will see the change.');
      } else {
        const { error } = await supabase.from('timetable').insert({
          module, program, day,
          start_time: startTime, end_time: endTime,
          venue_id: selectedVenue,
          lecturer_id: lecturer.id,
          lecturer_id_ref: lecturer.id,
        });
        if (error) { Alert.alert('Error', error.message); return; }
        Alert.alert('Added!', 'Class added to timetable. Students can now enroll.');
      }

      setShowForm(false);
      resetForm();
      loadTimetable(lecturer.id);
    } finally { setLoading(false); }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setModule(classItem.module);
    setProgram(classItem.program);
    setDay(classItem.day);
    setStartTime(classItem.start_time);
    setEndTime(classItem.end_time);
    setSelectedVenue(classItem.venue_id);
    setClashWarning('');
    setShowForm(true);
  };

  const handleDelete = async (classItem: any) => {
    try {
      await supabase.from('class_enrollments').delete().eq('timetable_id', classItem.id);
      await supabase.from('attendance').delete().eq('timetable_id', classItem.id);
      await supabase.from('timetable').delete().eq('id', classItem.id);
      Alert.alert('Deleted', 'Class removed from timetable');
      setShowDeleteModal(false);
      loadTimetable(lecturer.id);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Timetable</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowForm(!showForm); }}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="people-outline" size={16} color="#1D9E75" />
        <Text style={styles.infoText}>Students can enroll in your classes from their My Classes section. Numbers show enrolled students.</Text>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingClass ? 'Edit Class' : 'Add New Class'}</Text>
          {clashWarning !== '' && (
            <View style={styles.clashBox}>
              <Ionicons name="warning" size={18} color="#FFD700" />
              <Text style={styles.clashText}>{clashWarning}</Text>
            </View>
          )}
          <View style={styles.inputBox}>
            <Ionicons name="book-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Module Name e.g. Database Systems" placeholderTextColor="#aaa" value={module} onChangeText={setModule} />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="school-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Program e.g. BSc Computer Science" placeholderTextColor="#aaa" value={program} onChangeText={setProgram} />
          </View>

          <Text style={styles.label}>Select Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            {DAYS.map((d) => (
              <TouchableOpacity key={d} style={[styles.dayBtn, day === d && styles.dayBtnActive]} onPress={() => setDay(d)}>
                <Text style={[styles.dayText, day === d && styles.dayTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.timeRow}>
            <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="time-outline" size={20} color="#534AB7" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Start e.g. 08:00" placeholderTextColor="#aaa" value={startTime} onChangeText={setStartTime} />
            </View>
            <View style={[styles.inputBox, { flex: 1 }]}>
              <Ionicons name="time-outline" size={20} color="#534AB7" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="End e.g. 10:00" placeholderTextColor="#aaa" value={endTime} onChangeText={setEndTime} />
            </View>
          </View>

          <Text style={styles.label}>Select Venue</Text>
          {venues.length === 0 ? <Text style={styles.noDataText}>No venues added yet. Ask admin to add venues.</Text> : (
            venues.map((v: any) => (
              <TouchableOpacity key={v.id} style={[styles.selectItem, selectedVenue === v.id && styles.selectItemActive]} onPress={() => setSelectedVenue(v.id)}>
                <Ionicons name="location-outline" size={18} color="#a0c4ff" />
                <Text style={styles.selectText}>{v.name} — {v.campus} ({v.capacity} seats)</Text>
                {selectedVenue === v.id && <Ionicons name="checkmark-circle" size={18} color="#FFD700" />}
              </TouchableOpacity>
            ))
          )}

          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); resetForm(); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : editingClass ? 'Update Class' : 'Add Class'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {timetable.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Classes Yet</Text>
          <Text style={styles.emptyText}>Tap + to add your first class</Text>
        </View>
      ) : (
        DAYS.map((d) => {
          const dayClasses = timetable.filter((t: any) => t.day === d);
          if (dayClasses.length === 0) return null;
          return (
            <View key={d}>
              <Text style={styles.dayHeader}>{d}</Text>
              {dayClasses.map((t: any) => (
                <View key={t.id} style={styles.classCard}>
                  <View style={styles.timeStrip}>
                    <Text style={styles.timeText}>{t.start_time}</Text>
                    <Text style={styles.timeDash}>—</Text>
                    <Text style={styles.timeText}>{t.end_time}</Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.moduleName}>{t.module}</Text>
                    <Text style={styles.classDetail}>{t.program}</Text>
                    <Text style={styles.classDetail}>{t.venues?.name} — {t.venues?.campus}</Text>
                    <View style={styles.enrolledBadge}>
                      <Ionicons name="people-outline" size={14} color="#1D9E75" />
                      <Text style={styles.enrolledText}>{enrollmentCounts[t.id] || 0} enrolled</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(t)}>
                      <Ionicons name="pencil-outline" size={18} color="#FFD700" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => { setClassToDelete(t); setShowDeleteModal(true); }}>
                      <Ionicons name="trash-outline" size={18} color="#D85A30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}

      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Ionicons name="warning-outline" size={40} color="#D85A30" />
            <Text style={styles.modalTitle}>Delete Class?</Text>
            <Text style={styles.modalSubtitle}>This will remove {classToDelete?.module} from the timetable and unenroll all students from this class.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalBtn} onPress={() => classToDelete && handleDelete(classToDelete)}>
                <Text style={styles.deleteModalBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  addBtn: { padding: 4 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { color: '#1D9E75', fontSize: 12, flex: 1 },
  form: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  clashBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#FFD700', padding: 12, borderRadius: 10, marginBottom: 14, gap: 8 },
  clashText: { color: '#FFD700', fontSize: 13, flex: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#a0c4ff', marginBottom: 10, marginTop: 4 },
  dayScroll: { marginBottom: 14 },
  dayBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7', marginRight: 8, backgroundColor: '#001f4d' },
  dayBtnActive: { backgroundColor: '#534AB7' },
  dayText: { color: '#a0c4ff', fontSize: 14 },
  dayTextActive: { color: '#ffffff', fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', marginBottom: 4 },
  selectItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, marginBottom: 8 },
  selectItemActive: { backgroundColor: '#1a1650', borderColor: '#FFD700' },
  selectText: { color: '#ffffff', fontSize: 14, flex: 1 },
  noDataText: { color: '#a0c4ff', fontSize: 13, marginBottom: 12, fontStyle: 'italic' },
  formBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontSize: 15, fontWeight: 'bold' },
  saveBtn: { flex: 2, backgroundColor: '#534AB7', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  dayHeader: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  classCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
  timeStrip: { alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  timeText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  timeDash: { color: '#a0c4ff', fontSize: 12 },
  classInfo: { flex: 1 },
  moduleName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  classDetail: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  enrolledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  enrolledText: { fontSize: 12, color: '#1D9E75', fontWeight: 'bold' },
  cardActions: { gap: 8 },
  editBtn: { padding: 6, backgroundColor: '#2a2a0e', borderRadius: 8 },
  deleteBtn: { padding: 6, backgroundColor: '#3d1a0a', borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#D85A30', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginTop: 12, marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#a0c4ff', textAlign: 'center', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  cancelModalBtnText: { color: '#a0c4ff', fontSize: 15, fontWeight: 'bold' },
  deleteModalBtn: { flex: 1, backgroundColor: '#D85A30', padding: 14, borderRadius: 12, alignItems: 'center' },
  deleteModalBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
});