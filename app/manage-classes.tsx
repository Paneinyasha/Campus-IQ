import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

function generateCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'CLS';
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return prefix + suffix;
}

export default function ManageClasses() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<any>(null);

  useEffect(() => { loadLecturer(); }, []);

  const loadLecturer = async () => {
    const saved = await AsyncStorage.getItem('current_lecturer');
    if (saved) {
      const l = JSON.parse(saved);
      setLecturer(l);
      loadClasses(l.id);
      loadTimetable(l.id);
    }
  };

  const loadClasses = async (lid: string) => {
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, class_code, description, timetable_id, created_at')
      .eq('lecturer_id', lid)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) { setClasses([]); return; }

    const timetableIds = [...new Set(data.map((c: any) => c.timetable_id).filter(Boolean))];
    let timetableMap: any = {};
    if (timetableIds.length > 0) {
      const { data: tt } = await supabase.from('timetable').select('id, module, day, start_time, end_time, venue_id').in('id', timetableIds);
      const venueIds = [...new Set((tt || []).map((t: any) => t.venue_id).filter(Boolean))];
      let venueMap: any = {};
      if (venueIds.length > 0) {
        const { data: venues } = await supabase.from('venues').select('id, name').in('id', venueIds);
        (venues || []).forEach((v: any) => { venueMap[v.id] = v; });
      }
      (tt || []).forEach((t: any) => { timetableMap[t.id] = { ...t, venue: venueMap[t.venue_id] }; });
    }

    const withCounts = await Promise.all(data.map(async (c: any) => {
      const { count } = await supabase.from('class_enrollments').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
      return { ...c, student_count: count || 0, timetable: timetableMap[c.timetable_id] };
    }));
    setClasses(withCounts);
  };

  const loadTimetable = async (lid: string) => {
    const { data } = await supabase.from('timetable').select('id, module, day, start_time, end_time, venue_id').eq('lecturer_id', lid).order('day');
    const venueIds = [...new Set((data || []).map((t: any) => t.venue_id).filter(Boolean))];
    let venueMap: any = {};
    if (venueIds.length > 0) {
      const { data: venues } = await supabase.from('venues').select('id, name').in('id', venueIds);
      (venues || []).forEach((v: any) => { venueMap[v.id] = v; });
    }
    setTimetable((data || []).map((t: any) => ({ ...t, venue: venueMap[t.venue_id] })));
  };

  const loadClassStudents = async (classId: string) => {
    const { data } = await supabase
      .from('class_enrollments')
      .select('id, student_id, enrolled_at')
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: false });
    if (!data || data.length === 0) { setClassStudents([]); return; }
    const studentIds = data.map((e: any) => e.student_id);
    const { data: students } = await supabase.from('students').select('id, name, surname, reg_number, program').in('id', studentIds);
    const studentMap: any = {};
    (students || []).forEach((s: any) => { studentMap[s.id] = s; });
    setClassStudents(data.map((e: any) => ({ ...e, student: studentMap[e.student_id] })));
  };

  const handleSave = async () => {
    if (!className.trim()) { Alert.alert('Missing', 'Please enter a class name'); return; }
    setLoading(true);
    try {
      if (editingClass) {
        const { error } = await supabase.from('classes').update({
          class_name: className.trim(),
          description: description.trim() || null,
          timetable_id: selectedTimetableId || null,
        }).eq('id', editingClass.id);
        if (error) { Alert.alert('Error', error.message); return; }
        Alert.alert('Updated!', 'Class updated successfully.');
      } else {
        const code = generateCode(className);
        const { error } = await supabase.from('classes').insert({
          lecturer_id: lecturer.id,
          class_name: className.trim(),
          class_code: code,
          description: description.trim() || null,
          timetable_id: selectedTimetableId || null,
        });
        if (error) { Alert.alert('Error', error.message); return; }
        Alert.alert('Class Created!', `Class code: ${code}\n\nShare this code with students so they can enroll.`);
      }
      setClassName(''); setDescription(''); setSelectedTimetableId('');
      setShowForm(false); setEditingClass(null);
      loadClasses(lecturer.id);
    } finally { setLoading(false); }
  };

  const startEdit = (c: any) => {
    setEditingClass(c);
    setClassName(c.class_name);
    setDescription(c.description || '');
    setSelectedTimetableId(c.timetable_id || '');
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    await supabase.from('class_enrollments').delete().eq('class_id', classToDelete.id);
    await supabase.from('classes').delete().eq('id', classToDelete.id);
    setShowDeleteModal(false);
    setClassToDelete(null);
    loadClasses(lecturer.id);
    Alert.alert('Deleted', 'Class deleted successfully');
  };

  const openStudents = async (c: any) => {
    setSelectedClass(c);
    await loadClassStudents(c.id);
    setShowStudentsModal(true);
  };

  const removeStudent = async (enrollmentId: string) => {
    Alert.alert('Remove Student', 'Remove this student from the class?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('class_enrollments').delete().eq('id', enrollmentId);
          await loadClassStudents(selectedClass.id);
          loadClasses(lecturer.id);
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Classroom</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(!showForm); setEditingClass(null); setClassName(''); setDescription(''); setSelectedTimetableId(''); }}>
          <Ionicons name={showForm ? 'close' : 'add'} size={26} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color="#1D9E75" />
        <Text style={styles.infoText}>Create classes and share the code with students. Students can also browse and enroll without a code.</Text>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingClass ? 'Edit Class' : 'Create New Class'}</Text>
          <View style={styles.inputBox}>
            <Ionicons name="school-outline" size={20} color="#534AB7" style={{ marginRight: 10 }} />
            <TextInput style={styles.input} placeholder="Class Name e.g. Database Systems 2026" placeholderTextColor="#aaa" value={className} onChangeText={setClassName} />
          </View>
          <TextInput
            style={styles.descInput}
            placeholder="Description (optional) — who this class is for"
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
          <Text style={styles.label}>Link to Timetable Slot (Optional)</Text>
          <Text style={styles.sublabel}>Students will see this in their timetable when enrolled</Text>
          <TouchableOpacity
            style={[styles.selectItem, !selectedTimetableId && { borderColor: '#FFD700', backgroundColor: '#1a1650' }]}
            onPress={() => setSelectedTimetableId('')}
          >
            <Ionicons name={!selectedTimetableId ? 'radio-button-on' : 'radio-button-off'} size={18} color={!selectedTimetableId ? '#FFD700' : '#a0c4ff'} />
            <Text style={[styles.selectText, !selectedTimetableId && { color: '#FFD700' }]}>No timetable link</Text>
          </TouchableOpacity>
          {timetable.map((t: any) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.selectItem, selectedTimetableId === t.id && styles.selectItemActive]}
              onPress={() => setSelectedTimetableId(t.id)}
            >
              <Ionicons name={selectedTimetableId === t.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedTimetableId === t.id ? '#FFD700' : '#a0c4ff'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectText}>{t.module}</Text>
                <Text style={styles.selectSub}>{t.day} • {t.start_time} — {t.end_time} • {t.venue?.name}</Text>
              </View>
              {selectedTimetableId === t.id && <Ionicons name="checkmark-circle" size={18} color="#FFD700" />}
            </TouchableOpacity>
          ))}
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowForm(false); setEditingClass(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSave} disabled={loading}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.saveBtnText}>{loading ? 'Saving...' : editingClass ? 'Update' : 'Create Class'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {classes.length === 0 && !showForm ? (
        <View style={styles.emptyBox}>
          <Ionicons name="school-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Classes Yet</Text>
          <Text style={styles.emptyText}>Tap + to create your first class and get a code to share with students</Text>
        </View>
      ) : (
        classes.map((c: any) => (
          <View key={c.id} style={styles.classCard}>
            <View style={styles.classCardTop}>
              <View style={styles.classInitial}>
                <Text style={styles.classInitialText}>{c.class_name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.className}>{c.class_name}</Text>
                {c.description ? <Text style={styles.classDesc} numberOfLines={1}>{c.description}</Text> : null}
                {c.timetable && <Text style={styles.classTimetable}>{c.timetable.day} • {c.timetable.start_time} — {c.timetable.end_time} • {c.timetable.module}</Text>}
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(c)}>
                  <Ionicons name="pencil-outline" size={18} color="#FFD700" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => { setClassToDelete(c); setShowDeleteModal(true); }}>
                  <Ionicons name="trash-outline" size={18} color="#D85A30" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.classCardBottom}>
              <View style={styles.codeBadge}>
                <Ionicons name="key-outline" size={14} color="#FFD700" />
                <Text style={styles.codeBadgeText}>{c.class_code}</Text>
              </View>
              <TouchableOpacity style={styles.studentCountBtn} onPress={() => openStudents(c)}>
                <Ionicons name="people-outline" size={16} color="#1D9E75" />
                <Text style={styles.studentCountText}>{c.student_count} students</Text>
                <Ionicons name="chevron-forward" size={14} color="#a0c4ff" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Students modal */}
      <Modal visible={showStudentsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.studentsModal}>
            <View style={styles.studentsModalHeader}>
              <View>
                <Text style={styles.studentsModalTitle}>{selectedClass?.class_name}</Text>
                <Text style={styles.studentsModalCount}>{classStudents.length} enrolled students</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStudentsModal(false)}>
                <Ionicons name="close" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.codeDisplay}>
              <Ionicons name="key-outline" size={16} color="#FFD700" />
              <Text style={styles.codeDisplayText}>Code: {selectedClass?.class_code}</Text>
              <Text style={styles.codeDisplayHint}>Share with students</Text>
            </View>
            {classStudents.length === 0 ? (
              <View style={styles.emptyStudents}>
                <Ionicons name="people-outline" size={40} color="#534AB7" />
                <Text style={styles.emptyStudentsText}>No students enrolled yet</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }}>
                {classStudents.map((e: any) => (
                  <View key={e.id} style={styles.studentRow}>
                    <View style={styles.studentAvatar}>
                      <Ionicons name="person" size={20} color="#534AB7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{e.student?.name} {e.student?.surname}</Text>
                      <Text style={styles.studentReg}>{e.student?.reg_number}</Text>
                      <Text style={styles.studentProg}>{e.student?.program}</Text>
                    </View>
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeStudent(e.id)}>
                      <Ionicons name="person-remove-outline" size={18} color="#D85A30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowStudentsModal(false)}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <Ionicons name="warning-outline" size={40} color="#D85A30" />
            <Text style={styles.deleteTitle}>Delete Class?</Text>
            <Text style={styles.deleteSub}>This will delete "{classToDelete?.class_name}" and remove all {classToDelete?.student_count} enrolled students.</Text>
            <View style={styles.formBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#D85A30' }]} onPress={handleDelete}>
                <Text style={styles.saveBtnText}>Delete</Text>
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
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  descInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, fontSize: 15, color: '#ffffff', marginBottom: 14, minHeight: 70 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#a0c4ff', marginBottom: 4 },
  sublabel: { fontSize: 12, color: '#7a9cc4', marginBottom: 10 },
  selectItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, marginBottom: 8 },
  selectItemActive: { backgroundColor: '#1a1650', borderColor: '#FFD700' },
  selectText: { color: '#ffffff', fontSize: 14, flex: 1 },
  selectSub: { color: '#a0c4ff', fontSize: 12, marginTop: 2 },
  formBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontSize: 15, fontWeight: 'bold' },
  saveBtn: { flex: 2, backgroundColor: '#534AB7', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  classCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 14 },
  classCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  classInitial: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#534AB7' },
  classInitialText: { color: '#FFD700', fontSize: 22, fontWeight: 'bold' },
  className: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  classDesc: { fontSize: 12, color: '#a0c4ff', marginBottom: 2 },
  classTimetable: { fontSize: 12, color: '#1D9E75' },
  editBtn: { padding: 6, backgroundColor: '#2a2a0e', borderRadius: 8 },
  deleteBtn: { padding: 6, backgroundColor: '#3d1a0a', borderRadius: 8 },
  classCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1a2a3a', paddingTop: 12 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1650', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700' },
  codeBadgeText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  studentCountBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0a3d2e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#1D9E75' },
  studentCountText: { color: '#1D9E75', fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  studentsModal: { backgroundColor: '#001f4d', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  studentsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  studentsModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  studentsModalCount: { fontSize: 13, color: '#a0c4ff', marginTop: 4 },
  codeDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 12, marginBottom: 16 },
  codeDisplayText: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', flex: 1 },
  codeDisplayHint: { color: '#a0c4ff', fontSize: 11 },
  emptyStudents: { alignItems: 'center', padding: 30, gap: 8 },
  emptyStudentsText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, marginBottom: 8 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#534AB7' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  studentReg: { fontSize: 12, color: '#FFD700', marginTop: 2 },
  studentProg: { fontSize: 11, color: '#a0c4ff', marginTop: 1 },
  removeBtn: { padding: 6, backgroundColor: '#3d1a0a', borderRadius: 8 },
  doneBtn: { backgroundColor: '#534AB7', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  doneBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  deleteModal: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#D85A30', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center' },
  deleteTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginTop: 12, marginBottom: 8 },
  deleteSub: { fontSize: 13, color: '#a0c4ff', textAlign: 'center', marginBottom: 20 },
});