import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        loadNotifications();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: 1 }).eq('id', id);
    loadNotifications();
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: 1 });
    loadNotifications();
  };

  const deleteNotification = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('notifications').delete().eq('id', id); loadNotifications(); } }
    ]);
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

  const unreadCount = notifications.filter((n: any) => n.is_read === 0).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
        </View>
        {unreadCount > 0 && <TouchableOpacity onPress={markAllRead}><Text style={styles.markAllText}>Mark all read</Text></TouchableOpacity>}
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="wifi-outline" size={16} color="#1D9E75" />
        <Text style={styles.infoText}>Live notifications — updates appear instantly</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="notifications-off-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>You are all caught up!</Text>
        </View>
      ) : (
        notifications.map((notif: any) => (
          <TouchableOpacity key={notif.id}
            style={[styles.notifCard, notif.is_read === 0 && styles.unreadCard, { borderLeftColor: getTypeColor(notif.type) }]}
            onPress={() => markAsRead(notif.id)} onLongPress={() => deleteNotification(notif.id)}>
            <View style={styles.notifLeft}>
              <View style={[styles.iconCircle, { backgroundColor: getTypeColor(notif.type) + '22' }]}>
                <Ionicons name={getTypeIcon(notif.type) as any} size={22} color={getTypeColor(notif.type)} />
              </View>
              <View style={styles.notifContent}>
                <View style={styles.notifTitleRow}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  {notif.is_read === 0 && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                <View style={styles.notifMeta}>
                  <Text style={styles.notifDate}>{new Date(notif.created_at).toDateString()}</Text>
                  <View style={[styles.targetBadge, { backgroundColor: getTypeColor(notif.type) + '22' }]}>
                    <Text style={[styles.targetText, { color: getTypeColor(notif.type) }]}>{notif.target}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.hintBox}>
        <Ionicons name="hand-left-outline" size={16} color="#7a9cc4" />
        <Text style={styles.hintText}>Tap to mark as read. Long press to delete.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  badge: { backgroundColor: '#D85A30', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  markAllText: { color: '#a0c4ff', fontSize: 13, textDecorationLine: 'underline' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { color: '#1D9E75', fontSize: 12, flex: 1 },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center' },
  notifCard: { backgroundColor: '#0a2a4a', borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4 },
  unreadCard: { backgroundColor: '#0a1a3a', borderWidth: 1, borderLeftWidth: 4, borderColor: '#1a3a5a' },
  notifLeft: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  notifTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D9E75' },
  notifMessage: { fontSize: 13, color: '#a0c4ff', lineHeight: 20, marginBottom: 8 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifDate: { fontSize: 11, color: '#7a9cc4' },
  targetBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  targetText: { fontSize: 11, fontWeight: 'bold' },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10, marginBottom: 40 },
  hintText: { color: '#7a9cc4', fontSize: 12 },
});
