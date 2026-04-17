import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllStudents } from '../database/db';

export default function AllStudents() {
  const router = useRouter();
  const [students, setStudents] = useState([]);

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    const result = await getAllStudents();
    if (result.success) setStudents(result.students);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>All Students</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{students.length}</Text>
        </View>
      </View>
      {students.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="person-outline" size={60} color="#1D9E75" />
          <Text style={styles.emptyTitle}>No Students Yet</Text>
          <Text style={styles.emptyText}>Students will appear here once they sign up</Text>
        </View>
      ) : (
        students.map((student: any) => (
          <View key={student.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={24} color="#1D9E75" />
              </View>
              <View>
                <Text style={styles.name}>{student.name} {student.surname}</Text>
                <Text style={styles.regNumber}>{student.reg_number}</Text>
                <Text style={styles.program}>{student.program}</Text>
                <Text style={styles.email}>{student.email}</Text>
                {student.is_suspended === 1 && (
                  <Text style={styles.suspended}>SUSPENDED: {student.suspend_reason}</Text>
                )}
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  countBadge: { backgroundColor: '#1D9E75', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 14 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { backgroundColor: '#0a3d2e', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1D9E75' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  regNumber: { fontSize: 13, color: '#FFD700', marginTop: 2 },
  program: { fontSize: 13, color: '#a0c4ff', marginTop: 2 },
  email: { fontSize: 12, color: '#7a9cc4', marginTop: 2 },
  suspended: { fontSize: 11, color: '#D85A30', marginTop: 2, fontStyle: 'italic' },
});