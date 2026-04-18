import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function MyNotes() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState('');

  useEffect(() => { loadStudent(); }, []);

  const loadStudent = async () => {
    const saved = await AsyncStorage.getItem('current_student');
    if (saved) { const s = JSON.parse(saved); setStudentId(s.id); loadNotes(s.id); }
  };

  const loadNotes = async (sid: string) => {
    const { data } = await supabase.from('notes').select('*').eq('student_id', sid).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const handleSave = async () => {
    if (!title || !content) { Alert.alert('Missing Fields', 'Please enter a title and content'); return; }
    if (editingId) {
      await supabase.from('notes').update({ title, content }).eq('id', editingId);
      Alert.alert('Success', 'Note updated!');
    } else {
      await supabase.from('notes').insert({ student_id: studentId, title, content });
      Alert.alert('Success', 'Note saved!');
    }
    setTitle(''); setContent(''); setEditingId(null); setShowForm(false);
    loadNotes(studentId);
  };

  const handleEdit = (note: any) => { setTitle(note.title); setContent(note.content); setEditingId(note.id); setShowForm(true); };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('notes').delete().eq('id', id); loadNotes(studentId); } }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#ffffff" /></TouchableOpacity>
        <Text style={styles.title}>My Notes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setTitle(''); setContent(''); setEditingId(null); setShowForm(!showForm); }}>
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Note' : 'New Note'}</Text>
          <View style={styles.inputBox}>
            <Ionicons name="create-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Note title" placeholderTextColor="#aaa" value={title} onChangeText={setTitle} />
          </View>
          <TextInput style={styles.contentInput} placeholder="Write your note here..." placeholderTextColor="#aaa" value={content} onChangeText={setContent} multiline numberOfLines={6} textAlignVertical="top" />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.saveBtnText}>{editingId ? 'Update Note' : 'Save Note'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {notes.length === 0 && !showForm ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={60} color="#1D9E75" />
          <Text style={styles.emptyTitle}>No Notes Yet</Text>
          <Text style={styles.emptyText}>Tap the + button above to create your first note</Text>
        </View>
      ) : (
        notes.map((note: any) => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteTop}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.noteActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(note)}><Ionicons name="pencil-outline" size={18} color="#a0c4ff" /></TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(note.id)}><Ionicons name="trash-outline" size={18} color="#D85A30" /></TouchableOpacity>
              </View>
            </View>
            <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
            <Text style={styles.noteDate}>{new Date(note.created_at).toDateString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  addBtn: { padding: 4 },
  form: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#1D9E75', padding: 12, borderRadius: 10, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#ffffff' },
  contentInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#1D9E75', padding: 14, borderRadius: 10, fontSize: 15, color: '#ffffff', marginBottom: 14, minHeight: 120 },
  saveBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  noteCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 14 },
  noteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  noteActions: { flexDirection: 'row', gap: 12 },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  noteContent: { fontSize: 14, color: '#a0c4ff', lineHeight: 20, marginBottom: 8 },
  noteDate: { fontSize: 11, color: '#7a9cc4' },
});
