import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState('');
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initChat();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const initChat = async () => {
    await loadUser();
    await loadMessages();
    setupRealtime();
  };

  const setupRealtime = () => {
    channelRef.current = supabase
      .channel(`campus-chat-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
  };

  const loadUser = async () => {
    try {
      const student = await AsyncStorage.getItem('current_student');
      const lecturer = await AsyncStorage.getItem('current_lecturer');
      const admin = await AsyncStorage.getItem('current_admin');
      if (student) {
        const s = JSON.parse(student);
        setCurrentUser(s); setUserType('student');
        try {
          const { data } = await supabase.from('students').select('is_suspended, suspend_reason').eq('id', s.id).maybeSingle();
          if (data?.is_suspended === 1 || data?.is_suspended === true) {
            setIsSuspended(true); setSuspendReason(data?.suspend_reason || 'Contact admin');
          }
        } catch (e) {}
      } else if (lecturer) {
        setCurrentUser(JSON.parse(lecturer)); setUserType('lecturer');
      } else if (admin) {
        setCurrentUser(JSON.parse(admin)); setUserType('admin');
      }
    } catch (e) {}
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) { console.log('loadMessages error:', error.message); return; }
      setMessages(data || []);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
    } catch (e) { console.log('loadMessages exception:', e); }
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !currentUser) return;
    if (isSuspended) {
      Alert.alert('Suspended', `You cannot send messages.\nReason: ${suspendReason}`);
      return;
    }

    setInputText('');

    const senderName = userType === 'admin'
      ? 'Admin'
      : `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() || 'User';
    const senderId = currentUser.id || (userType === 'admin' ? 'admin' : 'user');
    const senderReg = currentUser.reg_number || currentUser.email || senderId;

    // Try payloads from most complete to minimal until one succeeds
    const payloads = [
      { message: text, sender_name: senderName, sender_type: userType, sender_id: senderId, sender_reg: senderReg },
      { message: text, sender_name: senderName, sender_type: userType, sender_id: senderId },
      { message: text, sender_name: senderName, sender_type: userType, sender_reg: senderReg },
      { message: text, sender_name: senderName, sender_type: userType },
      { message: text, sender_name: senderName },
      { message: text },
    ];

    for (const payload of payloads) {
      try {
        const { error } = await supabase.from('chat_messages').insert(payload);
        if (!error) return; // success
        const msg = error.message.toLowerCase();
        // Only retry if it's a column/constraint issue
        if (msg.includes('null') || msg.includes('column') || msg.includes('constraint')) continue;
        // Otherwise it's a real error
        Alert.alert('Send Error', error.message);
        return;
      } catch (e: any) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('network') || msg.includes('fetch')) {
          Alert.alert('Network Error', 'Check your internet connection and try again.');
          return;
        }
        continue;
      }
    }
    Alert.alert('Send Error', 'Could not send message. Please check your connection.');
  };

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };
  const formatDate = (ts: string) => {
    try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return ''; }
  };

  const getField = (item: any, ...keys: string[]) => {
    for (const k of keys) { if (item[k] != null && item[k] !== '') return item[k]; }
    return '';
  };

  const isMe = (msg: any) => {
    if (!currentUser) return false;
    const sid = getField(msg, 'sender_id', 'user_id');
    if (userType === 'admin') return getField(msg, 'sender_type') === 'admin' || sid === 'admin';
    return sid === currentUser.id;
  };

  const getSenderColor = (type: string) =>
    type === 'lecturer' ? '#534AB7' : type === 'admin' ? '#D85A30' : '#1D9E75';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Campus Chat</Text>
          <Text style={styles.headerSub}>Students · Lecturers · Admin</Text>
        </View>
        <TouchableOpacity onPress={loadMessages}>
          <Ionicons name="refresh-outline" size={22} color="#a0c4ff" />
        </TouchableOpacity>
      </View>

      {isSuspended && (
        <View style={styles.suspendedBanner}>
          <Ionicons name="ban" size={18} color="#D85A30" />
          <View style={{ flex: 1 }}>
            <Text style={styles.suspendedTitle}>Account Suspended — Read Only</Text>
            <Text style={styles.suspendedSub}>Reason: {suspendReason}</Text>
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Ionicons name="chatbubbles-outline" size={50} color="#534AB7" />
            <Text style={{ color: '#a0c4ff', fontSize: 14 }}>No messages yet. Be the first!</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDate = !prevMsg || formatDate(item.created_at) !== formatDate(prevMsg.created_at);
          const mine = isMe(item);
          const name = getField(item, 'sender_name', 'name', 'user_name') || 'User';
          const type = getField(item, 'sender_type', 'type') || 'student';
          const text = getField(item, 'message', 'text', 'content') || '';
          return (
            <View>
              {showDate && (
                <View style={styles.dateDivider}>
                  <Text style={styles.dateDividerText}>{formatDate(item.created_at)}</Text>
                </View>
              )}
              <View style={[styles.msgWrap, mine && styles.msgWrapRight]}>
                {!mine && (
                  <View style={[styles.senderDot, { backgroundColor: getSenderColor(type) }]}>
                    <Text style={styles.senderDotText}>{(name[0] || '?').toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                  {!mine && (
                    <Text style={[styles.senderName, { color: getSenderColor(type) }]}>
                      {name}{type !== 'student' ? ` (${type})` : ''}
                    </Text>
                  )}
                  <Text style={styles.msgText}>{text}</Text>
                  <Text style={styles.msgTime}>{formatTime(item.created_at)}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputArea, isSuspended && { backgroundColor: '#1a0a0a' }]}>
          {isSuspended ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
              <Ionicons name="ban" size={18} color="#D85A30" />
              <Text style={{ color: '#D85A30', fontSize: 14, fontStyle: 'italic' }}>Messaging disabled — account suspended</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor="#aaa"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001029' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a1a2e', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2a3a5a' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  headerSub: { fontSize: 11, color: '#a0c4ff' },
  suspendedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#3d1a0a', borderBottomWidth: 1, borderBottomColor: '#D85A30', padding: 12 },
  suspendedTitle: { color: '#D85A30', fontWeight: 'bold', fontSize: 14 },
  suspendedSub: { color: '#ffaaaa', fontSize: 12 },
  messageList: { padding: 16, paddingBottom: 10 },
  dateDivider: { alignItems: 'center', marginVertical: 12 },
  dateDividerText: { color: '#7a9cc4', fontSize: 11, backgroundColor: '#0a1a2e', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 },
  msgWrapRight: { justifyContent: 'flex-end' },
  senderDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  senderDotText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: '#534AB7', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1a3a5a', borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  msgText: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  msgTime: { color: '#a0c4ff', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#0a1a2e', padding: 12, borderTopWidth: 1, borderTopColor: '#1a2a3a' },
  textInput: { flex: 1, backgroundColor: '#001029', borderWidth: 1, borderColor: '#534AB7', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#ffffff', maxHeight: 100 },
  sendBtn: { backgroundColor: '#534AB7', width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});