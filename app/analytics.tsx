import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../supabase';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalStudents: 0, totalLecturers: 0, totalVenues: 0, totalClasses: 0, totalAttendance: 0, totalNotifications: 0, totalMessages: 0, totalQuizzes: 0, occupiedVenues: 0, freeVenues: 0, suspendedStudents: 0, suspendedLecturers: 0 });
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [showAtRisk, setShowAtRisk] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [students, lecturers, venues, classes, attendance, notifications, messages, quizzes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('lecturers').select('*'),
        supabase.from('venues').select('*'),
        supabase.from('timetable').select('*'),
        supabase.from('attendance').select('*').eq('status', 'present'),
        supabase.from('notifications').select('*'),
        supabase.from('chat_messages').select('*'),
        supabase.from('lecturer_quizzes').select('*'),
      ]);

      const s = students.data || [];
      const l = lecturers.data || [];
      const v = venues.data || [];

      setStats({
        totalStudents: s.length,
        totalLecturers: l.length,
        totalVenues: v.length,
        totalClasses: (classes.data || []).length,
        totalAttendance: (attendance.data || []).length,
        totalNotifications: (notifications.data || []).length,
        totalMessages: (messages.data || []).length,
        totalQuizzes: (quizzes.data || []).length,
        occupiedVenues: v.filter((x: any) => x.is_occupied === 1).length,
        freeVenues: v.filter((x: any) => x.is_occupied === 0).length,
        suspendedStudents: s.filter((x: any) => x.is_suspended === 1).length,
        suspendedLecturers: l.filter((x: any) => x.is_suspended === 1).length,
      });

      loadAtRisk(s);
    } catch (e) {}
  };

  const loadAtRisk = async (students: any[]) => {
    const atRisk: any[] = [];
    for (const student of students) {
      const { data: total } = await supabase.from('attendance').select('*').eq('student_id', student.id);
      const { data: present } = await supabase.from('attendance').select('*').eq('student_id', student.id).eq('status', 'present');
      const t = (total || []).length;
      const p = (present || []).length;
      const pct = t > 0 ? Math.round((p / t) * 100) : 0;
      if (t > 0 && pct < 75) atRisk.push({ ...student, attendancePercentage: pct, present: p, total: t });
    }
    atRisk.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
    setAtRiskStudents(atRisk);
  };

  const getAttendanceColor = (pct: number) => pct >= 75 ? '#1D9E75' : pct >= 50 ? '#FFD700' : '#D85A30';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity onPress={loadStats}>
          <Ionicons name="refresh-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Users</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Students', value: stats.totalStudents, color: '#1D9E75', icon: 'people-outline' },
          { label: 'Total Lecturers', value: stats.totalLecturers, color: '#534AB7', icon: 'book-outline' },
          { label: 'Suspended Students', value: stats.suspendedStudents, color: '#D85A30', icon: 'ban-outline' },
          { label: 'Suspended Lecturers', value: stats.suspendedLecturers, color: '#D85A30', icon: 'ban-outline' },
        ].map((item, i) => (
          <View key={i} style={[styles.statCard, { borderColor: item.color }]}>
            <Ionicons name={item.icon as any} size={28} color={item.color} />
            <Text style={styles.statNumber}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Academic</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Classes', value: stats.totalClasses, color: '#534AB7', icon: 'calendar-outline' },
          { label: 'Attendances', value: stats.totalAttendance, color: '#1D9E75', icon: 'checkmark-circle-outline' },
          { label: 'Quizzes', value: stats.totalQuizzes, color: '#FFD700', icon: 'clipboard-outline' },
        ].map((item, i) => (
          <View key={i} style={[styles.statCard, { borderColor: item.color }]}>
            <Ionicons name={item.icon as any} size={28} color={item.color} />
            <Text style={styles.statNumber}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Venues</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Total Venues', value: stats.totalVenues, color: '#a0c4ff', icon: 'business-outline' },
          { label: 'Free Venues', value: stats.freeVenues, color: '#1D9E75', icon: 'checkmark-circle-outline' },
          { label: 'Occupied', value: stats.occupiedVenues, color: '#D85A30', icon: 'lock-closed-outline' },
        ].map((item, i) => (
          <View key={i} style={[styles.statCard, { borderColor: item.color }]}>
            <Ionicons name={item.icon as any} size={28} color={item.color} />
            <Text style={styles.statNumber}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Communication</Text>
      <View style={styles.statsGrid}>
        {[
          { label: 'Notifications', value: stats.totalNotifications, color: '#FFD700', icon: 'notifications-outline' },
          { label: 'Chat Messages', value: stats.totalMessages, color: '#1D9E75', icon: 'chatbubbles-outline' },
        ].map((item, i) => (
          <View key={i} style={[styles.statCard, { borderColor: item.color }]}>
            <Ionicons name={item.icon as any} size={28} color={item.color} />
            <Text style={styles.statNumber}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.atRiskHeader} onPress={() => setShowAtRisk(!showAtRisk)}>
        <View style={styles.atRiskLeft}>
          <Ionicons name="warning-outline" size={22} color="#D85A30" />
          <Text style={styles.atRiskTitle}>At Risk Students ({atRiskStudents.length})</Text>
        </View>
        <Ionicons name={showAtRisk ? 'chevron-up' : 'chevron-down'} size={20} color="#a0c4ff" />
      </TouchableOpacity>

      {showAtRisk && (
        <>
          <View style={styles.atRiskInfo}>
            <Ionicons name="information-circle-outline" size={16} color="#FFD700" />
            <Text style={styles.atRiskInfoText}>Students below 75% attendance are at risk of being barred from exams</Text>
          </View>
          {atRiskStudents.length === 0 ? (
            <View style={styles.noRiskBox}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#1D9E75" />
              <Text style={styles.noRiskText}>All students are above 75%!</Text>
            </View>
          ) : (
            atRiskStudents.map((student: any) => (
              <View key={student.id} style={styles.atRiskCard}>
                <View style={styles.atRiskCardLeft}>
                  <View style={[styles.riskDot, { backgroundColor: getAttendanceColor(student.attendancePercentage) }]} />
                  <View>
                    <Text style={styles.riskName}>{student.name} {student.surname}</Text>
                    <Text style={styles.riskReg}>{student.reg_number}</Text>
                    <Text style={styles.riskProgram}>{student.program}</Text>
                    <Text style={styles.riskAttendance}>{student.present}/{student.total} classes</Text>
                  </View>
                </View>
                <View style={[styles.riskBadge, { backgroundColor: getAttendanceColor(student.attendancePercentage) + '22' }]}>
                  <Text style={[styles.riskPercent, { color: getAttendanceColor(student.attendancePercentage) }]}>{student.attendancePercentage}%</Text>
                  <Text style={[styles.riskLabel, { color: student.attendancePercentage < 50 ? '#D85A30' : '#FFD700' }]}>{student.attendancePercentage < 50 ? 'CRITICAL' : 'WARNING'}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14, marginTop: 8, letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { backgroundColor: '#0a1a2e', borderWidth: 1, width: '47%', padding: 16, borderRadius: 14, alignItems: 'center', gap: 8 },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 12, color: '#a0c4ff', textAlign: 'center' },
  atRiskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', borderRadius: 12, padding: 14, marginBottom: 8, marginTop: 8 },
  atRiskLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  atRiskTitle: { fontSize: 15, fontWeight: 'bold', color: '#D85A30' },
  atRiskInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#2a1500', borderRadius: 10, padding: 12, marginBottom: 12 },
  atRiskInfoText: { color: '#FFD700', fontSize: 12, flex: 1 },
  noRiskBox: { alignItems: 'center', padding: 20, gap: 8 },
  noRiskText: { color: '#1D9E75', fontSize: 14, fontWeight: 'bold' },
  atRiskCard: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#D85A30', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  atRiskCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  riskDot: { width: 12, height: 12, borderRadius: 6 },
  riskName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  riskReg: { fontSize: 12, color: '#FFD700', marginTop: 2 },
  riskProgram: { fontSize: 11, color: '#a0c4ff', marginTop: 1 },
  riskAttendance: { fontSize: 11, color: '#7a9cc4', marginTop: 1 },
  riskBadge: { alignItems: 'center', padding: 10, borderRadius: 10, minWidth: 70 },
  riskPercent: { fontSize: 20, fontWeight: 'bold' },
  riskLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
});