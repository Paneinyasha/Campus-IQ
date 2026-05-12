import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => { loadUser(); loadNotifications(); }, []);

  const loadUser = async () => {
    const admin = await AsyncStorage.getItem('current_admin');
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    const student = await AsyncStorage.getItem('current_student');
    if (admin) setUserRole('admin');
    else if (lecturer) setUserRole('lecturer');
    else if (student) setUserRole('student');
  };

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { console.log('loadNotifications error:', error.message); return; }
    setNotifications(data || []);

    // Mark all as read
    await supabase.from('notifications').update({ is_read: 1 }).eq('is_read', 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const deleteNotification = async (id: string) => {
    Alert.alert('Delete', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('notifications').delete().eq('id', id);
          setNotifications(prev => prev.filter(n => n.id !== id));
        }
      }
    ]);
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'academic': return '#534AB7';
      case 'warning': return '#D85A30';
      case 'info': return '#1D9E75';
      default: return '#a0c4ff';
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'academic': return 'school-outline';
      case 'warning': return 'warning-outline';
      case 'info': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>You're all caught up! Notifications from admin and lecturers appear here.</Text>
          </View>
        ) : (
          notifications.map((n: any) => (
            <View key={n.id} style={[styles.card, { borderLeftColor: getTypeColor(n.type || 'general') }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: getTypeColor(n.type || 'general') + '22' }]}>
                  <Ionicons name={getTypeIcon(n.type || 'general') as any} size={20} color={getTypeColor(n.type || 'general')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardTarget}>To: {n.target || 'all'}</Text>
                    <Text style={styles.cardDate}>{formatDate(n.created_at)}</Text>
                  </View>
                </View>
                {(userRole === 'admin') && (
                  <TouchableOpacity onPress={() => deleteNotification(n.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color="#D85A30" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.cardMessage}>{n.message}</Text>
              {n.is_read === 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>New</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001029' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a1a2e', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2a3a5a' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  card: { backgroundColor: '#0a1a2e', borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', flex: 1 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  cardTarget: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  cardDate: { color: '#7a9cc4', fontSize: 11 },
  cardMessage: { color: '#a0c4ff', fontSize: 14, lineHeight: 20 },
  deleteBtn: { padding: 6 },
  unreadBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#D85A30', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});