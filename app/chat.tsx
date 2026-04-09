import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function Chat() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setupChat();
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const setupChat = () => {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_name TEXT NOT NULL,
          sender_reg TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const student = db.getFirstSync(`SELECT * FROM students LIMIT 1`);
      if (student) {
        setCurrentUser(student);
      }
    } catch (e) {}
  };

  const loadMessages = () => {
    try {
      const msgs = db.getAllSync(
        `SELECT * FROM chat_messages ORDER BY created_at ASC`
      );
      setMessages(msgs);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {}
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to chat');
      return;
    }

    const badWords = ['spam', 'hate', 'abuse'];
    const containsBadWord = badWords.some(word =>
      newMessage.toLowerCase().includes(word)
    );

    if (containsBadWord) {
      Alert.alert('Message Blocked', 'Your message contains inappropriate content');
      return;
    }

    try {
      db.runSync(
        `INSERT INTO chat_messages (sender_name, sender_reg, message) VALUES (?, ?, ?)`,
        [
          `${(currentUser as any).name} ${(currentUser as any).surname}`,
          (currentUser as any).reg_number,
          newMessage.trim()
        ]
      );
      setNewMessage('');
      loadMessages();
    } catch (e) {
      Alert.alert('Error', 'Could not send message');
    }
  };

  const deleteMessage = (id: number, senderReg: string) => {
    if (!currentUser || (currentUser as any).reg_number !== senderReg) {
      Alert.alert('Error', 'You can only delete your own messages');
      return;
    }
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync(`DELETE FROM chat_messages WHERE id = ?`, [id]);
              loadMessages();
            } catch (e) {}
          }
        }
      ]
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (senderReg: string) => {
    return currentUser && (currentUser as any).reg_number === senderReg;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Student Chat</Text>
          <Text style={styles.subtitle}>MSU Campus IQ</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.noticeBanner}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#FFD700" />
        <Text style={styles.noticeText}>
          This is a moderated chat. Be respectful to fellow students.
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={60} color="#534AB7" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>Be the first to say something!</Text>
          </View>
        ) : (
          messages.map((msg: any) => (
            <TouchableOpacity
              key={msg.id}
              style={[
                styles.messageBubble,
                isMyMessage(msg.sender_reg) ? styles.myBubble : styles.theirBubble
              ]}
              onLongPress={() => deleteMessage(msg.id, msg.sender_reg)}
            >
              {!isMyMessage(msg.sender_reg) && (
                <Text style={styles.senderName}>{msg.sender_name}</Text>
              )}
              {!isMyMessage(msg.sender_reg) && (
                <Text style={styles.senderReg}>{msg.sender_reg}</Text>
              )}
              <Text style={[
                styles.messageText,
                isMyMessage(msg.sender_reg) && styles.myMessageText
              ]}>
                {msg.message}
              </Text>
              <Text style={[
                styles.messageTime,
                isMyMessage(msg.sender_reg) && styles.myMessageTime
              ]}>
                {formatTime(msg.created_at)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#a0c4ff',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1D9E75',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2a1500',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 10,
  },
  noticeText: {
    color: '#FFD700',
    fontSize: 12,
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingBottom: 10,
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
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  myBubble: {
    backgroundColor: '#1a1650',
    borderWidth: 1,
    borderColor: '#534AB7',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#1D9E75',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1D9E75',
    marginBottom: 2,
  },
  senderReg: {
    fontSize: 11,
    color: '#7a9cc4',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22,
  },
  myMessageText: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 11,
    color: '#7a9cc4',
    marginTop: 4,
    textAlign: 'left',
  },
  myMessageTime: {
    textAlign: 'right',
    color: '#a0c4ff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#0a2a4a',
    backgroundColor: '#001f4d',
  },
  input: {
    flex: 1,
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#ffffff',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#534AB7',
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});