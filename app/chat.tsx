import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

const AVATARS: any = {
  1: { icon: 'paw', color: '#1D9E75' }, 2: { icon: 'fish', color: '#378ADD' },
  3: { icon: 'bug', color: '#D85A30' }, 4: { icon: 'leaf', color: '#639922' },
  5: { icon: 'flower', color: '#ED93B1' }, 6: { icon: 'planet', color: '#534AB7' },
  7: { icon: 'rocket', color: '#EF9F27' }, 8: { icon: 'star', color: '#FFD700' },
  9: { icon: 'moon', color: '#7F77DD' }, 10: { icon: 'sunny', color: '#E24B4A' },
  11: { icon: 'medkit', color: '#F0997B' }, 12: { icon: 'bandage', color: '#5DCAA5' },
  13: { icon: 'desktop', color: '#185FA5' }, 14: { icon: 'phone-portrait', color: '#0F6E56' },
  15: { icon: 'headset', color: '#993556' }, 16: { icon: 'musical-notes', color: '#D85A30' },
  17: { icon: 'football', color: '#639922' }, 18: { icon: 'basketball', color: '#EF9F27' },
  19: { icon: 'book', color: '#534AB7' }, 20: { icon: 'flask', color: '#E24B4A' },
  21: { icon: 'calculator', color: '#378ADD' }, 22: { icon: 'brush', color: '#ED93B1' },
  23: { icon: 'camera', color: '#7F77DD' }, 24: { icon: 'game-controller', color: '#1D9E75' },
};

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadCurrentUser();
    loadMessages();

    const subscription = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        loadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  const loadCurrentUser = async () => {
    const student = await AsyncStorage.getItem('current_student');
    if (student) { setCurrentUser(JSON.parse(student)); setUserType('student'); return; }
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (lecturer) { setCurrentUser(JSON.parse(lecturer)); setUserType('lecturer'); return; }
    const admin = await AsyncStorage.getItem('current_admin');
    if (admin) { setCurrentUser(JSON.parse(admin)); setUserType('admin'); }
  };

  const loadMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const getSenderId = () => {
    if (!currentUser) return '';
    if (userType === 'student') return currentUser.reg_number;
    if (userType === 'lecturer') return currentUser.email;
    return 'admin';
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const badWords = ['spam', 'hate', 'abuse'];
    if (badWords.some(w => newMessage.toLowerCase().includes(w))) {
      Alert.alert('Blocked', 'Message contains inappropriate content'); return;
    }

    let senderName = '', senderReg = '';
    if (userType === 'student') { senderName = `${currentUser.name} ${currentUser.surname}`; senderReg = currentUser.reg_number; }
    else if (userType === 'lecturer') { senderName = `${currentUser.name} ${currentUser.surname}`; senderReg = currentUser.email; }
    else { senderName = 'Campus Admin'; senderReg = 'admin'; }

    await supabase.from('chat_messages').insert({
      sender_name: senderName, sender_reg: senderReg,
      sender_role: userType, avatar_id: currentUser.avatar_id || 1,
      message: newMessage.trim()
    });
    setNewMessage('');
  };

  const deleteMessage = async (id: string, senderReg: string) => {
    if (getSenderId() !== senderReg && userType !== 'admin') {
      Alert.alert('Error', 'You can only delete your own messages'); return;
    }
    Alert.alert('Delete', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('chat_messages').delete().eq('id', id); } }
    ]);
  };

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isMyMessage = (senderReg: string) => getSenderId() === senderReg;
  const getAvatar = (avatarId: number) => AVATARS[avatarId] || AVATARS[1];
  const getRoleColor = (role: string) => role === 'lecturer' ? '#534AB7' : role === 'admin' ? '#D85A30' : '#1D9E75';
  const getRoleLabel = (role: string) => role === 'lecturer' ? 'Lecturer' : role === 'admin' ? 'Admin' : '';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Student Chat</Text>
          <Text style={styles.subtitle}>MSU Campus IQ — Live</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.noticeBanner}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#FFD700" />
        <Text style={styles.noticeText}>Moderated chat — Be respectful</Text>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>Be the first to say something!</Text>
          </View>
        ) : (
          messages.map((msg: any) => {
            const isMine = isMyMessage(msg.sender_reg);
            const avatar = getAvatar(msg.avatar_id || 1);
            const roleColor = getRoleColor(msg.sender_role);
            const roleLabel = getRoleLabel(msg.sender_role);
            return (
              <TouchableOpacity key={msg.id} style={[styles.messageRow, isMine && styles.messageRowRight]} onLongPress={() => deleteMessage(msg.id, msg.sender_reg)}>
                {!isMine && (
                  <View style={[styles.avatarSmall, { borderColor: avatar.color }]}>
                    <Ionicons name={avatar.icon} size={18} color={avatar.color} />
                  </View>
                )}
                <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.theirBubble]}>
                  {!isMine && (
                    <View style={styles.senderRow}>
                      <Text style={[styles.senderName, { color: roleColor }]}>{msg.sender_name}</Text>
                      {roleLabel !== '' && (
                        <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
                          <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {!isMine && <Text style={styles.senderReg}>{msg.sender_reg}</Text>}
                  <Text style={[styles.messageText, isMine && styles.myMessageText]}>{msg.message}</Text>
                  <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>{formatTime(msg.created_at)}</Text>
                </View>
                {isMine && (
                  <View style={[styles.avatarSmall, { borderColor: avatar.color }]}>
                    <Ionicons name={avatar.icon} size={18} color={avatar.color} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="Type a message..." placeholderTextColor="#aaa" value={newMessage} onChangeText={setNewMessage} multiline maxLength={500} />
        <TouchableOpacity style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!newMessage.trim()}>
          <Ionicons name="send" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  backBtn: { padding: 4, marginRight: 12 },
  headerCenter: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#1D9E75' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D9E75' },
  noticeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2a1500', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 10 },
  noticeText: { color: '#FFD700', fontSize: 12, flex: 1 },
  messagesContainer: { flex: 1, paddingHorizontal: 12 },
  messagesContent: { paddingBottom: 10 },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  messageRowRight: { justifyContent: 'flex-end' },
  avatarSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0a2a4a', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 14 },
  myBubble: { backgroundColor: '#1a1650', borderWidth: 1, borderColor: '#534AB7', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderBottomLeftRadius: 4 },
  senderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  senderName: { fontSize: 13, fontWeight: 'bold' },
  rolePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  roleText: { fontSize: 10, fontWeight: 'bold' },
  senderReg: { fontSize: 11, color: '#7a9cc4', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#ffffff', lineHeight: 22 },
  myMessageText: { color: '#ffffff' },
  messageTime: { fontSize: 11, color: '#7a9cc4', marginTop: 4 },
  myMessageTime: { textAlign: 'right', color: '#a0c4ff' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#0a2a4a', backgroundColor: '#001f4d' },
  input: { flex: 1, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#ffffff', maxHeight: 100 },
  sendBtn: { backgroundColor: '#534AB7', width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
