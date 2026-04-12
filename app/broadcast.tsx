import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function Broadcast() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [type, setType] = useState('general');
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadSent();
  }, []);

  const loadSent = () => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20`
      );
      setSentNotifications(result);
    } catch (e) {}
  };

  const handleSend = () => {
    if (!title || !message) {
      Alert.alert('Missing Fields', 'Please enter a title and message');
      return;
    }

    Alert.alert(
      'Send Notification',
      `Send "${title}" to ${target === 'all' ? 'everyone' : target === 'students' ? 'all students' : 'all lecturers'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: () => {
            try {
              db.runSync(
                `INSERT INTO notifications (title, message, target, type) VALUES (?, ?, ?, ?)`,
                [title, message, target, type]
              );
              Alert.alert('Success', 'Notification sent successfully!');
              setTitle('');
              setMessage('');
              loadSent();
            } catch (e) {
              Alert.alert('Error', 'Could not send notification');
            }
          }
        }
      ]
    );
  };

  const deleteNotification = (id: number) => {
    Alert.alert(
      'Delete',
      'Delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync(`DELETE FROM notifications WHERE id = ?`, [id]);
              loadSent();
            } catch (e) {}
          }
        }
      ]
    );
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'academic': return '#534AB7';
      case 'warning': return '#D85A30';
      case 'info': return '#1D9E75';
      default: return '#a0c4ff';
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Broadcast</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Send New Notification</Text>

        <View style={styles.inputBox}>
          <Ionicons name="text-outline" size={20} color="#D85A30" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Notification Title"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <TextInput
          style={styles.messageInput}
          placeholder="Write your message here..."
          placeholderTextColor="#aaa"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Send To</Text>
        <View style={styles.targetRow}>
          {['all', 'students', 'lecturers'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.targetBtn, target === t && styles.targetBtnActive]}
              onPress={() => setTarget(t)}
            >
              <Text style={[styles.targetText, target === t && styles.targetTextActive]}>
                {t === 'all' ? 'Everyone' : t === 'students' ? 'Students' : 'Lecturers'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.targetRow}>
          {['general', 'academic', 'warning', 'info'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && { backgroundColor: getTypeColor(t), borderColor: getTypeColor(t) }]}
              onPress={() => setType(t)}
            >
              <Text style={[styles.typeText, type === t && styles.typetextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Ionicons name="send-outline" size={22} color="#ffffff" />
          <Text style={styles.sendBtnText}>Send Notification</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Sent Notifications</Text>

      {sentNotifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-off-outline" size={50} color="#534AB7" />
          <Text style={styles.emptyText}>No notifications sent yet</Text>
        </View>
      ) : (
        sentNotifications.map((n: any) => (
          <View key={n.id} style={[styles.notifCard, { borderLeftColor: getTypeColor(n.type) }]}>
            <View style={styles.notifTop}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <TouchableOpacity onPress={() => deleteNotification(n.id)}>
                <Ionicons name="trash-outline" size={18} color="#D85A30" />
              </TouchableOpacity>
            </View>
            <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
            <View style={styles.notifMeta}>
              <Text style={styles.notifTarget}>To: {n.target}</Text>
              <Text style={styles.notifDate}>{new Date(n.created_at).toDateString()}</Text>
            </View>
          </View>
        ))
      )}

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
  form: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  messageInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#D85A30',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 16,
    minHeight: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a0c4ff',
    marginBottom: 10,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  targetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#534AB7',
    backgroundColor: '#1a1a2e',
  },
  targetBtnActive: {
    backgroundColor: '#534AB7',
  },
  targetText: {
    color: '#a0c4ff',
    fontSize: 13,
  },
  targetTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#534AB7',
    backgroundColor: '#1a1a2e',
  },
  typeText: {
    color: '#a0c4ff',
    fontSize: 12,
  },
  typetextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sendBtn: {
    backgroundColor: '#D85A30',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
    marginTop: 30,
    gap: 10,
  },
  emptyText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  notifCard: {
    backgroundColor: '#0a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  notifMessage: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 8,
  },
  notifMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notifTarget: {
    fontSize: 12,
    color: '#FFD700',
  },
  notifDate: {
    fontSize: 11,
    color: '#7a9cc4',
  },
});