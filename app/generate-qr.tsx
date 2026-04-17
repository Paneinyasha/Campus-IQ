import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../supabase';

export default function GenerateQR() {
  const router = useRouter();
  const [mode, setMode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [bleCode, setBleCode] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => { loadTimetable(); }, []);

  useEffect(() => {
    if (isActive && sessionId) {
      const interval = setInterval(loadAttendees, 5000);
      return () => clearInterval(interval);
    }
  }, [isActive, sessionId]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); endSessionAuto(); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [isActive, timeLeft]);

  const loadTimetable = async () => {
    const { data } = await supabase.from('timetable').select('*, lecturers(name, surname), venues(name)');
    setTimetable(data || []);
  };

  const loadAttendees = async () => {
    if (!sessionId) return;
    const today = new Date().toISOString().split('T')[0];
    const { data: present } = await supabase.from('attendance').select('*, students(name, surname, reg_number)').eq('timetable_id', sessionId).eq('date', today).eq('status', 'present');
    const { data: absent } = await supabase.from('attendance').select('*, students(name, surname, reg_number)').eq('timetable_id', sessionId).eq('date', today).eq('status', 'absent');
    setAttendees(present || []);
    setAbsentees(absent || []);
  };

  const initializeAttendance = async (classId: string) => {
    const { data: students } = await supabase.from('students').select('id');
    const today = new Date().toISOString().split('T')[0];
    for (const student of students || []) {
      await supabase.from('attendance').upsert({ student_id: student.id, timetable_id: classId, date: today, status: 'absent' }, { onConflict: 'student_id,timetable_id,date' });
    }
  };

  const startQRSession = async (classItem: any) => {
    const code = `CAMPUSIQ_${classItem.id}_${Date.now()}`;
    setSessionCode(code);
    setSessionId(classItem.id);
    setSelectedClass(classItem);
    setIsActive(true);
    setMode('qr');
    setSessionExpired(false);
    setTimeLeft(3600);
    await initializeAttendance(classItem.id);
    loadAttendees();
  };

  const startBLESession = async (classItem: any) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setBleCode(code);
    setSessionId(classItem.id);
    setSelectedClass(classItem);
    setIsActive(true);
    setMode('ble');
    setSessionExpired(false);
    setTimeLeft(3600);
    await initializeAttendance(classItem.id);
    loadAttendees();
  };

  const endSessionAuto = () => {
    clearInterval(timerRef.current);
    setIsActive(false);
    setSessionExpired(true);
    loadAttendees();
    Alert.alert('Session Ended', 'Attendance session has ended. Students who did not confirm are marked absent.');
  };

  const endSession = () => {
    Alert.alert('End Session', 'Students who have not confirmed will be marked absent.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Session', style: 'destructive', onPress: () => { clearInterval(timerRef.current); setIsActive(false); setSessionExpired(true); loadAttendees(); } }
    ]);
  };

  const downloadReport = async () => {
    const html = `
      <html><head><style>body{font-family:Arial;padding:20px}h1{color:#003366}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#003366;color:white;padding:10px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}.summary{background:#f5f5f5;padding:15px;border-radius:8px;margin:20px 0}</style></head>
      <body>
        <h1>Campus IQ — Attendance Report</h1>
        <h3>${selectedClass?.module} — ${selectedClass?.program}</h3>
        <p>Date: ${new Date().toDateString()}</p>
        <div class="summary"><strong>Summary</strong><br/>Present: ${attendees.length}<br/>Absent: ${absentees.length}<br/>Rate: ${attendees.length + absentees.length > 0 ? Math.round((attendees.length / (attendees.length + absentees.length)) * 100) : 0}%</div>
        <table><tr><th>Reg Number</th><th>Full Name</th><th>Status</th></tr>
        ${attendees.map((a: any) => `<tr style="background:#e8f5e9"><td>${a.students?.reg_number}</td><td>${a.students?.name} ${a.students?.surname}</td><td style="color:green">Present</td></tr>`).join('')}
        ${absentees.map((a: any) => `<tr style="background:#ffebee"><td>${a.students?.reg_number}</td><td>${a.students?.name} ${a.students?.surname}</td><td style="color:red">Absent</td></tr>`).join('')}
        </table></body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Download Attendance Report' });
    } catch (e) { Alert.alert('Error', 'Could not generate report'); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Take Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      {!isActive && !sessionExpired && (
        <>
          <Text style={styles.sectionTitle}>Select a Class</Text>
          {timetable.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={50} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Classes Found</Text>
              <Text style={styles.emptyText}>Add classes to the timetable first</Text>
            </View>
          ) : (
            timetable.map((t: any) => (
              <View key={t.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                  <Text style={styles.moduleName}>{t.module}</Text>
                  <Text style={styles.classDetail}>{t.program}</Text>
                  <Text style={styles.classDetail}>{t.day} {t.start_time} — {t.end_time}</Text>
                  <Text style={styles.classDetail}>{t.venues?.name}</Text>
                </View>
                <View style={styles.btnGroup}>
                  <TouchableOpacity style={styles.qrBtn} onPress={() => startQRSession(t)}>
                    <Ionicons name="qr-code-outline" size={20} color="#ffffff" />
                    <Text style={styles.btnText}>QR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bleBtn} onPress={() => startBLESession(t)}>
                    <Ionicons name="bluetooth-outline" size={20} color="#ffffff" />
                    <Text style={styles.btnText}>BLE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {isActive && (
        <View style={styles.sessionBox}>
          <Text style={styles.sessionTitle}>{mode === 'qr' ? 'QR' : 'Bluetooth'} Attendance Active</Text>
          <Text style={styles.sessionSub}>{selectedClass?.module}</Text>
          <View style={styles.timerRow}>
            <Ionicons name="time-outline" size={18} color="#FFD700" />
            <Text style={styles.timerText}>Session ends in: {formatTime(timeLeft)}</Text>
          </View>
          {mode === 'qr' && (
            <View style={styles.qrBox}>
              <QRCode value={sessionCode} size={220} color="#003366" backgroundColor="#ffffff" />
            </View>
          )}
          {mode === 'ble' && (
            <View style={styles.bleCodeBox}>
              <Ionicons name="bluetooth" size={40} color="#534AB7" />
              <Text style={styles.bleCodeText}>{bleCode}</Text>
              <Text style={styles.bleCodeSub}>Students must enter this code and tap Confirm Present</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statBox}><Text style={styles.statNum}>{attendees.length}</Text><Text style={styles.statLbl}>Present</Text></View>
            <View style={styles.statBox}><Text style={[styles.statNum, { color: '#D85A30' }]}>{absentees.length}</Text><Text style={styles.statLbl}>Absent</Text></View>
            <View style={styles.statBox}><Text style={[styles.statNum, { color: '#FFD700' }]}>{attendees.length + absentees.length > 0 ? Math.round((attendees.length / (attendees.length + absentees.length)) * 100) : 0}%</Text><Text style={styles.statLbl}>Rate</Text></View>
          </View>
          <TouchableOpacity style={styles.endBtn} onPress={endSession}>
            <Ionicons name="stop-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.endBtnText}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {sessionExpired && (attendees.length > 0 || absentees.length > 0) && (
        <>
          <View style={styles.reportHeader}>
            <Text style={styles.sectionTitle}>Attendance Register</Text>
            <TouchableOpacity style={styles.downloadBtn} onPress={downloadReport}>
              <Ionicons name="download-outline" size={20} color="#FFD700" />
              <Text style={styles.downloadText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
          {attendees.map((a: any) => (
            <View key={a.id} style={styles.attendeeCard}>
              <View style={styles.attendeeLeft}>
                <View style={styles.presentDot} />
                <View>
                  <Text style={styles.attendeeName}>{a.students?.name} {a.students?.surname}</Text>
                  <Text style={styles.attendeeReg}>{a.students?.reg_number}</Text>
                </View>
              </View>
              <Text style={styles.presentLabel}>Present</Text>
            </View>
          ))}
          {absentees.map((a: any) => (
            <View key={a.id} style={styles.absentCard}>
              <View style={styles.attendeeLeft}>
                <View style={styles.absentDot} />
                <View>
                  <Text style={styles.attendeeName}>{a.students?.name} {a.students?.surname}</Text>
                  <Text style={styles.attendeeReg}>{a.students?.reg_number}</Text>
                </View>
              </View>
              <Text style={styles.absentLabel}>Absent</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14, letterSpacing: 1 },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  classCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  classInfo: { flex: 1 },
  moduleName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  classDetail: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  btnGroup: { gap: 8 },
  qrBtn: { backgroundColor: '#1D9E75', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bleBtn: { backgroundColor: '#534AB7', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  sessionBox: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  sessionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  sessionSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 10, backgroundColor: '#001f4d', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  timerText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  qrBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginVertical: 16 },
  bleCodeBox: { alignItems: 'center', backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 24, marginVertical: 16, width: '100%' },
  bleCodeText: { fontSize: 56, fontWeight: 'bold', color: '#FFD700', letterSpacing: 10, marginTop: 12 },
  bleCodeSub: { fontSize: 13, color: '#a0c4ff', textAlign: 'center', marginTop: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  statBox: { backgroundColor: '#0a1a2e', borderWidth: 1, borderColor: '#a0c4ff', width: '31%', padding: 14, borderRadius: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#1D9E75' },
  statLbl: { fontSize: 11, color: '#a0c4ff', marginTop: 2 },
  endBtn: { backgroundColor: '#D85A30', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  endBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#FFD700', padding: 8, borderRadius: 8 },
  downloadText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  attendeeCard: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  absentCard: { backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attendeeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presentDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1D9E75' },
  absentDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#D85A30' },
  attendeeName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  attendeeReg: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  presentLabel: { color: '#1D9E75', fontWeight: 'bold', fontSize: 13 },
  absentLabel: { color: '#D85A30', fontWeight: 'bold', fontSize: 13 },
});