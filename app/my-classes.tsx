import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyClasses() {
  const router = useRouter();
  const [tab, setTab] = useState('timetable');
  const [student, setStudent] = useState<any>(null);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinCodeModal, setJoinCodeModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classDetailModal, setClassDetailModal] = useState(false);

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    const saved = await AsyncStorage.getItem('current_student');
    if (saved) {
      const s = JSON.parse(saved);
      setStudent(s);
      await loadMyEnrollments(s.id);
      await loadAllClasses(s.id);
    }
  };

  const loadMyEnrollments = async (sid: string) => {
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('id, class_id, enrolled_at')
        .eq('student_id', sid);

      if (error) { console.log('Enrollment error:', error); return; }
      if (!data || data.length === 0) { setMyEnrollments([]); setEnrolledClassIds(new Set()); return; }

      const classIds = data.map((e: any) => e.class_id);
      setEnrolledClassIds(new Set(classIds));

      const { data: classData } = await supabase
        .from('classes')
        .select('id, class_name, class_code, description, lecturer_id, timetable_id')
        .in('id', classIds);

      const lecturerIds = [...new Set((classData || []).map((c: any) => c.lecturer_id).filter(Boolean))];
      const timetableIds = [...new Set((classData || []).map((c: any) => c.timetable_id).filter(Boolean))];

      let lecturerMap: any = {};
      if (lecturerIds.length > 0) {
        const { data: lecturers } = await supabase.from('lecturers').select('id, name, surname, department').in('id', lecturerIds);
        (lecturers || []).forEach((l: any) => { lecturerMap[l.id] = l; });
      }

      let timetableMap: any = {};
      if (timetableIds.length > 0) {
        const { data: timetables } = await supabase.from('timetable').select('id, module, day, start_time, end_time, venue_id').in('id', timetableIds);
        const venueIds = [...new Set((timetables || []).map((t: any) => t.venue_id).filter(Boolean))];
        let venueMap: any = {};
        if (venueIds.length > 0) {
          const { data: venues } = await supabase.from('venues').select('id, name, campus').in('id', venueIds);
          (venues || []).forEach((v: any) => { venueMap[v.id] = v; });
        }
        (timetables || []).forEach((t: any) => { timetableMap[t.id] = { ...t, venue: venueMap[t.venue_id] }; });
      }

      const enriched = data.map((e: any) => {
        const cls = (classData || []).find((c: any) => c.id === e.class_id);
        if (!cls) return null;
        return {
          ...e,
          class_name: cls.class_name,
          class_code: cls.class_code,
          description: cls.description,
          lecturer: lecturerMap[cls.lecturer_id],
          timetable: timetableMap[cls.timetable_id],
        };
      }).filter(Boolean);

      setMyEnrollments(enriched);
    } catch (e) { console.log('loadMyEnrollments error:', e); }
  };

  const loadAllClasses = async (sid: string) => {
    try {
      const { data: classData } = await supabase
        .from('classes')
        .select('id, class_name, class_code, description, lecturer_id, timetable_id, created_at')
        .order('created_at', { ascending: false });

      if (!classData || classData.length === 0) { setAllClasses([]); return; }

      const lecturerIds = [...new Set(classData.map((c: any) => c.lecturer_id).filter(Boolean))];
      const timetableIds = [...new Set(classData.map((c: any) => c.timetable_id).filter(Boolean))];

      let lecturerMap: any = {};
      if (lecturerIds.length > 0) {
        const { data: lecturers } = await supabase.from('lecturers').select('id, name, surname, department').in('id', lecturerIds);
        (lecturers || []).forEach((l: any) => { lecturerMap[l.id] = l; });
      }

      let timetableMap: any = {};
      if (timetableIds.length > 0) {
        const { data: timetables } = await supabase.from('timetable').select('id, module, day, start_time, end_time, venue_id').in('id', timetableIds);
        const venueIds = [...new Set((timetables || []).map((t: any) => t.venue_id).filter(Boolean))];
        let venueMap: any = {};
        if (venueIds.length > 0) {
          const { data: venues } = await supabase.from('venues').select('id, name, campus').in('id', venueIds);
          (venues || []).forEach((v: any) => { venueMap[v.id] = v; });
        }
        (timetables || []).forEach((t: any) => { timetableMap[t.id] = { ...t, venue: venueMap[t.venue_id] }; });
      }

      const { data: enrollments } = await supabase.from('class_enrollments').select('class_id').eq('student_id', sid);
      const myIds = new Set((enrollments || []).map((e: any) => e.class_id));
      setEnrolledClassIds(myIds);

      const enriched = classData.map((c: any) => ({
        ...c,
        lecturer: lecturerMap[c.lecturer_id],
        timetable: timetableMap[c.timetable_id],
        isEnrolled: myIds.has(c.id),
      }));

      setAllClasses(enriched);
    } catch (e) { console.log('loadAllClasses error:', e); }
  };

  const enroll = async (classId: string) => {
    if (!student) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('class_enrollments').insert({
        class_id: classId,
        student_id: student.id,
      });
      if (error && error.code === '23505') { Alert.alert('Already Enrolled', 'You are already in this class'); return; }
      if (error) { Alert.alert('Error', error.message); return; }
      Alert.alert('Enrolled!', 'Class added to your timetable.');
      setClassDetailModal(false);
      await loadMyEnrollments(student.id);
      await loadAllClasses(student.id);
    } finally { setLoading(false); }
  };

  const unenroll = async (classId: string) => {
    Alert.alert('Leave Class', 'Remove this class from your timetable?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          await supabase.from('class_enrollments').delete().eq('student_id', student.id).eq('class_id', classId);
          setClassDetailModal(false);
          await loadMyEnrollments(student.id);
          await loadAllClasses(student.id);
        }
      }
    ]);
  };

  const joinByCode = async () => {
    if (!joinCode.trim()) { Alert.alert('Enter Code', 'Please enter a class code'); return; }
    setLoading(true);
    try {
      const { data: classFound } = await supabase
        .from('classes')
        .select('*')
        .eq('class_code', joinCode.trim().toUpperCase())
        .single();
      if (!classFound) { Alert.alert('Not Found', 'No class found with that code. Check the code and try again.'); return; }
      await enroll(classFound.id);
      setJoinCode('');
      setJoinCodeModal(false);
    } finally { setLoading(false); }
  };

  const myTimetable = myEnrollments
    .filter((e: any) => e.timetable)
    .sort((a: any, b: any) => {
      const ai = DAYS.indexOf(a.timetable?.day);
      const bi = DAYS.indexOf(b.timetable?.day);
      if (ai !== bi) return ai - bi;
      return (a.timetable?.start_time || '').localeCompare(b.timetable?.start_time || '');
    });

  const filteredClasses = allClasses.filter((c: any) =>
    c.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lecturer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lecturer?.surname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lecturer?.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.class_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.timetable?.module?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Classes</Text>
        <TouchableOpacity style={styles.codeBtn} onPress={() => setJoinCodeModal(true)}>
          <Ionicons name="add-circle-outline" size={28} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'timetable' && styles.tabActive]} onPress={() => setTab('timetable')}>
          <Ionicons name="calendar-outline" size={15} color={tab === 'timetable' ? '#ffffff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'timetable' && styles.tabTextActive]}>Timetable</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'enrolled' && styles.tabActive]} onPress={() => setTab('enrolled')}>
          <Ionicons name="school-outline" size={15} color={tab === 'enrolled' ? '#ffffff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'enrolled' && styles.tabTextActive]}>Enrolled ({myEnrollments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'browse' && styles.tabActive]} onPress={() => setTab('browse')}>
          <Ionicons name="search-outline" size={15} color={tab === 'browse' ? '#ffffff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'browse' && styles.tabTextActive]}>All Classes</Text>
        </TouchableOpacity>
      </View>

      {tab === 'timetable' && (
        <>
          {myTimetable.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Timetable Yet</Text>
              <Text style={styles.emptyText}>Enroll in classes to build your timetable. Tap All Classes to browse or tap + to join with a code.</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => setTab('browse')}>
                <Text style={styles.browseBtnText}>Browse All Classes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            DAYS.map((d) => {
              const dayClasses = myTimetable.filter((e: any) => e.timetable?.day === d);
              if (dayClasses.length === 0) return null;
              return (
                <View key={d}>
                  <Text style={styles.dayHeader}>{d}</Text>
                  {dayClasses.map((e: any) => (
                    <View key={e.id} style={styles.timetableCard}>
                      <View style={styles.timeStrip}>
                        <Text style={styles.timeText}>{e.timetable?.start_time}</Text>
                        <Text style={styles.timeDash}>—</Text>
                        <Text style={styles.timeText}>{e.timetable?.end_time}</Text>
                      </View>
                      <View style={styles.classInfo}>
                        <Text style={styles.moduleName}>{e.class_name}</Text>
                        <Text style={styles.classDetail}>{e.timetable?.module}</Text>
                        <Text style={styles.classDetail}>{e.lecturer?.name} {e.lecturer?.surname}</Text>
                        <Text style={styles.classDetail}>{e.timetable?.venue?.name} — {e.timetable?.venue?.campus}</Text>
                      </View>
                      <TouchableOpacity style={styles.leaveBtn} onPress={() => unenroll(e.class_id)}>
                        <Ionicons name="exit-outline" size={18} color="#D85A30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </>
      )}

      {tab === 'enrolled' && (
        <>
          {myEnrollments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="school-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Enrollments</Text>
              <Text style={styles.emptyText}>Browse classes below or use a class code to enroll</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => setTab('browse')}>
                <Text style={styles.browseBtnText}>Browse All Classes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myEnrollments.map((e: any) => (
              <View key={e.id} style={styles.enrolledCard}>
                <View style={styles.enrolledCardTop}>
                  <View style={styles.classInitialBox}>
                    <Text style={styles.classInitial}>{e.class_name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enrolledName}>{e.class_name}</Text>
                    <Text style={styles.enrolledLecturer}>{e.lecturer?.name} {e.lecturer?.surname}</Text>
                    <Text style={styles.enrolledDept}>{e.lecturer?.department}</Text>
                    {e.timetable && (
                      <Text style={styles.enrolledTime}>{e.timetable.day} • {e.timetable.start_time} — {e.timetable.end_time}</Text>
                    )}
                    <View style={styles.codeRow}>
                      <Ionicons name="key-outline" size={12} color="#FFD700" />
                      <Text style={styles.codeText}>{e.class_code}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.leaveBtn} onPress={() => unenroll(e.class_id)}>
                    <Ionicons name="exit-outline" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
                {e.description ? <Text style={styles.enrolledDesc}>{e.description}</Text> : null}
              </View>
            ))
          )}
        </>
      )}

      {tab === 'browse' && (
        <>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#a0c4ff" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by class, lecturer, module or code..."
              placeholderTextColor="#aaa"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#a0c4ff" />
              </TouchableOpacity>
            )}
          </View>

          {allClasses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="school-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Classes Available</Text>
              <Text style={styles.emptyText}>Lecturers have not created any classes yet. Check back later or ask your lecturer for a class code.</Text>
            </View>
          ) : filteredClasses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Results</Text>
              <Text style={styles.emptyText}>No classes match your search</Text>
            </View>
          ) : (
            filteredClasses.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.browseCard, c.isEnrolled && styles.enrolledBrowseCard]}
                onPress={() => { setSelectedClass(c); setClassDetailModal(true); }}
              >
                <View style={styles.browseCardLeft}>
                  <View style={[styles.classInitialBox, { backgroundColor: c.isEnrolled ? '#0a3d2e' : '#1a1650', borderColor: c.isEnrolled ? '#1D9E75' : '#534AB7' }]}>
                    <Text style={styles.classInitial}>{c.class_name?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.browseName}>{c.class_name}</Text>
                    {c.timetable && <Text style={styles.browseModule}>{c.timetable.module}</Text>}
                    <Text style={styles.browseLecturer}>{c.lecturer?.name} {c.lecturer?.surname} • {c.lecturer?.department}</Text>
                    {c.timetable && (
                      <Text style={styles.browseTime}>{c.timetable.day} • {c.timetable.start_time} — {c.timetable.end_time}</Text>
                    )}
                    <View style={styles.codeRow}>
                      <Ionicons name="key-outline" size={12} color="#FFD700" />
                      <Text style={styles.codeText}>{c.class_code}</Text>
                    </View>
                  </View>
                </View>
                {c.isEnrolled ? (
                  <View style={styles.enrolledPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#1D9E75" />
                    <Text style={styles.enrolledPillText}>Enrolled</Text>
                  </View>
                ) : (
                  <View style={styles.joinPill}>
                    <Text style={styles.joinPillText}>Join</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      {/* Join by code modal */}
      <Modal visible={joinCodeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Join with Class Code</Text>
            <Text style={styles.modalSub}>Enter the code from your lecturer</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. DAT101"
              placeholderTextColor="#534AB7"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={10}
              textAlign="center"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => { setJoinCodeModal(false); setJoinCode(''); }}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.joinModalBtn, loading && { opacity: 0.6 }]} onPress={joinByCode} disabled={loading}>
                <Text style={styles.joinModalBtnText}>{loading ? 'Joining...' : 'Join Class'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Class detail modal */}
      <Modal visible={classDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {selectedClass && (
            <View style={styles.detailModalBox}>
              <View style={styles.detailHeader}>
                <View style={styles.detailInitialBox}>
                  <Text style={styles.detailInitial}>{selectedClass.class_name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{selectedClass.class_name}</Text>
                  <Text style={styles.detailLecturer}>{selectedClass.lecturer?.name} {selectedClass.lecturer?.surname}</Text>
                  <Text style={styles.detailDept}>{selectedClass.lecturer?.department}</Text>
                </View>
              </View>
              {selectedClass.description ? <Text style={styles.detailDesc}>{selectedClass.description}</Text> : null}
              {selectedClass.timetable && (
                <>
                  <View style={styles.detailRow}>
                    <Ionicons name="book-outline" size={16} color="#FFD700" />
                    <Text style={styles.detailRowText}>{selectedClass.timetable.module}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#FFD700" />
                    <Text style={styles.detailRowText}>{selectedClass.timetable.day} • {selectedClass.timetable.start_time} — {selectedClass.timetable.end_time}</Text>
                  </View>
                  {selectedClass.timetable.venue && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={16} color="#FFD700" />
                      <Text style={styles.detailRowText}>{selectedClass.timetable.venue.name} — {selectedClass.timetable.venue.campus}</Text>
                    </View>
                  )}
                </>
              )}
              <View style={styles.detailRow}>
                <Ionicons name="key-outline" size={16} color="#FFD700" />
                <Text style={styles.detailRowText}>Class Code: {selectedClass.class_code}</Text>
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setClassDetailModal(false)}>
                  <Text style={styles.cancelModalBtnText}>Close</Text>
                </TouchableOpacity>
                {enrolledClassIds.has(selectedClass.id) ? (
                  <TouchableOpacity style={styles.leaveModalBtn} onPress={() => unenroll(selectedClass.id)}>
                    <Text style={styles.leaveModalBtnText}>Leave Class</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.joinModalBtn, loading && { opacity: 0.6 }]} onPress={() => enroll(selectedClass.id)} disabled={loading}>
                    <Text style={styles.joinModalBtnText}>{loading ? 'Joining...' : 'Enroll Now'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', flex: 1, textAlign: 'center' },
  codeBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#0a2a4a' },
  tabActive: { backgroundColor: '#534AB7' },
  tabText: { color: '#a0c4ff', fontSize: 11 },
  tabTextActive: { color: '#ffffff', fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', lineHeight: 22 },
  browseBtn: { backgroundColor: '#534AB7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  browseBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  dayHeader: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  timetableCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
  timeStrip: { alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  timeText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
  timeDash: { color: '#a0c4ff', fontSize: 11 },
  classInfo: { flex: 1 },
  moduleName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 3 },
  classDetail: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  leaveBtn: { padding: 8, backgroundColor: '#3d1a0a', borderRadius: 8 },
  enrolledCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 12 },
  enrolledCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  classInitialBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: '#1a1650', borderColor: '#534AB7' },
  classInitial: { color: '#FFD700', fontSize: 20, fontWeight: 'bold' },
  enrolledName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  enrolledLecturer: { fontSize: 12, color: '#a0c4ff', marginBottom: 2 },
  enrolledDept: { fontSize: 11, color: '#7a9cc4', marginBottom: 2 },
  enrolledTime: { fontSize: 12, color: '#1D9E75', marginBottom: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  codeText: { fontSize: 11, color: '#FFD700', fontWeight: 'bold' },
  enrolledDesc: { fontSize: 13, color: '#a0c4ff', marginTop: 10, fontStyle: 'italic' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, marginBottom: 16, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#ffffff' },
  browseCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  enrolledBrowseCard: { borderColor: '#1D9E75', backgroundColor: '#0a3d2e' },
  browseCardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  browseName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 2 },
  browseModule: { fontSize: 12, color: '#FFD700', marginBottom: 2 },
  browseLecturer: { fontSize: 12, color: '#a0c4ff', marginBottom: 2 },
  browseTime: { fontSize: 12, color: '#1D9E75', marginBottom: 2 },
  enrolledPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0a3d2e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#1D9E75' },
  enrolledPillText: { color: '#1D9E75', fontSize: 11, fontWeight: 'bold' },
  joinPill: { backgroundColor: '#534AB7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  joinPillText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#001f4d', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 20 },
  codeInput: { backgroundColor: '#0a2a4a', borderWidth: 2, borderColor: '#534AB7', borderRadius: 14, padding: 20, fontSize: 28, fontWeight: 'bold', color: '#FFD700', letterSpacing: 8, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelModalBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', alignItems: 'center' },
  cancelModalBtnText: { color: '#a0c4ff', fontSize: 15, fontWeight: 'bold' },
  joinModalBtn: { flex: 1, backgroundColor: '#1D9E75', padding: 14, borderRadius: 12, alignItems: 'center' },
  joinModalBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  leaveModalBtn: { flex: 1, backgroundColor: '#D85A30', padding: 14, borderRadius: 12, alignItems: 'center' },
  leaveModalBtnText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  detailModalBox: { backgroundColor: '#001f4d', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  detailInitialBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#534AB7' },
  detailInitial: { color: '#FFD700', fontSize: 26, fontWeight: 'bold' },
  detailTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  detailLecturer: { fontSize: 13, color: '#a0c4ff' },
  detailDept: { fontSize: 12, color: '#7a9cc4' },
  detailDesc: { fontSize: 14, color: '#a0c4ff', marginBottom: 14, fontStyle: 'italic', lineHeight: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  detailRowText: { color: '#ffffff', fontSize: 14, flex: 1 },
});