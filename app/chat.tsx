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
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadUser();
    loadMessages();

    subscriptionRef.current = supabase
      .channel('chat-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();

    return () => { if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current); };
  }, []);

  const loadUser = async () => {
    const student = await AsyncStorage.getItem('current_student');
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    const admin = await AsyncStorage.getItem('current_admin');

    if (student) {
      const s = JSON.parse(student);
      setCurrentUser(s);
      setUserType('student');
      // Check suspension status fresh from database
      const { data } = await supabase.from('students').select('is_suspended, suspend_reason').eq('id', s.id).maybeSingle();
      if (data?.is_suspended === 1 || data?.is_suspended === true) {
        setIsSuspended(true);
        setSuspendReason(data?.suspend_reason || 'Contact admin for details');
      }
    } else if (lecturer) {
      const l = JSON.parse(lecturer);
      setCurrentUser(l);
      setUserType('lecturer');
    } else if (admin) {
      setCurrentUser(JSON.parse(admin));
      setUserType('admin');
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(100);
    setMessages(data || []);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    if (isSuspended) {
      Alert.alert('Account Suspended', `You cannot send messages while suspended.\n\nReason: ${suspendReason}\n\nContact admin to resolve.`);
      return;
    }

    const senderName = userType === 'student'
      ? `${currentUser.name} ${currentUser.surname || ''}`.trim()
      : userType === 'lecturer'
        ? `Dr. ${currentUser.name} ${currentUser.surname || ''}`.trim()
        : 'Admin';

    const { error } = await supabase.from('chat_messages').insert({
      sender_id: currentUser.id || 'admin',
      sender_name: senderName,
      sender_type: userType,
      message: inputText.trim(),
    });

    if (error) { Alert.alert('Error', error.message); return; }
    setInputText('');
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  const isMe = (msg: any) => {
    if (!currentUser) return false;
    return msg.sender_id === currentUser.id || (userType === 'admin' && msg.sender_id === 'admin');
  };

  const getSenderColor = (type: string) => type === 'lecturer' ? '#534AB7' : type === 'admin' ? '#D85A30' : '#1D9E75';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Campus Chat</Text>
          <Text style={styles.headerSub}>Students · Lecturers · Admin</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Suspended warning */}
      {isSuspended && (
        <View style={styles.suspendedBanner}>
          <Ionicons name="ban" size={18} color="#D85A30" />
          <View style={{ flex: 1 }}>
            <Text style={styles.suspendedTitle}>Account Suspended</Text>
            <Text style={styles.suspendedSub}>You can read messages but cannot send. Reason: {suspendReason}</Text>
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id?.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item, index }) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDate = !prevMsg || formatDate(item.created_at) !== formatDate(prevMsg.created_at);
          const mine = isMe(item);
          return (
            <View>
              {showDate && (
                <View style={styles.dateDivider}>
                  <Text style={styles.dateDividerText}>{formatDate(item.created_at)}</Text>
                </View>
              )}
              <View style={[styles.msgWrap, mine && styles.msgWrapRight]}>
                {!mine && (
                  <View style={[styles.senderDot, { backgroundColor: getSenderColor(item.sender_type) }]}>
                    <Text style={styles.senderDotText}>{(item.sender_name || '?')[0].toUpperCase()}</Text>
                  </View>
                )}
                <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                  {!mine && <Text style={[styles.senderName, { color: getSenderColor(item.sender_type) }]}>{item.sender_name} {item.sender_type !== 'student' ? `(${item.sender_type})` : ''}</Text>}
                  <Text style={styles.msgText}>{item.message}</Text>
                  <Text style={styles.msgTime}>{formatTime(item.created_at)}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputArea, isSuspended && styles.inputAreaSuspended]}>
          {isSuspended ? (
            <View style={styles.suspendedInputBox}>
              <Ionicons name="ban" size={18} color="#D85A30" />
              <Text style={styles.suspendedInputText}>Messaging disabled — account suspended</Text>
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
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} onPress={sendMessage} disabled={!inputText.trim()}>
                <Ionicons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', textAlign: 'center' },
  headerSub: { fontSize: 11, color: '#a0c4ff', textAlign: 'center' },
  suspendedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#3d1a0a', borderBottomWidth: 1, borderBottomColor: '#D85A30', padding: 12 },
  suspendedTitle: { color: '#D85A30', fontWeight: 'bold', fontSize: 14 },
  suspendedSub: { color: '#ffaaaa', fontSize: 12, marginTop: 2 },
  messageList: { padding: 16, paddingBottom: 10 },
  dateDivider: { alignItems: 'center', marginVertical: 12 },
  dateDividerText: { color: '#7a9cc4', fontSize: 11, backgroundColor: '#0a2a4a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
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
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: '#0a2a4a', padding: 12, borderTopWidth: 1, borderTopColor: '#1a3a5a' },
  inputAreaSuspended: { backgroundColor: '#1a0a0a' },
  textInput: { flex: 1, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#ffffff', maxHeight: 100 },
  sendBtn: { backgroundColor: '#534AB7', width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  suspendedInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  suspendedInputText: { color: '#D85A30', fontSize: 14, fontStyle: 'italic' },
});