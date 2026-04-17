import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

export default function ManageTimetable() {
  const router = useRouter();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [module, setModule] = useState('');
  const [program, setProgram] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [clashWarning, setClashWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [t, l, v] = await Promise.all([
      supabase.from('timetable').select('*, lecturers(name, surname), venues(name)').order('day'),
      supabase.from('lecturers').select('*'),
      supabase.from('venues').select('*'),
    ]);
    setTimetable(t.data || []);
    setLecturers(l.data || []);
    setVenues(v.data || []);
  };

  const checkClash = async () => {
    const { data } = await supabase.from('timetable').select('*')
      .eq('day', day)
      .or(`lecturer_id.eq.${selectedLecturer},venue_id.eq.${selectedVenue}`);
    if (!data) return false;
    return data.some((t: any) => !(endTime <= t.start_time || startTime >= t.end_time));
  };

  const handleAdd = async () => {
    if (!module || !program || !day || !startTime || !endTime || !selectedLecturer || !selectedVenue) {
      Alert.alert('Missing Fields', 'Please fill in all fields'); return;
    }
    setLoading(true);
    try {
      const hasClash = await checkClash();
      if (hasClash) { setClashWarning('Warning: This time slot clashes with an existing class!'); return; }
      const { error } = await supabase.from('timetable').insert({
        module, lecturer_id: selectedLecturer, venue_id: selectedVenue,
        day, start_time: startTime, end_time: endTime, program
      });
      if (error) { Alert.alert('Error', error.message); return; }
      Alert.alert('Success', 'Class added to timetable!');
      setModule(''); setProgram(''); setDay(''); setStartTime(''); setEndTime('');
      setSelectedLecturer(''); setSelectedVenue(''); setClashWarning('');
      setShowForm(false);
      loadAll();
    } finally { setLoading(false); }
  };

  const deleteClass = async (id: string) => {
    Alert.alert('Delete Class', 'Remove this class from timetable?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('timetable').delete().eq('id', id); loadAll(); } }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Timetable</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Class</Text>
          {clashWarning !== '' && (
            <View style={styles.clashBox}>
              <Ionicons name="warning" size={18} color="#FFD700" />
              <Text style={styles.clashText}>{clashWarning}</Text>
            </View>
          )}
          <View style={styles.inputBox}>
            <Ionicons name="book-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Module Name" placeholderTextColor="#aaa" value={module} onChangeText={setModule} />
          </View>
          <View style={styles.inputBox}>
            <Ionicons name="school-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Program e.g. BSc Computer Science" placeholderTextColor="#aaa" value={program} onChangeText={setProgram} />
          </View>

          <Text style={styles.label}>Select Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            {days.map((d) => (
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

          <Text style={styles.label}>Select Lecturer</Text>
          {lecturers.length === 0 ? <Text style={styles.noDataText}>No lecturers added yet</Text> : (
            lecturers.map((l: any) => (
              <TouchableOpacity key={l.id} style={[styles.selectItem, selectedLecturer === l.id && styles.selectItemActive]} onPress={() => setSelectedLecturer(l.id)}>
                <Ionicons name="person-outline" size={18} color="#a0c4ff" />
                <Text style={styles.selectText}>{l.name} {l.surname} — {l.department}</Text>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.label}>Select Venue</Text>
          {venues.length === 0 ? <Text style={styles.noDataText}>No venues added yet</Text> : (
            venues.map((v: any) => (
              <TouchableOpacity key={v.id} style={[styles.selectItem, selectedVenue === v.id && styles.selectItemActive]} onPress={() => setSelectedVenue(v.id)}>
                <Ionicons name="location-outline" size={18} color="#a0c4ff" />
                <Text style={styles.selectText}>{v.name} — {v.campus} ({v.capacity} seats)</Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]} onPress={handleAdd} disabled={loading}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.saveBtnText}>{loading ? 'Adding...' : 'Add to Timetable'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {timetable.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Classes Yet</Text>
          <Text style={styles.emptyText}>Tap the + button above to add your first class</Text>
        </View>
      ) : (
        days.map((d) => {
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
                    <Text style={styles.classDetail}>{t.lecturers?.name} {t.lecturers?.surname}</Text>
                    <Text style={styles.classDetail}>{t.venues?.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteClass(t.id)}>
                    <Ionicons name="trash-outline" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  addBtn: { padding: 4 },
  form: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  clashBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#FFD700', padding: 12, borderRadius: 10, marginBottom: 14, gap: 8 },
  clashText: { color: '#FFD700', fontSize: 13, flex: 1 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#a0c4ff', marginBottom: 10, marginTop: 4 },
  dayScroll: { marginBottom: 14 },
  dayBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#534AB7', marginRight: 8, backgroundColor: '#1a1a2e' },
  dayBtnActive: { backgroundColor: '#534AB7' },
  dayText: { color: '#a0c4ff', fontSize: 14 },
  dayTextActive: { color: '#ffffff', fontWeight: 'bold' },
  timeRow: { flexDirection: 'row', marginBottom: 4 },
  selectItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, marginBottom: 8 },
  selectItemActive: { backgroundColor: '#534AB7', borderColor: '#7F77DD' },
  selectText: { color: '#ffffff', fontSize: 14, flex: 1 },
  noDataText: { color: '#a0c4ff', fontSize: 13, marginBottom: 12, fontStyle: 'italic' },
  saveBtn: { backgroundColor: '#534AB7', padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  dayHeader: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  classCard: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 14, alignItems: 'center' },
  timeStrip: { alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  timeText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  timeDash: { color: '#a0c4ff', fontSize: 12 },
  classInfo: { flex: 1 },
  moduleName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  classDetail: { fontSize: 13, color: '#a0c4ff', marginTop: 2 },
});