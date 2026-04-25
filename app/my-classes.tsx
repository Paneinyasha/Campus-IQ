import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function MyClasses() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'classes' | 'timetable'>('classes');

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    const saved = await AsyncStorage.getItem('current_student');
    if (saved) {
      const s = JSON.parse(saved);
      setStudent(s);
      loadEnrollments(s.id);
      loadTimetable();
    }
  };

  const loadEnrollments = async (sid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('enrollments')
      .select('*, lecturers(name, surname, department)')
      .eq('student_id', sid)
      .order('enrolled_at', { ascending: false });
    setEnrollments(data || []);
    setLoading(false);
  };

  const loadTimetable = async () => {
    const { data } = await supabase
      .from('timetable')
      .select('*, lecturers(name, surname), venues(name)')
      .order('day', { ascending: true });
    setTimetable(data || []);
  };

  const enroll = async () => {
    if (!courseName.trim()) { Alert.alert('Missing', 'Enter the course name'); return; }
    // Check if course exists in timetable
    const { data: existing } = await supabase
      .from('timetable')
      .select('id, module, lecturer_id')
      .ilike('module', `%${courseName.trim()}%`)
      .limit(1)
      .maybeSingle();

    const lecturerId = existing?.lecturer_id || '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase.from('enrollments').insert({
      student_id: student.id,
      course_name: courseName.trim(),
      lecturer_id: lecturerId,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Already Enrolled', `You are already enrolled in ${courseName}`);
      } else {
        Alert.alert('Error', error.message);
      }
      return;
    }

    Alert.alert('✅ Enrolled!', `You are now enrolled in ${courseName}`);
    setCourseName('');
    setShowEnrollModal(false);
    loadEnrollments(student.id);
  };

  const unenroll = (enrollment: any) => {
    Alert.alert('Leave Course', `Remove yourself from ${enrollment.course_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          await supabase.from('enrollments').delete().eq('id', enrollment.id);
          loadEnrollments(student.id);
        }
      }
    ]);
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = DAYS[new Date().getDay() - 1] || 'Monday';

  const getDayColor = (day: string) => {
    return day === today ? '#1D9E75' : '#534AB7';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Classes</Text>
        <TouchableOpacity onPress={() => setShowEnrollModal(true)}>
          <Ionicons name="add-circle-outline" size={26} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'classes' && styles.tabActive]} onPress={() => setActiveTab('classes')}>
          <Ionicons name="book-outline" size={16} color={activeTab === 'classes' ? '#FFD700' : '#a0c4ff'} />
          <Text style={[styles.tabText, activeTab === 'classes' && styles.tabTextActive]}>My Enrollments ({enrollments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'timetable' && styles.tabActive]} onPress={() => setActiveTab('timetable')}>
          <Ionicons name="calendar-outline" size={16} color={activeTab === 'timetable' ? '#FFD700' : '#a0c4ff'} />
          <Text style={[styles.tabText, activeTab === 'timetable' && styles.tabTextActive]}>All Classes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* MY ENROLLMENTS */}
        {activeTab === 'classes' && (
          <>
            {loading ? (
              <View style={styles.emptyBox}>
                <Ionicons name="hourglass-outline" size={48} color="#534AB7" />
                <Text style={styles.emptyText}>Loading your classes...</Text>
              </View>
            ) : enrollments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="school-outline" size={60} color="#534AB7" />
                <Text style={styles.emptyTitle}>No Classes Yet</Text>
                <Text style={styles.emptyText}>Tap the + button to enroll in your classes</Text>
                <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowEnrollModal(true)}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.enrollBtnText}>Enroll in a Class</Text>
                </TouchableOpacity>
              </View>
            ) : (
              enrollments.map(e => (
                <View key={e.id} style={styles.classCard}>
                  <View style={styles.classCardLeft}>
                    <View style={styles.classIcon}>
                      <Ionicons name="book" size={24} color="#534AB7" />
                    </View>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{e.course_name}</Text>
                      {e.lecturers && (
                        <Text style={styles.classLecturer}>
                          {e.lecturers.name} {e.lecturers.surname} • {e.lecturers.department}
                        </Text>
                      )}
                      <Text style={styles.classDate}>Enrolled: {new Date(e.enrolled_at).toDateString()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => unenroll(e)} style={styles.leaveBtn}>
                    <Ionicons name="exit-outline" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* ALL TIMETABLE */}
        {activeTab === 'timetable' && (
          <>
            {DAYS.map(day => {
              const dayClasses = timetable.filter((t: any) => t.day === day);
              if (dayClasses.length === 0) return null;
              return (
                <View key={day}>
                  <View style={[styles.dayHeader, { borderLeftColor: getDayColor(day) }]}>
                    <Text style={[styles.dayTitle, { color: getDayColor(day) }]}>
                      {day} {day === today ? '• Today' : ''}
                    </Text>
                  </View>
                  {dayClasses.map((t: any) => (
                    <View key={t.id} style={styles.timetableCard}>
                      <View style={styles.timeBox}>
                        <Text style={styles.timeText}>{t.start_time}</Text>
                        <Text style={styles.timeSep}>|</Text>
                        <Text style={styles.timeText}>{t.end_time}</Text>
                      </View>
                      <View style={styles.timetableInfo}>
                        <Text style={styles.timetableModule}>{t.module}</Text>
                        <Text style={styles.timetableProgram}>{t.program}</Text>
                        {t.lecturers && <Text style={styles.timetableLecturer}>{t.lecturers.name} {t.lecturers.surname}</Text>}
                        {t.venues && <Text style={styles.timetableVenue}>📍 {t.venues.name}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
            {timetable.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={60} color="#534AB7" />
                <Text style={styles.emptyTitle}>No Classes Found</Text>
                <Text style={styles.emptyText}>The admin hasn't added classes yet</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Enroll Modal */}
      <Modal visible={showEnrollModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enroll in a Class</Text>
              <TouchableOpacity onPress={() => setShowEnrollModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Enter the exact module/course name as shown in the timetable</Text>
            <View style={styles.inputBox}>
              <Ionicons name="book-outline" size={18} color="#534AB7" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Database Systems"
                placeholderTextColor="#aaa"
                value={courseName}
                onChangeText={setCourseName}
              />
            </View>
            <TouchableOpacity style={styles.enrollConfirmBtn} onPress={enroll}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.enrollConfirmBtnText}>Enroll</Text>
            </TouchableOpacity>

            {/* Show available from timetable */}
            {timetable.length > 0 && (
              <>
                <Text style={styles.modalSub}>Available classes (tap to select):</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {[...new Set(timetable.map((t: any) => t.module))].map((module: any) => (
                    <TouchableOpacity key={module} style={styles.suggestionItem} onPress={() => setCourseName(module)}>
                      <Ionicons name="book-outline" size={16} color="#534AB7" />
                      <Text style={styles.suggestionText}>{module}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
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
  tabText: { color: '#a0c4ff', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  content: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#534AB7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  enrollBtnText: { color: '#fff', fontWeight: 'bold' },
  classCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  classCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  classIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#534AB7' },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  classLecturer: { fontSize: 12, color: '#a0c4ff', marginBottom: 2 },
  classDate: { fontSize: 11, color: '#7a9cc4' },
  leaveBtn: { padding: 8 },
  dayHeader: { borderLeftWidth: 4, paddingLeft: 12, marginBottom: 10, marginTop: 8 },
  dayTitle: { fontSize: 15, fontWeight: 'bold' },
  timetableCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, flexDirection: 'row', gap: 14, marginBottom: 10 },
  timeBox: { alignItems: 'center', minWidth: 50 },
  timeText: { fontSize: 12, fontWeight: 'bold', color: '#FFD700' },
  timeSep: { color: '#534AB7', fontSize: 10 },
  timetableInfo: { flex: 1 },
  timetableModule: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  timetableProgram: { fontSize: 12, color: '#a0c4ff', marginBottom: 2 },
  timetableLecturer: { fontSize: 12, color: '#FFD700', marginBottom: 2 },
  timetableVenue: { fontSize: 12, color: '#7a9cc4' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  modalSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 14 },
  input: { flex: 1, color: '#fff', fontSize: 14 },
  enrollConfirmBtn: { backgroundColor: '#534AB7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  enrollConfirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#001f4d', borderRadius: 10, padding: 12, marginBottom: 8 },
  suggestionText: { color: '#fff', fontSize: 14 },
});
