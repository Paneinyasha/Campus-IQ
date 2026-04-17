import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllLecturers } from '../database/db';

export default function AllLecturers() {
  const router = useRouter();
  const [lecturers, setLecturers] = useState([]);

  useEffect(() => { loadLecturers(); }, []);

  const loadLecturers = async () => {
    const result = await getAllLecturers();
    if (result.success) setLecturers(result.lecturers);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>All Lecturers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-lecturer')}>
          <Ionicons name="person-add-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>
      {lecturers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Lecturers Yet</Text>
          <Text style={styles.emptyText}>Tap the + button above to add your first lecturer</Text>
        </View>
      ) : (
        lecturers.map((lecturer: any) => (
          <View key={lecturer.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={24} color="#534AB7" />
              </View>
              <View>
                <Text style={styles.name}>{lecturer.name} {lecturer.surname}</Text>
                <Text style={styles.department}>{lecturer.department}</Text>
                <Text style={styles.email}>{lecturer.email}</Text>
                {lecturer.is_suspended === 1 && (
                  <Text style={styles.suspended}>SUSPENDED: {lecturer.suspend_reason}</Text>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0c4ff" />
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
  addBtn: { padding: 4 },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { backgroundColor: '#1a1650', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#534AB7' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  department: { fontSize: 13, color: '#a0c4ff', marginTop: 2 },
  email: { fontSize: 12, color: '#7a9cc4', marginTop: 2 },
  suspended: { fontSize: 11, color: '#D85A30', marginTop: 2, fontStyle: 'italic' },
});