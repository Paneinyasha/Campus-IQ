import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, AppState,
  ScrollView,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../database/supabase';

const ATTENDANCE_THRESHOLD = 75;

export default function GenerateQR() {
  const router = useRouter();
  const [tab, setTab] = useState<'attendance' | 'reports'>('attendance');
  const [lecturer, setLecturer] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [mode, setMode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [bleCode, setBleCode] = useState('');
  const [sessionId, setSessionId] = useState(''); // this is the timetable_id
  const [sessionClassId, setSessionClassId] = useState(''); // class_id
  const [isActive, setIsActive] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [absentees, setAbsentees] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => { loadLecturer(); }, []);

  useEffect(() => {
    if (isActive && sessionId) {
      const interval = setInterval(loadAttendees, 4000);
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
  }, [isActive]);

  // Block screenshots during active QR session
  useEffect(() => {
    if (!isActive || mode !== 'qr') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        Alert.alert(
          'Security Warning',
          'Leaving the attendance screen is not allowed during an active QR session. The QR code is for this room only.',
          [{ text: 'Stay', style: 'cancel' }]
        );
      }
    });
    return () => sub.remove();
  }, [isActive, mode]);

  const loadLecturer = async () => {
    const saved = await AsyncStorage.getItem('current_lecturer');
    if (saved) {
      const l = JSON.parse(saved);
      setLecturer(l);
      loadClasses(l.id);
      loadReportData(l.id);
    }
  };

  const loadClasses = async (lid: string) => {
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, class_code, timetable_id')
      .eq('lecturer_id', lid)
      .order('class_name');

    if (!data || data.length === 0) { setClasses([]); return; }

    const timetableIds = data.map((c: any) => c.timetable_id).filter(Boolean);
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

    setClasses(data.map((c: any) => ({ ...c, timetable: timetableMap[c.timetable_id] })));
  };

  const loadReportData = async (lid: string) => {
    // Load student attendance stats
    const { data: myClasses } = await supabase.from('classes').select('id, class_name, timetable_id').eq('lecturer_id', lid);
    if (!myClasses || myClasses.length === 0) return;

    const classIds = myClasses.map((c: any) => c.id);
    const timetableIds = myClasses.map((c: any) => c.timetable_id).filter(Boolean);

    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id, class_id')
      .in('class_id', classIds);

    if (!enrollments || enrollments.length === 0) return;

    const studentIds = [...new Set(enrollments.map((e: any) => e.student_id))];
    const { data: students } = await supabase.from('students').select('id, name, surname, reg_number, program').in('id', studentIds);
    const studentMap: any = {};
    (students || []).forEach((s: any) => { studentMap[s.id] = s; });

    const stats = await Promise.all(studentIds.map(async (sid) => {
      const { count: total } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', sid).in('timetable_id', timetableIds);
      const { count: present } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('student_id', sid).eq('status', 'present').in('timetable_id', timetableIds);
      const pct = (total || 0) > 0 ? Math.round(((present || 0) / (total || 1)) * 100) : 0;
      return {
        ...studentMap[sid],
        totalClasses: total || 0,
        presentClasses: present || 0,
        percentage: pct,
      };
    }));

    setStudentStats(stats.sort((a, b) => a.percentage - b.percentage));

    // Session history
    if (timetableIds.length > 0) {
      const { data: sessions } = await supabase
        .from('attendance')
        .select('date, timetable_id, status')
        .in('timetable_id', timetableIds)
        .order('date', { ascending: false });

      const grouped: any = {};
      (sessions || []).forEach((s: any) => {
        const key = `${s.timetable_id}_${s.date}`;
        if (!grouped[key]) grouped[key] = { timetable_id: s.timetable_id, date: s.date, present: 0, absent: 0 };
        if (s.status === 'present') grouped[key].present++;
        else grouped[key].absent++;
      });

      const timetableClassMap: any = {};
      myClasses.forEach((c: any) => { if (c.timetable_id) timetableClassMap[c.timetable_id] = c.class_name; });

      setSessionHistory(
        Object.values(grouped)
          .map((g: any) => ({ ...g, class_name: timetableClassMap[g.timetable_id] || '' }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 30)
      );
    }
  };

  const initializeAttendance = async (classId: string, timetableId: string) => {
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select('student_id')
      .eq('class_id', classId);

    const today = new Date().toISOString().split('T')[0];
    for (const e of (enrollments || [])) {
      await supabase.from('attendance').upsert({
        student_id: e.student_id,
        timetable_id: timetableId,
        date: today,
        status: 'absent',
      }, { onConflict: 'student_id,timetable_id,date' });
    }
  };

  const loadAttendees = async () => {
    if (!sessionId) return;
    const today = new Date().toISOString().split('T')[0];
    const { data: present } = await supabase.from('attendance').select('*, students(name, surname, reg_number)').eq('timetable_id', sessionId).eq('date', today).eq('status', 'present');
    const { data: absent } = await supabase.from('attendance').select('*, students(name, surname, reg_number)').eq('timetable_id', sessionId).eq('date', today).eq('status', 'absent');
    setAttendees(present || []);
    setAbsentees(absent || []);
  };

  const startQRSession = async (classItem: any) => {
    if (!classItem.timetable_id) {
      Alert.alert('No Timetable Linked', 'This class is not linked to a timetable slot. Please link it in Classroom settings first.');
      return;
    }
    const code = `CAMPUSIQ_${classItem.timetable_id}_${Date.now()}`;
    setSessionCode(code);
    setSessionId(classItem.timetable_id);
    setSessionClassId(classItem.id);
    setSelectedClass(classItem);
    setIsActive(true);
    setMode('qr');
    setSessionExpired(false);
    setTimeLeft(3600);
    await initializeAttendance(classItem.id, classItem.timetable_id);
    loadAttendees();
  };

  const startBLESession = async (classItem: any) => {
    if (!classItem.timetable_id) {
      Alert.alert('No Timetable Linked', 'This class is not linked to a timetable slot. Please link it in Classroom settings first.');
      return;
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setBleCode(code);
    setSessionId(classItem.timetable_id);
    setSessionClassId(classItem.id);
    setSelectedClass(classItem);
    setIsActive(true);
    setMode('ble');
    setSessionExpired(false);
    setTimeLeft(3600);
    await initializeAttendance(classItem.id, classItem.timetable_id);
    loadAttendees();
  };

  const endSessionAuto = () => {
    clearInterval(timerRef.current);
    setIsActive(false);
    setSessionExpired(true);
    loadAttendees();
    loadReportData(lecturer?.id);
    Alert.alert('Session Ended', 'Attendance session has ended automatically. Remaining students are marked absent.');
  };

  const endSession = () => {
    Alert.alert('End Session', 'End the attendance session now? Remaining students will be marked absent.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Session', style: 'destructive', onPress: () => {
          clearInterval(timerRef.current);
          setIsActive(false);
          setSessionExpired(true);
          loadAttendees();
          loadReportData(lecturer?.id);
        }
      }
    ]);
  };

  const downloadReport = async () => {
    const atRisk = studentStats.filter(s => s.percentage < ATTENDANCE_THRESHOLD);
    const html = `
      <html><head><style>
        body{font-family:Arial;padding:20px;color:#001f4d}
        h1{color:#001f4d}h2{color:#534AB7}
        table{width:100%;border-collapse:collapse;margin:16px 0}
        th{background:#001f4d;color:white;padding:10px;text-align:left;font-size:13px}
        td{padding:10px;border-bottom:1px solid #ddd;font-size:13px}
        .warn{color:orange;font-weight:bold}.crit{color:red;font-weight:bold}.ok{color:green}
        .summary{background:#f5f5f5;padding:15px;border-radius:8px;margin:16px 0}
      </style></head><body>
        <h1>Campus IQ Attendance Report</h1>
        <h2>${lecturer?.name} ${lecturer?.surname} — ${lecturer?.department}</h2>
        <p>Generated: ${new Date().toDateString()}</p>
        <div class="summary">
          <strong>Summary</strong><br/>
          Total Students Tracked: ${studentStats.length}<br/>
          At Risk (below ${ATTENDANCE_THRESHOLD}%): ${atRisk.length}<br/>
          Policy Threshold: ${ATTENDANCE_THRESHOLD}%
        </div>
        <h2>Student Attendance Statistics</h2>
        <table>
          <tr><th>Reg</th><th>Name</th><th>Program</th><th>Present</th><th>Total</th><th>%</th><th>Status</th></tr>
          ${studentStats.map(s => `<tr>
            <td>${s.reg_number}</td><td>${s.name} ${s.surname}</td><td>${s.program}</td>
            <td>${s.presentClasses}</td><td>${s.totalClasses}</td>
            <td class="${s.percentage < 50 ? 'crit' : s.percentage < ATTENDANCE_THRESHOLD ? 'warn' : 'ok'}">${s.percentage}%</td>
            <td class="${s.percentage < 50 ? 'crit' : s.percentage < ATTENDANCE_THRESHOLD ? 'warn' : 'ok'}">${s.percentage < 50 ? 'CRITICAL' : s.percentage < ATTENDANCE_THRESHOLD ? 'WARNING' : 'OK'}</td>
          </tr>`).join('')}
        </table>
        <h2>Session History</h2>
        <table>
          <tr><th>Date</th><th>Class</th><th>Present</th><th>Absent</th><th>Rate</th></tr>
          ${sessionHistory.map(h => `<tr>
            <td>${new Date(h.date).toDateString()}</td><td>${h.class_name}</td>
            <td style="color:green">${h.present}</td><td style="color:red">${h.absent}</td>
            <td>${h.present + h.absent > 0 ? Math.round((h.present / (h.present + h.absent)) * 100) : 0}%</td>
          </tr>`).join('')}
        </table>
      </body></html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Attendance Report' });
    } catch (e) { Alert.alert('Error', 'Could not generate report'); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Attendance</Text>
        <TouchableOpacity style={styles.pdfBtn} onPress={downloadReport}>
          <Ionicons name="download-outline" size={22} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'attendance' && styles.tabActive]} onPress={() => setTab('attendance')}>
          <Ionicons name="qr-code-outline" size={16} color={tab === 'attendance' ? '#fff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'attendance' && styles.tabTextActive]}>Take Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'reports' && styles.tabActive]} onPress={() => setTab('reports')}>
          <Ionicons name="bar-chart-outline" size={16} color={tab === 'reports' ? '#fff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'reports' && styles.tabTextActive]}>Reports</Text>
        </TouchableOpacity>
      </View>

      {tab === 'attendance' && (
        <>
          {!isActive && !sessionExpired && (
            <>
              <Text style={styles.sectionTitle}>Select a Class to Take Attendance</Text>
              {classes.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="school-outline" size={50} color="#534AB7" />
                  <Text style={styles.emptyTitle}>No Classes Found</Text>
                  <Text style={styles.emptyText}>Create classes in the Classroom section first and link them to timetable slots.</Text>
                </View>
              ) : (
                classes.map((c: any) => (
                  <View key={c.id} style={styles.classCard}>
                    <View style={styles.classInfo}>
                      <Text style={styles.moduleName}>{c.class_name}</Text>
                      {c.timetable ? (
                        <>
                          <Text style={styles.classDetail}>{c.timetable.module}</Text>
                          <Text style={styles.classDetail}>{c.timetable.day} • {c.timetable.start_time} — {c.timetable.end_time}</Text>
                          <Text style={styles.classDetail}>{c.timetable.venue?.name}</Text>
                        </>
                      ) : (
                        <Text style={[styles.classDetail, { color: '#D85A30' }]}>⚠ No timetable linked — go to Classroom to link</Text>
                      )}
                    </View>
                    {c.timetable_id && (
                      <View style={styles.btnGroup}>
                        <TouchableOpacity style={styles.qrBtn} onPress={() => startQRSession(c)}>
                          <Ionicons name="qr-code-outline" size={20} color="#fff" />
                          <Text style={styles.btnText}>QR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bleBtn} onPress={() => startBLESession(c)}>
                          <Ionicons name="bluetooth-outline" size={20} color="#fff" />
                          <Text style={styles.btnText}>BLE</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {isActive && (
            <View style={styles.sessionBox}>
              <Text style={styles.sessionTitle}>{mode === 'qr' ? 'QR Code' : 'Bluetooth Code'} Session Active</Text>
              <Text style={styles.sessionSub}>{selectedClass?.class_name}</Text>
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={18} color="#FFD700" />
                <Text style={styles.timerText}>Ends in: {formatTime(timeLeft)}</Text>
              </View>

              {mode === 'qr' && (
                <>
                  <View style={styles.qrContainer}>
                    <View style={styles.qrBox}>
                      <QRCode value={sessionCode} size={200} color="#003366" backgroundColor="#ffffff" />
                    </View>
                    <View style={styles.screenshotWarnBox}>
                      <Ionicons name="camera-outline" size={16} color="#D85A30" />
                      <Text style={styles.screenshotWarnText}>Do not share this QR code. It is valid only in this room for this session.</Text>
                    </View>
                  </View>
                </>
              )}

              {mode === 'ble' && (
                <View style={styles.bleBox}>
                  <Ionicons name="bluetooth" size={36} color="#534AB7" />
                  <Text style={styles.bleCode}>{bleCode}</Text>
                  <View style={styles.bleRangeBox}>
                    <Ionicons name="radio-outline" size={16} color="#FFD700" />
                    <Text style={styles.bleRangeText}>Bluetooth proximity required. Students must be within 10 metres with Bluetooth enabled. The code will not work for remote students.</Text>
                  </View>
                </View>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#1D9E75' }]}>{attendees.length}</Text>
                  <Text style={styles.statLbl}>Present</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#D85A30' }]}>{absentees.length}</Text>
                  <Text style={styles.statLbl}>Absent</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNum, { color: '#FFD700' }]}>
                    {attendees.length + absentees.length > 0 ? Math.round((attendees.length / (attendees.length + absentees.length)) * 100) : 0}%
                  </Text>
                  <Text style={styles.statLbl}>Rate</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.endBtn} onPress={endSession}>
                <Ionicons name="stop-circle-outline" size={22} color="#ffffff" />
                <Text style={styles.endBtnText}>End Session</Text>
              </TouchableOpacity>
            </View>
          )}

          {sessionExpired && (attendees.length > 0 || absentees.length > 0) && (
            <>
              <View style={styles.reportTopRow}>
                <Text style={styles.sectionTitle}>Session Register</Text>
                <TouchableOpacity style={styles.pdfSmallBtn} onPress={downloadReport}>
                  <Ionicons name="download-outline" size={18} color="#FFD700" />
                  <Text style={styles.pdfSmallText}>PDF</Text>
                </TouchableOpacity>
              </View>
              {attendees.map((a: any) => (
                <View key={a.id} style={styles.presentCard}>
                  <View style={styles.dot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attendeeName}>{a.students?.name} {a.students?.surname}</Text>
                    <Text style={styles.attendeeReg}>{a.students?.reg_number}</Text>
                  </View>
                  <Text style={styles.presentLabel}>Present</Text>
                </View>
              ))}
              {absentees.map((a: any) => (
                <View key={a.id} style={styles.absentCard}>
                  <View style={[styles.dot, { backgroundColor: '#D85A30' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attendeeName}>{a.students?.name} {a.students?.surname}</Text>
                    <Text style={styles.attendeeReg}>{a.students?.reg_number}</Text>
                  </View>
                  <Text style={styles.absentLabel}>Absent</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      {tab === 'reports' && (
        <>
          <View style={styles.reportTopRow}>
            <Text style={styles.sectionTitle}>Student Statistics</Text>
            <TouchableOpacity style={styles.pdfSmallBtn} onPress={downloadReport}>
              <Ionicons name="download-outline" size={18} color="#FFD700" />
              <Text style={styles.pdfSmallText}>PDF</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.thresholdBox}>
            <Ionicons name="warning-outline" size={16} color="#FFD700" />
            <Text style={styles.thresholdText}>Policy: {ATTENDANCE_THRESHOLD}% minimum required to sit exams</Text>
          </View>

          {studentStats.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={50} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptyText}>Start taking attendance to see student statistics</Text>
            </View>
          ) : (
            studentStats.map((s: any) => {
              const color = s.percentage >= ATTENDANCE_THRESHOLD ? '#1D9E75' : s.percentage >= 50 ? '#FFD700' : '#D85A30';
              const flag = s.percentage < 50 ? 'CRITICAL' : s.percentage < ATTENDANCE_THRESHOLD ? 'WARNING' : 'OK';
              return (
                <View key={s.id} style={[styles.statStudentCard, { borderColor: color }]}>
                  <View style={[styles.statPercCircle, { backgroundColor: color + '22', borderColor: color }]}>
                    <Text style={[styles.statPercText, { color }]}>{s.percentage}%</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attendeeName}>{s.name} {s.surname}</Text>
                    <Text style={styles.attendeeReg}>{s.reg_number}</Text>
                    <Text style={[styles.classDetail, { marginTop: 2 }]}>{s.presentClasses}/{s.totalClasses} classes attended</Text>
                  </View>
                  {flag !== 'OK' && (
                    <View style={[styles.flagBadge, { backgroundColor: color + '22', borderColor: color }]}>
                      <Text style={[styles.flagText, { color }]}>{flag}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Session History</Text>
          {sessionHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No session history yet</Text>
            </View>
          ) : (
            sessionHistory.map((h: any, i: number) => {
              const rate = h.present + h.absent > 0 ? Math.round((h.present / (h.present + h.absent)) * 100) : 0;
              const rateColor = rate >= 75 ? '#1D9E75' : rate >= 50 ? '#FFD700' : '#D85A30';
              return (
                <View key={i} style={styles.historyCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{new Date(h.date).toDateString()}</Text>
                    <Text style={styles.historyClass}>{h.class_name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.presentLabel}>{h.present} present</Text>
                    <Text style={styles.absentLabel}>{h.absent} absent</Text>
                    <Text style={[styles.attendeeName, { color: rateColor }]}>{rate}%</Text>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  pdfBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#0a2a4a' },
  tabActive: { backgroundColor: '#534AB7' },
  tabText: { color: '#a0c4ff', fontSize: 12 },
  tabTextActive: { color: '#ffffff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', marginBottom: 12, letterSpacing: 1 },
  emptyBox: { alignItems: 'center', marginTop: 40, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  classCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  classInfo: { flex: 1 },
  moduleName: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  classDetail: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  btnGroup: { gap: 8 },
  qrBtn: { backgroundColor: '#1D9E75', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bleBtn: { backgroundColor: '#534AB7', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  btnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  sessionBox: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  sessionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 4 },
  sessionSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 8 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#001f4d', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 16 },
  timerText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  qrContainer: { alignItems: 'center', width: '100%' },
  qrBox: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12 },
  screenshotWarnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', borderRadius: 10, padding: 10, width: '100%', marginBottom: 16 },
  screenshotWarnText: { color: '#D85A30', fontSize: 12, flex: 1 },
  bleBox: { alignItems: 'center', backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 24, width: '100%', marginBottom: 16 },
  bleCode: { fontSize: 52, fontWeight: 'bold', color: '#FFD700', letterSpacing: 10, marginTop: 10, marginBottom: 16 },
  bleRangeBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 10, width: '100%' },
  bleRangeText: { color: '#FFD700', fontSize: 12, flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  statBox: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#a0c4ff', width: '31%', padding: 14, borderRadius: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold' },
  statLbl: { fontSize: 11, color: '#a0c4ff', marginTop: 2 },
  endBtn: { backgroundColor: '#D85A30', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  endBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  reportTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  pdfSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#FFD700', padding: 8, borderRadius: 8 },
  pdfSmallText: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  presentCard: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  absentCard: { backgroundColor: '#3d1a0a', borderWidth: 1, borderColor: '#D85A30', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1D9E75' },
  attendeeName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  attendeeReg: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  presentLabel: { color: '#1D9E75', fontWeight: 'bold', fontSize: 13 },
  absentLabel: { color: '#D85A30', fontWeight: 'bold', fontSize: 13 },
  thresholdBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2a1500', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 12, marginBottom: 14 },
  thresholdText: { color: '#FFD700', fontSize: 13, flex: 1 },
  statStudentCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statPercCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  statPercText: { fontSize: 15, fontWeight: 'bold' },
  flagBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  flagText: { fontSize: 11, fontWeight: 'bold' },
  historyCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  historyDate: { fontSize: 12, color: '#FFD700', fontWeight: 'bold' },
  historyClass: { fontSize: 14, fontWeight: 'bold', color: '#ffffff', marginTop: 2 },
});