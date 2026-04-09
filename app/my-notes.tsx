import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function MyNotes() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    try {
      const result = db.getAllSync(`SELECT * FROM notes ORDER BY created_at DESC`);
      setNotes(result);
    } catch (e) {}
  };

  const handleSave = () => {
    if (!title || !content) {
      Alert.alert('Missing Fields', 'Please enter a title and content');
      return;
    }

    try {
      if (editingId) {
        db.runSync(
          `UPDATE notes SET title = ?, content = ? WHERE id = ?`,
          [title, content, editingId]
        );
        Alert.alert('Success', 'Note updated!');
      } else {
        db.runSync(
          `INSERT INTO notes (student_id, title, content) VALUES (1, ?, ?)`,
          [title, content]
        );
        Alert.alert('Success', 'Note saved!');
      }
      setTitle('');
      setContent('');
      setEditingId(null);
      setShowForm(false);
      loadNotes();
    } catch (e) {
      Alert.alert('Error', 'Could not save note');
    }
  };

  const handleEdit = (note: any) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync(`DELETE FROM notes WHERE id = ?`, [id]);
              loadNotes();
            } catch (e) {}
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Notes</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setTitle('');
            setContent('');
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Note' : 'New Note'}
          </Text>

          <View style={styles.inputBox}>
            <Ionicons name="create-outline" size={20} color="#1D9E75" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Note title"
              placeholderTextColor="#aaa"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <TextInput
            style={styles.contentInput}
            placeholder="Write your note here..."
            placeholderTextColor="#aaa"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.saveBtnText}>
              {editingId ? 'Update Note' : 'Save Note'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {notes.length === 0 && !showForm ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={60} color="#1D9E75" />
          <Text style={styles.emptyTitle}>No Notes Yet</Text>
          <Text style={styles.emptyText}>
            Tap the + button above to create your first note
          </Text>
        </View>
      ) : (
        notes.map((note: any) => (
          <View key={note.id} style={styles.noteCard}>
            <View style={styles.noteTop}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <View style={styles.noteActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleEdit(note)}
                >
                  <Ionicons name="pencil-outline" size={18} color="#a0c4ff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(note.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#D85A30" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.noteContent} numberOfLines={3}>
              {note.content}
            </Text>
            <Text style={styles.noteDate}>
              {new Date(note.created_at).toDateString()}
            </Text>
          </View>
        ))
      )}

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
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addBtn: {
    padding: 4,
  },
  form: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001f4d',
    borderWidth: 1,
    borderColor: '#1D9E75',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  contentInput: {
    backgroundColor: '#001f4d',
    borderWidth: 1,
    borderColor: '#1D9E75',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 14,
    minHeight: 120,
  },
  saveBtn: {
    backgroundColor: '#1D9E75',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
    paddingHorizontal: 40,
  },
  noteCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  noteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    color: '#a0c4ff',
    lineHeight: 20,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 11,
    color: '#7a9cc4',
  },
});