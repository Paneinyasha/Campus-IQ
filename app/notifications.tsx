import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userType, setUserType] = useState('');

  useEffect(() => {
    loadUserType();
    setupNotifications();
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUserType = async () => {
    try {
      const student = await AsyncStorage.getItem('current_student');
      if (student) { setUserType('student'); return; }
      const lecturer = await AsyncStorage.getItem('current_lecturer');
      if (lecturer) { setUserType('lecturer'); return; }
      const admin = await AsyncStorage.getItem('current_admin');
      if (admin) { setUserType('admin'); }
    } catch (e) {}
  };

  const setupNotifications = () => {
    try {
      const existing = db.getAllSync(`SELECT * FROM notifications`);
      if (existing.length === 0) {
        db.execSync(`
          INSERT INTO notifications (title, message, target, type) VALUES
          ('Welcome to Campus IQ', 'Welcome to the official MSU Campus IQ app. Stay connected with your campus!', 'all', 'info'),
          ('Timetable Available', 'The semester timetable has been published. Check your schedule now.', 'students', 'academic'),
          ('Attendance Reminder', 'Remember to maintain at least 75% attendance to sit for exams.', 'students', 'warning'),
          ('Campus IQ Update', 'New features have been added to Campus IQ. Explore your dashboard!', 'all', 'info');
        `);
      }
    } catch (e) {}
  };

  const loadNotifications = () => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM notifications ORDER BY created_at DESC`
      );
      setNotifications(result);
    } catch (e) {}
  };

  const markAsRead = (id: number) => {
    try {
      db.runSync(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
      loadNotifications();
    } catch (e) {}
  };

  const markAllRead = () => {
    try {
      db.runSync(`UPDATE notifications SET is_read = 1`);
      loadNotifications();
    } catch (e) {}
  };

  const deleteNotification = (id: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync(`DELETE FROM notifications WHERE id = ?`, [id]);
              loadNotifications();
            } catch (e) {}
          }
        }
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return 'school-outline';
      case 'warning': return 'warning-outline';
      case 'info': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return '#534AB7';
      case 'warning': return '#D85A30';
      case 'info': return '#1D9E75';
      default: return '#a0c4ff';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toDateString();
  };

  const unreadCount = notifications.filter((n: any) => n.is_read === 0).length;

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={16} color="#a0c4ff" />
        <Text style={styles.infoText}>
          Notifications refresh every 5 seconds. New broadcasts appear automatically.
        </Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-off-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You are all caught up!</Text>
        </View>
      ) : (
        notifications.map((notif: any) => (
          <TouchableOpacity
            key={notif.id}
            style={[
              styles.notifCard,
              notif.is_read === 0 && styles.unreadCard,
              { borderLeftColor: getTypeColor(notif.type) }
            ]}
            onPress={() => markAsRead(notif.id)}
            onLongPress={() => deleteNotification(notif.id)}
          >
            <View style={styles.notifLeft}>
              <View style={[
                styles.iconCircle,
                { backgroundColor: getTypeColor(notif.type) + '22' }
              ]}>
                <Ionicons
                  name={getTypeIcon(notif.type) as any}
                  size={22}
                  color={getTypeColor(notif.type)}
                />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {notif.is_read === 0 && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>
                  {notif.message}
                </Text>
                <View style={styles.notifMeta}>
                  <Text style={styles.notifDate}>{formatDate(notif.created_at)}</Text>
                  <View style={[
                    styles.targetBadge,
                    { backgroundColor: getTypeColor(notif.type) + '22' }
                  ]}>
                    <Text style={[
                      styles.targetText,
                      { color: getTypeColor(notif.type) }
                    ]}>
                      {notif.target}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.hintBox}>
        <Ionicons name="hand-left-outline" size={16} color="#7a9cc4" />
        <Text style={styles.hintText}>
          Tap to mark as read. Long press to delete.
        </Text>
      </View>

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
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badge: {
    backgroundColor: '#D85A30',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllText: {
    color: '#a0c4ff',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: '#a0c4ff',
    fontSize: 12,
    flex: 1,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
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
  notifCard: {
    backgroundColor: '#0a2a4a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  unreadCard: {
    backgroundColor: '#0a1a3a',
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#1a3a5a',
  },
  notifLeft: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D9E75',
  },
  notifMessage: {
    fontSize: 13,
    color: '#a0c4ff',
    lineHeight: 20,
    marginBottom: 8,
  },
  notifMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifDate: {
    fontSize: 11,
    color: '#7a9cc4',
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  targetText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  hintText: {
    color: '#7a9cc4',
    fontSize: 12,
  },
});