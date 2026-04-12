import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalVenues: 0,
    totalClasses: 0,
    totalAttendance: 0,
    totalNotifications: 0,
    totalMessages: 0,
    totalQuizzes: 0,
    occupiedVenues: 0,
    freeVenues: 0,
    suspendedStudents: 0,
    suspendedLecturers: 0,
  });
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [showAtRisk, setShowAtRisk] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      const students = db.getAllSync(`SELECT * FROM students`);
      const lecturers = db.getAllSync(`SELECT * FROM lecturers`);
      const venues = db.getAllSync(`SELECT * FROM venues`);
      const classes = db.getAllSync(`SELECT * FROM timetable`);
      const attendance = db.getAllSync(`SELECT * FROM attendance WHERE status = 'present'`);
      const notifications = db.getAllSync(`SELECT * FROM notifications`);
      const messages = db.getAllSync(`SELECT * FROM chat_messages`);
      const quizzes = db.getAllSync(`SELECT * FROM lecturer_quizzes`);
      const occupiedVenues = venues.filter((v: any) => v.is_occupied === 1);
      const suspendedStudents = students.filter((s: any) => s.is_suspended === 1);
      const suspendedLecturers = lecturers.filter((l: any) => l.is_suspended === 1);

      setStats({
        totalStudents: students.length,
        totalLecturers: lecturers.length,
        totalVenues: venues.length,
        totalClasses: classes.length,
        totalAttendance: attendance.length,
        totalNotifications: notifications.length,
        totalMessages: messages.length,
        totalQuizzes: quizzes.length,
        occupiedVenues: occupiedVenues.length,
        freeVenues: venues.length - occupiedVenues.length,
        suspendedStudents: suspendedStudents.length,
        suspendedLecturers: suspendedLecturers.length,
      });

      loadAtRiskStudents(students);
    } catch (e) {}
  };

  const loadAtRiskStudents = (students: any[]) => {
    try {
      const atRisk: any[] = [];

      students.forEach((student: any) => {
        const totalClasses = db.getFirstSync(
          `SELECT COUNT(*) as count FROM attendance WHERE student_id = ?`,
          [student.id]
        ) as any;

        const presentClasses = db.getFirstSync(
          `SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'present'`,
          [student.id]
        ) as any;

        const total = totalClasses?.count || 0;
        const present = presentClasses?.count || 0;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        if (total > 0 && percentage < 75) {
          atRisk.push({
            ...student,
            attendancePercentage: percentage,
            present,
            total,
          });
        }
      });

      atRisk.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
      setAtRiskStudents(atRisk);
    } catch (e) {}
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return '#1D9E75';
    if (percentage >= 50) return '#FFD700';
    return '#D85A30';
  };

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
        <View style={[styles.statCard, { borderColor: '#1D9E75' }]}>
          <Ionicons name="people-outline" size={28} color="#1D9E75" />
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#534AB7' }]}>
          <Ionicons name="book-outline" size={28} color="#534AB7" />
          <Text style={styles.statNumber}>{stats.totalLecturers}</Text>
          <Text style={styles.statLabel}>Total Lecturers</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D85A30' }]}>
          <Ionicons name="ban-outline" size={28} color="#D85A30" />
          <Text style={styles.statNumber}>{stats.suspendedStudents}</Text>
          <Text style={styles.statLabel}>Suspended Students</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D85A30' }]}>
          <Ionicons name="ban-outline" size={28} color="#D85A30" />
          <Text style={styles.statNumber}>{stats.suspendedLecturers}</Text>
          <Text style={styles.statLabel}>Suspended Lecturers</Text>
        </View>
      </View>

      {stats.totalStudents > 0 && (
        <View style={styles.percentBox}>
          <Text style={styles.percentLabel}>Suspension Rate</Text>
          <Text style={styles.percentValue}>
            {Math.round(((stats.suspendedStudents + stats.suspendedLecturers) /
              (stats.totalStudents + stats.totalLecturers)) * 100)}%
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Academic</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: '#534AB7' }]}>
          <Ionicons name="calendar-outline" size={28} color="#534AB7" />
          <Text style={styles.statNumber}>{stats.totalClasses}</Text>
          <Text style={styles.statLabel}>Total Classes</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#1D9E75' }]}>
          <Ionicons name="checkmark-circle-outline" size={28} color="#1D9E75" />
          <Text style={styles.statNumber}>{stats.totalAttendance}</Text>
          <Text style={styles.statLabel}>Attendances</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#FFD700' }]}>
          <Ionicons name="clipboard-outline" size={28} color="#FFD700" />
          <Text style={styles.statNumber}>{stats.totalQuizzes}</Text>
          <Text style={styles.statLabel}>Quizzes</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Venues</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: '#a0c4ff' }]}>
          <Ionicons name="business-outline" size={28} color="#a0c4ff" />
          <Text style={styles.statNumber}>{stats.totalVenues}</Text>
          <Text style={styles.statLabel}>Total Venues</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#1D9E75' }]}>
          <Ionicons name="checkmark-circle-outline" size={28} color="#1D9E75" />
          <Text style={styles.statNumber}>{stats.freeVenues}</Text>
          <Text style={styles.statLabel}>Free Venues</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#D85A30' }]}>
          <Ionicons name="lock-closed-outline" size={28} color="#D85A30" />
          <Text style={styles.statNumber}>{stats.occupiedVenues}</Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Communication</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: '#FFD700' }]}>
          <Ionicons name="notifications-outline" size={28} color="#FFD700" />
          <Text style={styles.statNumber}>{stats.totalNotifications}</Text>
          <Text style={styles.statLabel}>Notifications</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#1D9E75' }]}>
          <Ionicons name="chatbubbles-outline" size={28} color="#1D9E75" />
          <Text style={styles.statNumber}>{stats.totalMessages}</Text>
          <Text style={styles.statLabel}>Chat Messages</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.atRiskHeader}
        onPress={() => setShowAtRisk(!showAtRisk)}
      >
        <View style={styles.atRiskLeft}>
          <Ionicons name="warning-outline" size={22} color="#D85A30" />
          <Text style={styles.atRiskTitle}>
            At Risk Students ({atRiskStudents.length})
          </Text>
        </View>
        <Ionicons
          name={showAtRisk ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#a0c4ff"
        />
      </TouchableOpacity>

      {showAtRisk && (
        <>
          <View style={styles.atRiskInfo}>
            <Ionicons name="information-circle-outline" size={16} color="#FFD700" />
            <Text style={styles.atRiskInfoText}>
              Students below 75% attendance are at risk of being barred from exams
            </Text>
          </View>

          {atRiskStudents.length === 0 ? (
            <View style={styles.noRiskBox}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#1D9E75" />
              <Text style={styles.noRiskText}>All students are above 75% attendance!</Text>
            </View>
          ) : (
            atRiskStudents.map((student: any) => (
              <View key={student.id} style={styles.atRiskCard}>
                <View style={styles.atRiskCardLeft}>
                  <View style={[
                    styles.riskDot,
                    { backgroundColor: getAttendanceColor(student.attendancePercentage) }
                  ]} />
                  <View>
                    <Text style={styles.riskName}>
                      {student.name} {student.surname}
                    </Text>
                    <Text style={styles.riskReg}>{student.reg_number}</Text>
                    <Text style={styles.riskProgram}>{student.program}</Text>
                    <Text style={styles.riskAttendance}>
                      {student.present}/{student.total} classes attended
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: getAttendanceColor(student.attendancePercentage) + '22' }
                ]}>
                  <Text style={[
                    styles.riskPercent,
                    { color: getAttendanceColor(student.attendancePercentage) }
                  ]}>
                    {student.attendancePercentage}%
                  </Text>
                  {student.attendancePercentage < 50 && (
                    <Text style={styles.riskLabel}>CRITICAL</Text>
                  )}
                  {student.attendancePercentage >= 50 && student.attendancePercentage < 75 && (
                    <Text style={[styles.riskLabel, { color: '#FFD700' }]}>WARNING</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </>
      )}

      <View style={styles.refreshBox}>
        <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
        <Text style={styles.refreshText}>
          Tap the refresh icon at the top to update stats
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    width: '47%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0c4ff',
    textAlign: 'center',
  },
  percentBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  percentLabel: {
    fontSize: 14,
    color: '#a0c4ff',
  },
  percentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D85A30',
  },
  atRiskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3d1a0a',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  atRiskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  atRiskTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D85A30',
  },
  atRiskInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#2a1500',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  atRiskInfoText: {
    color: '#FFD700',
    fontSize: 12,
    flex: 1,
  },
  noRiskBox: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noRiskText: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: 'bold',
  },
  atRiskCard: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atRiskCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  riskDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  riskReg: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  riskProgram: {
    fontSize: 11,
    color: '#a0c4ff',
    marginTop: 1,
  },
  riskAttendance: {
    fontSize: 11,
    color: '#7a9cc4',
    marginTop: 1,
  },
  riskBadge: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    minWidth: 70,
  },
  riskPercent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  riskLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D85A30',
    marginTop: 2,
  },
  refreshBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  refreshText: {
    color: '#7a9cc4',
    fontSize: 12,
  },
});