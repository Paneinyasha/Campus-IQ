import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import db from '../database/db';

export default function GenerateQR() {
  const router = useRouter();
  const [mode, setMode] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [timetable, setTimetable] = useState([]);
  const [bleCode, setBleCode] = useState('');

  useEffect(() => {
    loadTimetable();
  }, []);

  useEffect(() => {
    if (isActive && sessionId) {
      const interval = setInterval(() => {
        loadAttendees();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isActive, sessionId]);

  const loadTimetable = () => {
    const t = db.getAllSync(`
      SELECT timetable.*, lecturers.name as lec_name, venues.name as venue_name
      FROM timetable
      LEFT JOIN lecturers ON timetable.lecturer_id = lecturers.id
      LEFT JOIN venues ON timetable.venue_id = venues.id
    `);
    setTimetable(t);
  };

  const loadAttendees = () => {
    if (!sessionId) return;
    const present = db.getAllSync(`
      SELECT attendance.*, students.name, students.surname, students.reg_number
      FROM attendance
      LEFT JOIN students ON attendance.student_id = students.id
      WHERE attendance.timetable_id = ? AND attendance.date = date('now')
    `, [sessionId]);
    setAttendees(present);

    const all = db.getAllSync(`SELECT * FROM students`);
    setAllStudents(all);
  };

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const startQRSession = (classItem: any) => {
    const code = `CAMPUSIQ_${classItem.id}_${Date.now()}`;
    setSessionCode(code);
    setSessionId(String(classItem.id));
    setSelectedClass(classItem);
    setIsActive(true);
    setMode('qr');

    try {
      db.runSync(`
        INSERT OR IGNORE INTO attendance (student_id, timetable_id, date, status)
        SELECT id, ?, date('now'), 'absent'
        FROM students
      `, [classItem.id]);
    } catch (e) {}
  };

  const startBLESession = (classItem: any) => {
    const code = generateCode();
    setBleCode(code);
    setSessionId(String(classItem.id));
    setSelectedClass(classItem);
    setIsActive(true);
    setMode('ble');

    try {
      db.runSync(`
        INSERT OR IGNORE INTO attendance (student_id, timetable_id, date, status)
        SELECT id, ?, date('now'), 'absent'
        FROM students
      `, [classItem.id]);
    } catch (e) {}
  };

  const endSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end attendance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End', style: 'destructive', onPress: () => {
            setIsActive(false);
            setMode('');
            setSessionCode('');
            setBleCode('');
            loadAttendees();
          }
        }
      ]
    );
  };

  const downloadReport = async () => {
    const present = attendees;
    const absent = allStudents.filter(
      (s: any) => !present.find((a: any) => a.student_id === s.id)
    );

    const presentRows = present.map((a: any) => `
      <tr style="background:#e8f5e9">
        <td>${a.reg_number}</td>
        <td>${a.name} ${a.surname}</td>
        <td style="color:green;font-weight:bold">Present</td>
      </tr>
    `).join('');

    const absentRows = absent.map((s: any) => `
      <tr style="background:#ffebee">
        <td>${s.reg_number}</td>
        <td>${s.name} ${s.surname}</td>
        <td style="color:red;font-weight:bold">Absent</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #003366; }
            h3 { color: #534AB7; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #003366; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Campus IQ — Attendance Report</h1>
          <h3>${selectedClass?.module} — ${selectedClass?.program}</h3>
          <p>Date: ${new Date().toDateString()}</p>
          <p>Venue: ${selectedClass?.venue_name}</p>

          <div class="summary">
            <strong>Summary</strong><br/>
            Total Students: ${allStudents.length}<br/>
            Present: ${present.length}<br/>
            Absent: ${absent.length}<br/>
            Attendance Rate: ${allStudents.length > 0 ? Math.round((present.length / allStudents.length) * 100) : 0}%
          </div>

          <table>
            <tr>
              <th>Reg Number</th>
              <th>Full Name</th>
              <th>Status</th>
            </tr>
            ${presentRows}
            ${absentRows}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Attendance Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not generate report');
    }
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

      {!isActive && (
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
                  <Text style={styles.classDetail}>{t.venue_name}</Text>
                </View>
                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={styles.qrBtn}
                    onPress={() => startQRSession(t)}
                  >
                    <Ionicons name="qr-code-outline" size={20} color="#ffffff" />
                    <Text style={styles.btnText}>QR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bleBtn}
                    onPress={() => startBLESession(t)}
                  >
                    <Ionicons name="bluetooth-outline" size={20} color="#ffffff" />
                    <Text style={styles.btnText}>BLE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {isActive && mode === 'qr' && (
        <View style={styles.sessionBox}>
          <Text style={styles.sessionTitle}>QR Attendance Active</Text>
          <Text style={styles.sessionSub}>{selectedClass?.module}</Text>
          <Text style={styles.sessionSub}>{selectedClass?.day} {selectedClass?.start_time} — {selectedClass?.end_time}</Text>

          <View style={styles.qrBox}>
            <QRCode
              value={sessionCode}
              size={220}
              color="#003366"
              backgroundColor="#ffffff"
            />
          </View>

          <Text style={styles.scanText}>Students scan this QR code to mark attendance</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{attendees.length}</Text>
              <Text style={styles.statLbl}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#D85A30' }]}>
                {allStudents.length - attendees.length}
              </Text>
              <Text style={styles.statLbl}>Absent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#FFD700' }]}>
                {allStudents.length > 0 ? Math.round((attendees.length / allStudents.length) * 100) : 0}%
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

      {isActive && mode === 'ble' && (
        <View style={styles.sessionBox}>
          <Text style={styles.sessionTitle}>Bluetooth Attendance Active</Text>
          <Text style={styles.sessionSub}>{selectedClass?.module}</Text>
          <Text style={styles.sessionSub}>{selectedClass?.day} {selectedClass?.start_time} — {selectedClass?.end_time}</Text>

          <View style={styles.bleCodeBox}>
            <Ionicons name="bluetooth" size={40} color="#534AB7" />
            <Text style={styles.bleCodeText}>{bleCode}</Text>
            <Text style={styles.bleCodeSub}>Share this code with students in the room</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{attendees.length}</Text>
              <Text style={styles.statLbl}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#D85A30' }]}>
                {allStudents.length - attendees.length}
              </Text>
              <Text style={styles.statLbl}>Absent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#FFD700' }]}>
                {allStudents.length > 0 ? Math.round((attendees.length / allStudents.length) * 100) : 0}%
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

      {!isActive && attendees.length > 0 && (
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
                  <Text style={styles.attendeeName}>{a.name} {a.surname}</Text>
                  <Text style={styles.attendeeReg}>{a.reg_number}</Text>
                </View>
              </View>
              <Text style={styles.presentLabel}>Present</Text>
            </View>
          ))}

          {allStudents
            .filter((s: any) => !attendees.find((a: any) => a.student_id === s.id))
            .map((s: any) => (
              <View key={s.id} style={styles.absentCard}>
                <View style={styles.attendeeLeft}>
                  <View style={styles.absentDot} />
                  <View>
                    <Text style={styles.attendeeName}>{s.name} {s.surname}</Text>
                    <Text style={styles.attendeeReg}>{s.reg_number}</Text>
                  </View>
                </View>
                <Text style={styles.absentLabel}>Absent</Text>
              </View>
            ))
          }
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    padding: 4,
  },
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
    letterSpacing: 1,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    color: '#a0c4ff',
    textAlign: 'center',
  },
  classCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  classDetail: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  btnGroup: {
    gap: 8,
  },
  qrBtn: {
    backgroundColor: '#1D9E75',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bleBtn: {
    backgroundColor: '#534AB7',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sessionBox: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  sessionSub: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 2,
  },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginVertical: 20,
  },
  scanText: {
    fontSize: 13,
    color: '#a0c4ff',
    textAlign: 'center',
    marginBottom: 20,
  },
  bleCodeBox: {
    alignItems: 'center',
    backgroundColor: '#1a1650',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    width: '100%',
  },
  bleCodeText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 10,
    marginTop: 12,
  },
  bleCodeSub: {
    fontSize: 13,
    color: '#a0c4ff',
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#a0c4ff',
    width: '31%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1D9E75',
  },
  statLbl: {
    fontSize: 11,
    color: '#a0c4ff',
    marginTop: 2,
  },
  endBtn: {
    backgroundColor: '#D85A30',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  endBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 8,
    borderRadius: 8,
  },
  downloadText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
  },
  attendeeCard: {
    backgroundColor: '#0a3d2e',
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  absentCard: {
    backgroundColor: '#3d1a0a',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1D9E75',
  },
  absentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D85A30',
  },
  attendeeName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  attendeeReg: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  presentLabel: {
    color: '#1D9E75',
    fontWeight: 'bold',
    fontSize: 13,
  },
  absentLabel: {
    color: '#D85A30',
    fontWeight: 'bold',
    fontSize: 13,
  },
});