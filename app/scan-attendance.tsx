import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function ScanAttendance() {
  const router = useRouter();
  const [mode, setMode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [bleCode, setBleCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = () => {
    try {
      const student = db.getFirstSync(`SELECT * FROM students LIMIT 1`);
      if (student) {
        setStudentId(String((student as any).id));
        setStudentName(`${(student as any).name} ${(student as any).surname}`);
      }
    } catch (e) {}
  };

  const markPresent = (timetableId: string) => {
    try {
      const existing = db.getFirstSync(
        `SELECT * FROM attendance WHERE student_id = ? AND timetable_id = ? AND date = date('now')`,
        [studentId, timetableId]
      );

      if (existing) {
        db.runSync(
          `UPDATE attendance SET status = 'present' WHERE student_id = ? AND timetable_id = ? AND date = date('now')`,
          [studentId, timetableId]
        );
      } else {
        db.runSync(
          `INSERT INTO attendance (student_id, timetable_id, date, status) VALUES (?, ?, date('now'), 'present')`,
          [studentId, timetableId]
        );
      }
      setSuccess(true);
    } catch (e) {
      Alert.alert('Error', 'Could not mark attendance');
    }
  };

  const handleQRScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (data.startsWith('CAMPUSIQ_')) {
      const parts = data.split('_');
      const timetableId = parts[1];
      markPresent(timetableId);
    } else {
      Alert.alert('Invalid QR', 'This QR code is not a valid Campus IQ attendance code');
      setScanned(false);
    }
  };

  const handleBLESubmit = () => {
    if (!bleCode || bleCode.length !== 4) {
      Alert.alert('Invalid Code', 'Please enter the 4 digit code from your lecturer');
      return;
    }

    const session = db.getFirstSync(
      `SELECT * FROM timetable LIMIT 1`
    );

    if (session) {
      markPresent(String((session as any).id));
    } else {
      Alert.alert('Error', 'No active class session found');
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={80} color="#1D9E75" />
        </View>
        <Text style={styles.successTitle}>Attendance Marked!</Text>
        <Text style={styles.successName}>{studentName}</Text>
        <Text style={styles.successSub}>You have been marked present</Text>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => {
            setSuccess(false);
            setMode('');
            setScanned(false);
            setBleCode('');
          }}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Mark Attendance</Text>
        <View style={{ width: 24 }} />
      </View>

      {mode === '' && (
        <View style={styles.modeContainer}>
          <Ionicons name="checkmark-circle-outline" size={70} color="#1D9E75" />
          <Text style={styles.modeTitle}>How would you like to mark attendance?</Text>

          <TouchableOpacity
            style={styles.modeBtn}
            onPress={() => {
              if (!permission?.granted) {
                requestPermission();
              }
              setMode('qr');
            }}
          >
            <View style={styles.modeBtnLeft}>
              <View style={styles.modeIcon}>
                <Ionicons name="qr-code-outline" size={30} color="#1D9E75" />
              </View>
              <View>
                <Text style={styles.modeBtnTitle}>Scan QR Code</Text>
                <Text style={styles.modeBtnSub}>Point camera at lecturer screen</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0c4ff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeBtn}
            onPress={() => setMode('ble')}
          >
            <View style={styles.modeBtnLeft}>
              <View style={styles.modeIconBle}>
                <Ionicons name="bluetooth-outline" size={30} color="#534AB7" />
              </View>
              <View>
                <Text style={styles.modeBtnTitle}>Enter BLE Code</Text>
                <Text style={styles.modeBtnSub}>Type the code from your lecturer</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0c4ff" />
          </TouchableOpacity>
        </View>
      )}

      {mode === 'qr' && (
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleQRScan}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame} />
              </View>
              <Text style={styles.scanInstruction}>
                Point your camera at the QR code on the lecturer's screen
              </Text>
              {scanned && (
                <TouchableOpacity
                  style={styles.rescanBtn}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanText}>Tap to scan again</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={60} color="#a0c4ff" />
              <Text style={styles.permissionText}>Camera permission is needed to scan QR codes</Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                <Text style={styles.permissionBtnText}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.changeModeBtn}
            onPress={() => setMode('')}
          >
            <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
            <Text style={styles.changeModeText}>Change method</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'ble' && (
        <View style={styles.bleContainer}>
          <Ionicons name="bluetooth" size={70} color="#534AB7" />
          <Text style={styles.bleTitle}>Enter the 4-digit code</Text>
          <Text style={styles.bleSub}>Your lecturer will display this code in class</Text>

          <TextInput
            style={styles.codeInput}
            placeholder="0000"
            placeholderTextColor="#aaa"
            value={bleCode}
            onChangeText={setBleCode}
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleBLESubmit}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.submitBtnText}>Confirm Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changeModeBtn}
            onPress={() => setMode('')}
          >
            <Ionicons name="arrow-back" size={18} color="#a0c4ff" />
            <Text style={styles.changeModeText}>Change method</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    padding: 20,
    paddingTop: 60,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#001f4d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCircle: {
    backgroundColor: '#0a3d2e',
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1D9E75',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  successName: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successSub: {
    fontSize: 14,
    color: '#a0c4ff',
    marginBottom: 40,
  },
  doneBtn: {
    backgroundColor: '#1D9E75',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  backText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modeContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  modeTitle: {
    fontSize: 16,
    color: '#a0c4ff',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  modeBtn: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modeBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modeIcon: {
    backgroundColor: '#0a3d2e',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D9E75',
  },
  modeIconBle: {
    backgroundColor: '#1a1650',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
  },
  modeBtnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modeBtnSub: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
  },
  scanInstruction: {
    color: '#a0c4ff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  rescanBtn: {
    backgroundColor: '#534AB7',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  rescanText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionBox: {
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  permissionText: {
    color: '#a0c4ff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  permissionBtn: {
    backgroundColor: '#1D9E75',
    padding: 14,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  changeModeText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  bleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  bleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  bleSub: {
    fontSize: 14,
    color: '#a0c4ff',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeInput: {
    backgroundColor: '#0a2a4a',
    borderWidth: 2,
    borderColor: '#534AB7',
    width: '60%',
    padding: 20,
    borderRadius: 16,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 10,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: '#534AB7',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});