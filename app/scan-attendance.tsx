import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function ScanAttendance() {
  const router = useRouter();
  const [mode, setMode] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [bleCode, setBleCode] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [pendingTimetableId, setPendingTimetableId] = useState('');
  const [confirmMode, setConfirmMode] = useState('');

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    const saved = await AsyncStorage.getItem('current_student');
    if (saved) setStudent(JSON.parse(saved));
  };

  const checkAlreadyMarked = async (timetableId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('attendance').select('*').eq('student_id', student.id).eq('timetable_id', timetableId).eq('date', today).eq('status', 'present').single();
    return !!data;
  };

  const markPresent = async (timetableId: string) => {
    if (!student) { Alert.alert('Error', 'You must be logged in'); return; }
    const already = await checkAlreadyMarked(timetableId);
    if (already) { setAlreadyMarked(true); return; }
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('attendance').upsert({ student_id: student.id, timetable_id: timetableId, date: today, status: 'present' }, { onConflict: 'student_id,timetable_id,date' });
    if (error) { Alert.alert('Error', 'Could not mark attendance'); return; }
    setSuccess(true);
  };

  const handleQRScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    if (data.startsWith('CAMPUSIQ_')) {
      const parts = data.split('_');
      const timetableId = parts[1];
      const already = await checkAlreadyMarked(timetableId);
      if (already) { setAlreadyMarked(true); return; }
      setPendingTimetableId(timetableId);
      setConfirmMode('qr');
    } else {
      Alert.alert('Invalid QR', 'This is not a valid Campus IQ attendance code');
      setScanned(false);
    }
  };

  const handleBLESubmit = async () => {
    if (!bleCode || bleCode.length !== 4) { Alert.alert('Invalid Code', 'Please enter the 4 digit code'); return; }
    const { data } = await supabase.from('timetable').select('*').order('created_at', { ascending: false }).limit(1).single();
    if (data) {
      const already = await checkAlreadyMarked(data.id);
      if (already) { setAlreadyMarked(true); return; }
      setPendingTimetableId(data.id);
      setConfirmMode('ble');
    } else {
      Alert.alert('No Session', 'No active class session found');
    }
  };

  const confirmPresent = async () => {
    await markPresent(pendingTimetableId);
    setConfirmMode('');
  };

  const resetAll = () => {
    setSuccess(false); setAlreadyMarked(false); setMode('');
    setScanned(false); setBleCode(''); setPendingTimetableId(''); setConfirmMode('');
  };

  if (alreadyMarked) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.alreadyCircle}><Ionicons name="checkmark-done" size={70} color="#FFD700" /></View>
          <Text style={styles.alreadyTitle}>Already Marked Present!</Text>
          <Text style={styles.alreadyName}>{student?.name} {student?.surname}</Text>
          <Text style={styles.alreadySub}>You have already been marked present for this class today.</Text>
          <Text style={styles.alreadySub}>No duplicate attendance is allowed.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={resetAll}><Text style={styles.doneBtnText}>OK</Text></TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#a0c4ff" /><Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={styles.successCircle}><Ionicons name="checkmark" size={80} color="#1D9E75" /></View>
          <Text style={styles.successTitle}>Attendance Confirmed!</Text>
          <Text style={styles.successName}>{student?.name} {student?.surname}</Text>
          <Text style={styles.successReg}>{student?.reg_number}</Text>
          <Text style={styles.successSub}>You have been marked present</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={resetAll}><Text style={styles.doneBtnText}>Done</Text></TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#a0c4ff" /><Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (confirmMode === 'qr' || confirmMode === 'ble') {
    return (
      <View style={styles.container}>
        <View style={styles.resultContainer}>
          <View style={[styles.confirmCircle, { borderColor: confirmMode === 'ble' ? '#534AB7' : '#1D9E75' }]}>
            <Ionicons name={confirmMode === 'qr' ? 'qr-code' : 'bluetooth'} size={60} color={confirmMode === 'ble' ? '#534AB7' : '#1D9E75'} />
          </View>
          <Text style={styles.confirmTitle}>{confirmMode === 'qr' ? 'QR Code Scanned!' : 'Code Accepted!'}</Text>
          <Text style={styles.confirmSub}>Tap Confirm Present to mark your attendance</Text>
          <Text style={styles.confirmName}>{student?.name} {student?.surname}</Text>
          <Text style={styles.confirmReg}>{student?.reg_number}</Text>
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: confirmMode === 'ble' ? '#534AB7' : '#1D9E75' }]} onPress={confirmPresent}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.confirmBtnText}>Confirm Present</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={resetAll}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
        </View>
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
          <View style={styles.studentInfo}>
            <Ionicons name="person-circle-outline" size={20} color="#1D9E75" />
            <Text style={styles.studentInfoText}>{student?.name} {student?.surname} — {student?.reg_number}</Text>
          </View>
          <TouchableOpacity style={styles.modeBtn} onPress={() => { if (!permission?.granted) requestPermission(); setMode('qr'); }}>
            <View style={styles.modeBtnLeft}>
              <View style={styles.modeIcon}><Ionicons name="qr-code-outline" size={30} color="#1D9E75" /></View>
              <View><Text style={styles.modeBtnTitle}>Scan QR Code</Text><Text style={styles.modeBtnSub}>Point camera at lecturer screen</Text></View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0c4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.modeBtn} onPress={() => setMode('ble')}>
            <View style={styles.modeBtnLeft}>
              <View style={styles.modeIconBle}><Ionicons name="bluetooth-outline" size={30} color="#534AB7" /></View>
              <View><Text style={styles.modeBtnTitle}>Enter BLE Code</Text><Text style={styles.modeBtnSub}>Type the 4 digit code from lecturer</Text></View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#a0c4ff" />
          </TouchableOpacity>
        </View>
      )}

      {mode === 'qr' && (
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <>
              <CameraView style={styles.camera} onBarcodeScanned={scanned ? undefined : handleQRScan} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />
              <View style={styles.scanOverlay}><View style={styles.scanFrame} /></View>
              <Text style={styles.scanInstruction}>Point your camera at the QR code on the lecturer's screen</Text>
              {scanned && <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}><Text style={styles.rescanText}>Tap to scan again</Text></TouchableOpacity>}
            </>
          ) : (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-outline" size={60} color="#a0c4ff" />
              <Text style={styles.permissionText}>Camera permission needed</Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}><Text style={styles.permissionBtnText}>Allow Camera</Text></TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.changeModeBtn} onPress={() => setMode('')}>
            <Ionicons name="arrow-back" size={18} color="#a0c4ff" /><Text style={styles.changeModeText}>Change method</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'ble' && (
        <View style={styles.bleContainer}>
          <Ionicons name="bluetooth" size={70} color="#534AB7" />
          <Text style={styles.bleTitle}>Enter the 4-digit code</Text>
          <Text style={styles.bleSub}>Your lecturer will display this code in class</Text>
          <TextInput style={styles.codeInput} placeholder="0000" placeholderTextColor="#aaa" value={bleCode} onChangeText={setBleCode} keyboardType="number-pad" maxLength={4} textAlign="center" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleBLESubmit}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.submitBtnText}>Verify Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.changeModeBtn} onPress={() => setMode('')}>
            <Ionicons name="arrow-back" size={18} color="#a0c4ff" /><Text style={styles.changeModeText}>Change method</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCircle: { backgroundColor: '#0a3d2e', width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#1D9E75', marginBottom: 24 },
  alreadyCircle: { backgroundColor: '#2a2a0e', width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFD700', marginBottom: 24 },
  confirmCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#0a2a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  alreadyTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 8, textAlign: 'center' },
  confirmTitle: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 },
  successName: { fontSize: 18, color: '#FFD700', fontWeight: 'bold', marginBottom: 4 },
  successReg: { fontSize: 14, color: '#a0c4ff', marginBottom: 4 },
  successSub: { fontSize: 14, color: '#a0c4ff', marginBottom: 40 },
  alreadySub: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', marginBottom: 8 },
  confirmSub: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', marginBottom: 16 },
  confirmName: { fontSize: 18, color: '#FFD700', fontWeight: 'bold', marginBottom: 4 },
  confirmReg: { fontSize: 14, color: '#a0c4ff', marginBottom: 24 },
  doneBtn: { backgroundColor: '#1D9E75', width: '100%', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  doneBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  confirmBtn: { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  confirmBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { width: '100%', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#534AB7' },
  cancelBtnText: { color: '#a0c4ff', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  backText: { color: '#a0c4ff', fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  modeContainer: { flex: 1, alignItems: 'center', paddingTop: 20 },
  modeTitle: { fontSize: 16, color: '#a0c4ff', textAlign: 'center', marginTop: 16, marginBottom: 16, paddingHorizontal: 20 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', padding: 12, borderRadius: 10, marginBottom: 20, width: '100%' },
  studentInfoText: { color: '#ffffff', fontSize: 14, flex: 1 },
  modeBtn: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', width: '100%', padding: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modeBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  modeIcon: { backgroundColor: '#0a3d2e', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1D9E75' },
  modeIconBle: { backgroundColor: '#1a1650', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#534AB7' },
  modeBtnTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  modeBtnSub: { fontSize: 12, color: '#a0c4ff', marginTop: 2 },
  cameraContainer: { flex: 1, alignItems: 'center' },
  camera: { width: '100%', height: 300, borderRadius: 16, overflow: 'hidden' },
  scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 200, height: 200, borderWidth: 2, borderColor: '#FFD700', borderRadius: 12 },
  scanInstruction: { color: '#a0c4ff', fontSize: 14, textAlign: 'center', marginTop: 16, paddingHorizontal: 20 },
  rescanBtn: { backgroundColor: '#534AB7', padding: 12, borderRadius: 10, marginTop: 12 },
  rescanText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  permissionBox: { alignItems: 'center', gap: 16, marginTop: 40 },
  permissionText: { color: '#a0c4ff', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  permissionBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 10 },
  permissionBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  changeModeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 },
  changeModeText: { color: '#a0c4ff', fontSize: 14 },
  bleContainer: { flex: 1, alignItems: 'center', paddingTop: 20 },
  bleTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff', marginTop: 16, marginBottom: 8 },
  bleSub: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', marginBottom: 30 },
  codeInput: { backgroundColor: '#0a2a4a', borderWidth: 2, borderColor: '#534AB7', width: '60%', padding: 20, borderRadius: 16, fontSize: 36, fontWeight: 'bold', color: '#FFD700', letterSpacing: 10, marginBottom: 24 },
  submitBtn: { backgroundColor: '#534AB7', width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  submitBtnText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});
