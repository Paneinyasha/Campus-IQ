import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getAllLecturers, getAllStudents, suspendUser, unsuspendUser } from '../database/db';

const SUSPEND_REASONS = [
  'Foul language',
  'Racism',
  'Body shaming',
  'Cyberbullying',
  'Harassment',
  'Cheating',
  'Academic dishonesty',
  'Inappropriate content',
  'Spamming',
  'Other',
];

const UNSUSPEND_REASONS = [
  'Good behaviour',
  'Suspension period ended',
  'Appeal approved',
  'Misunderstanding resolved',
  'Completed disciplinary process',
  'Other',
];

export default function SuspendUser() {
  const router = useRouter();
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSuspending, setIsSuspending] = useState(true);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsUser, setDetailsUser] = useState<any>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = () => {
    const s = getAllStudents();
    const l = getAllLecturers();
    if (s.success) setStudents(s.students);
    if (l.success) setLecturers(l.lecturers);
  };

  const openSuspendModal = (user: any, type: string, suspending: boolean) => {
    setSelectedUser({ ...user, type });
    setIsSuspending(suspending);
    setSelectedReason('');
    setOtherReason('');
    setShowModal(true);
  };

  const openDetailsModal = (user: any, type: string) => {
    setDetailsUser({ ...user, type });
    setShowDetailsModal(true);
  };

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Other' ? otherReason : selectedReason;

    if (!finalReason) {
      Alert.alert('Select Reason', 'Please select or enter a reason');
      return;
    }

    const result = isSuspending
      ? suspendUser(selectedUser.id, selectedUser.type, finalReason)
      : unsuspendUser(selectedUser.id, selectedUser.type, finalReason);

    if (result.success) {
      Alert.alert(
        'Done',
        `${selectedUser.name} ${selectedUser.surname} has been ${isSuspending ? 'suspended' : 'unsuspended'}.\nReason: ${finalReason}`
      );
      setShowModal(false);
      loadAll();
    }
  };

  const UserCard = ({ user, type }: any) => (
    <TouchableOpacity
      style={[styles.userCard, user.is_suspended === 1 && styles.suspendedCard]}
      onPress={() => openDetailsModal(user, type)}
    >
      <View style={styles.userLeft}>
        <View style={[
          styles.avatarCircle,
          { borderColor: user.is_suspended === 1 ? '#D85A30' : type === 'student' ? '#1D9E75' : '#534AB7' }
        ]}>
          <Ionicons
            name={type === 'student' ? 'person' : 'book'}
            size={22}
            color={user.is_suspended === 1 ? '#D85A30' : type === 'student' ? '#1D9E75' : '#534AB7'}
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name} {user.surname}</Text>
          <Text style={styles.userReg}>
            {type === 'student' ? user.reg_number : user.email}
          </Text>
          <Text style={styles.userProgram}>
            {type === 'student' ? user.program : user.department}
          </Text>
          {user.is_suspended === 1 && user.suspend_reason !== '' && (
            <Text style={styles.suspendReason}>
              Suspended: {user.suspend_reason}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: user.is_suspended === 1 ? '#1D9E75' : '#D85A30' }
        ]}
        onPress={() => openSuspendModal(user, type, user.is_suspended === 0)}
      >
        <Ionicons
          name={user.is_suspended === 1 ? 'checkmark-circle-outline' : 'ban-outline'}
          size={16}
          color="#ffffff"
        />
        <Text style={styles.actionBtnText}>
          {user.is_suspended === 1 ? 'Unsuspend' : 'Suspend'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'students' && styles.tabActive]}
          onPress={() => setTab('students')}
        >
          <Ionicons name="people-outline" size={18} color={tab === 'students' ? '#ffffff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'students' && styles.tabTextActive]}>
            Students ({students.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'lecturers' && styles.tabActive]}
          onPress={() => setTab('lecturers')}
        >
          <Ionicons name="book-outline" size={18} color={tab === 'lecturers' ? '#ffffff' : '#a0c4ff'} />
          <Text style={[styles.tabText, tab === 'lecturers' && styles.tabTextActive]}>
            Lecturers ({lecturers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Tap a user to see details. Tap Suspend/Unsuspend to change status.</Text>

      {tab === 'students' && (
        students.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={50} color="#534AB7" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          students.map((s: any) => <UserCard key={s.id} user={s} type="student" />)
        )
      )}

      {tab === 'lecturers' && (
        lecturers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="book-outline" size={50} color="#534AB7" />
            <Text style={styles.emptyText}>No lecturers found</Text>
          </View>
        ) : (
          lecturers.map((l: any) => <UserCard key={l.id} user={l} type="lecturer" />)
        )
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isSuspending ? 'Suspend' : 'Unsuspend'} {selectedUser?.name}?
            </Text>
            <Text style={styles.modalSubtitle}>
              Select a reason for {isSuspending ? 'suspension' : 'unsuspension'}
            </Text>

            <ScrollView style={styles.reasonList}>
              {(isSuspending ? SUSPEND_REASONS : UNSUSPEND_REASONS).map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    selectedReason === reason && styles.reasonOptionSelected
                  ]}
                  onPress={() => setSelectedReason(reason)}
                >
                  <View style={[
                    styles.reasonRadio,
                    selectedReason === reason && styles.reasonRadioSelected
                  ]}>
                    {selectedReason === reason && (
                      <View style={styles.reasonRadioDot} />
                    )}
                  </View>
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedReason === 'Other' && (
              <TextInput
                style={styles.otherInput}
                placeholder="Enter reason..."
                placeholderTextColor="#aaa"
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
              />
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: isSuspending ? '#D85A30' : '#1D9E75' }
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnText}>
                  {isSuspending ? 'Suspend' : 'Unsuspend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDetailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {detailsUser && (
              <>
                <View style={styles.detailsHeader}>
                  <View style={[
                    styles.detailsAvatar,
                    { borderColor: detailsUser.is_suspended === 1 ? '#D85A30' : '#1D9E75' }
                  ]}>
                    <Ionicons
                      name={detailsUser.type === 'student' ? 'person' : 'book'}
                      size={32}
                      color={detailsUser.is_suspended === 1 ? '#D85A30' : '#1D9E75'}
                    />
                  </View>
                  <View>
                    <Text style={styles.detailsName}>
                      {detailsUser.name} {detailsUser.surname}
                    </Text>
                    <View style={[
                      styles.statusPill,
                      { backgroundColor: detailsUser.is_suspended === 1 ? '#D85A30' : '#1D9E75' }
                    ]}>
                      <Text style={styles.statusPillText}>
                        {detailsUser.is_suspended === 1 ? 'Suspended' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsInfo}>
                  {detailsUser.type === 'student' && (
                    <>
                      <Text style={styles.detailRow}>
                        <Text style={styles.detailKey}>Reg: </Text>
                        {detailsUser.reg_number}
                      </Text>
                      <Text style={styles.detailRow}>
                        <Text style={styles.detailKey}>Program: </Text>
                        {detailsUser.program}
                      </Text>
                    </>
                  )}
                  {detailsUser.type === 'lecturer' && (
                    <>
                      <Text style={styles.detailRow}>
                        <Text style={styles.detailKey}>Email: </Text>
                        {detailsUser.email}
                      </Text>
                      <Text style={styles.detailRow}>
                        <Text style={styles.detailKey}>Department: </Text>
                        {detailsUser.department}
                      </Text>
                    </>
                  )}
                  <Text style={styles.detailRow}>
                    <Text style={styles.detailKey}>Phone: </Text>
                    {detailsUser.phone || 'Not provided'}
                  </Text>
                  {detailsUser.is_suspended === 1 && detailsUser.suspend_reason && (
                    <View style={styles.suspendReasonBox}>
                      <Ionicons name="ban-outline" size={16} color="#D85A30" />
                      <Text style={styles.suspendReasonDetail}>
                        Suspended because: {detailsUser.suspend_reason}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

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
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#534AB7',
    backgroundColor: '#0a1a2e',
  },
  tabActive: {
    backgroundColor: '#534AB7',
  },
  tabText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  hint: {
    color: '#7a9cc4',
    fontSize: 12,
    marginBottom: 14,
    textAlign: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  userCard: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suspendedCard: {
    borderColor: '#D85A30',
    opacity: 0.85,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userReg: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  userProgram: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  suspendReason: {
    fontSize: 11,
    color: '#D85A30',
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 16,
  },
  reasonList: {
    maxHeight: 250,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#534AB7',
    backgroundColor: '#0a1a2e',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2a0e',
  },
  reasonRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioSelected: {
    borderColor: '#FFD700',
  },
  reasonRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  reasonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  otherInput: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
    minHeight: 70,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#534AB7',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#a0c4ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  detailsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  detailsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsInfo: {
    backgroundColor: '#0a1a2e',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    fontSize: 14,
    color: '#a0c4ff',
  },
  detailKey: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  suspendReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#3d1a0a',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  suspendReasonDetail: {
    color: '#D85A30',
    fontSize: 13,
    flex: 1,
  },
  closeBtn: {
    backgroundColor: '#534AB7',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});