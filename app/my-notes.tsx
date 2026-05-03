import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Modal, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function MyNotes() {
  const router = useRouter();
  const [userType, setUserType] = useState('');
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [lecturerDocs, setLecturerDocs] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'personal' | 'course' | 'upload'>('personal');
  const [showForm, setShowForm] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Doc upload fields
  const [docTitle, setDocTitle] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docCourse, setDocCourse] = useState('');
  const [docFile, setDocFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Lecturer class picker
  const [lecturerClasses, setLecturerClasses] = useState<any[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);

  // Student enroll
  const [newCourse, setNewCourse] = useState('');

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const student = await AsyncStorage.getItem('current_student');
    const lecturer = await AsyncStorage.getItem('current_lecturer');
    if (student) {
      const s = JSON.parse(student);
      setUser(s); setUserType('student');
      loadNotes(s.id);
      loadEnrolledCourses(s.id);
    } else if (lecturer) {
      const l = JSON.parse(lecturer);
      setUser(l); setUserType('lecturer');
      loadLecturerDocs(l.id);
      loadLecturerClasses(l.id);
    }
  };

  const loadNotes = async (sid: string) => {
    const { data } = await supabase.from('notes').select('*').eq('student_id', sid).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const loadEnrolledCourses = async (sid: string) => {
    const { data } = await supabase.from('enrollments').select('course_name').eq('student_id', sid);
    const courses = (data || []).map((e: any) => e.course_name);
    setEnrolledCourses(courses);
    if (courses.length > 0) loadCourseDocs(courses);
  };

  const loadCourseDocs = async (courses: string[]) => {
    const { data } = await supabase
      .from('lecturer_docs')
      .select('*')
      .in('course_name', courses)
      .order('created_at', { ascending: false });
    setLecturerDocs(data || []);
  };

  const loadLecturerDocs = async (lecturerId: string) => {
    const { data } = await supabase
      .from('lecturer_docs')
      .select('*')
      .eq('lecturer_id', lecturerId)
      .order('created_at', { ascending: false });
    setLecturerDocs(data || []);
  };

  const loadLecturerClasses = async (lecturerId: string) => {
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, class_code')
      .eq('lecturer_id', lecturerId)
      .order('class_name');
    setLecturerClasses(data || []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  };

  const handleSaveNote = async () => {
    if (!title || !content) { Alert.alert('Missing', 'Please enter title and content'); return; }
    if (editingId) {
      await supabase.from('notes').update({ title, content, updated_at: new Date().toISOString() }).eq('id', editingId);
    } else {
      await supabase.from('notes').insert({ student_id: user.id, title, content });
    }
    setTitle(''); setContent(''); setEditingId(null); setShowForm(false);
    loadNotes(user.id);
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert('Delete Note', 'Delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('notes').delete().eq('id', id); loadNotes(user.id); } }
    ]);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) setDocFile(result.assets[0]);
    } catch (e) { Alert.alert('Error', 'Could not pick document'); }
  };

  const uploadDoc = async () => {
    if (!docTitle || !docCourse) { Alert.alert('Missing', 'Title and class selection are required'); return; }
    setUploading(true);
    try {
      let fileUrl = '';
      let fileName = '';
      let fileType = '';

      if (docFile) {
        const fileExt = docFile.name.split('.').pop();
        fileName = docFile.name;
        fileType = docFile.mimeType || 'application/octet-stream';
        const filePath = `lecturer-docs/${user.id}/${Date.now()}.${fileExt}`;
        const base64 = await FileSystem.readAsStringAsync(docFile.uri, { encoding: FileSystem.EncodingType.Base64 });
        const { error: uploadError } = await supabase.storage.from('campus-iq').upload(filePath, decode(base64), { contentType: fileType });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('campus-iq').getPublicUrl(filePath);
          fileUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('lecturer_docs').insert({
        lecturer_id: user.id,
        lecturer_name: `${user.name} ${user.surname}`,
        title: docTitle,
        description: docDesc,
        course_name: docCourse,
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
      });

      if (error) throw error;
      Alert.alert('Uploaded!', 'Document uploaded successfully! Students enrolled in this course can see it.');
      setDocTitle(''); setDocDesc(''); setDocCourse(''); setDocFile(null);
      loadLecturerDocs(user.id);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not upload document');
    } finally { setUploading(false); }
  };

  const deleteDoc = (doc: any) => {
    Alert.alert('Delete Document', `Delete "${doc.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('lecturer_docs').delete().eq('id', doc.id);
          loadLecturerDocs(user.id);
        }
      }
    ]);
  };

  const enrollInCourse = async () => {
    if (!newCourse.trim()) { Alert.alert('Missing', 'Enter course name'); return; }
    const { error } = await supabase.from('enrollments').insert({
      student_id: user.id,
      course_name: newCourse.trim(),
      lecturer_id: '00000000-0000-0000-0000-000000000000',
    });
    if (error && error.code !== '23505') { Alert.alert('Error', error.message); return; }
    Alert.alert('Enrolled!', `You are now enrolled in ${newCourse}`);
    setNewCourse('');
    setShowEnrollModal(false);
    loadEnrolledCourses(user.id);
  };

  const unenroll = (course: string) => {
    Alert.alert('Unenroll', `Remove ${course} from your courses?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('enrollments').delete().eq('student_id', user.id).eq('course_name', course);
          loadEnrolledCourses(user.id);
        }
      }
    ]);
  };

  const openDoc = (url: string) => {
    if (url) Linking.openURL(url);
    else Alert.alert('No File', 'This document has no file attached');
  };

  const getFileIcon = (type: string) => {
    if (!type) return 'document-outline';
    if (type.includes('pdf')) return 'document-text';
    if (type.includes('word') || type.includes('doc')) return 'document';
    if (type.includes('image')) return 'image';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'grid';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'easel';
    return 'document-outline';
  };

  function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userType === 'lecturer' ? 'Study Materials' : 'Notes & Materials'}</Text>
        {userType === 'student' && activeTab === 'personal' && (
          <TouchableOpacity onPress={() => { setTitle(''); setContent(''); setEditingId(null); setShowForm(!showForm); }}>
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
          </TouchableOpacity>
        )}
        {userType === 'student' && activeTab === 'course' && (
          <TouchableOpacity onPress={() => setShowEnrollModal(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#FFD700" />
          </TouchableOpacity>
        )}
        {userType !== 'student' && <View style={{ width: 24 }} />}
      </View>

      {/* Tabs */}
      {userType === 'student' && (
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'personal' && styles.tabActive]} onPress={() => setActiveTab('personal')}>
            <Ionicons name="create-outline" size={16} color={activeTab === 'personal' ? '#FFD700' : '#a0c4ff'} />
            <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>My Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'course' && styles.tabActive]} onPress={() => setActiveTab('course')}>
            <Ionicons name="library-outline" size={16} color={activeTab === 'course' ? '#FFD700' : '#a0c4ff'} />
            <Text style={[styles.tabText, activeTab === 'course' && styles.tabTextActive]}>Course Docs</Text>
            {lecturerDocs.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{lecturerDocs.length}</Text></View>}
          </TouchableOpacity>
        </View>
      )}

      {userType === 'lecturer' && (
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, activeTab === 'course' && styles.tabActive]} onPress={() => setActiveTab('course')}>
            <Ionicons name="library-outline" size={16} color={activeTab === 'course' ? '#FFD700' : '#a0c4ff'} />
            <Text style={[styles.tabText, activeTab === 'course' && styles.tabTextActive]}>Uploaded Docs ({lecturerDocs.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'upload' && styles.tabActive]} onPress={() => setActiveTab('upload')}>
            <Ionicons name="cloud-upload-outline" size={16} color={activeTab === 'upload' ? '#FFD700' : '#a0c4ff'} />
            <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>Upload New</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
      >
        {/* STUDENT — MY NOTES */}
        {userType === 'student' && activeTab === 'personal' && (
          <>
            {showForm && (
              <View style={styles.form}>
                <Text style={styles.formTitle}>{editingId ? 'Edit Note' : 'New Note'}</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="create-outline" size={18} color="#1D9E75" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Note title" placeholderTextColor="#aaa" value={title} onChangeText={setTitle} />
                </View>
                <TextInput style={styles.contentInput} placeholder="Write your note here..." placeholderTextColor="#aaa" value={content} onChangeText={setContent} multiline numberOfLines={6} textAlignVertical="top" />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveBtnText}>{editingId ? 'Update Note' : 'Save Note'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {notes.length === 0 && !showForm ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={60} color="#1D9E75" />
                <Text style={styles.emptyTitle}>No Notes Yet</Text>
                <Text style={styles.emptyText}>Tap + to write your first note</Text>
              </View>
            ) : (
              notes.map(note => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteTop}>
                    <Text style={styles.noteTitle}>{note.title}</Text>
                    <View style={styles.noteActions}>
                      <TouchableOpacity onPress={() => { setTitle(note.title); setContent(note.content); setEditingId(note.id); setShowForm(true); }}>
                        <Ionicons name="pencil-outline" size={18} color="#a0c4ff" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                        <Ionicons name="trash-outline" size={18} color="#D85A30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.noteContent} numberOfLines={3}>{note.content}</Text>
                  <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
                </View>
              ))
            )}
          </>
        )}

        {/* STUDENT — COURSE DOCS */}
        {userType === 'student' && activeTab === 'course' && (
          <>
            {enrolledCourses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="library-outline" size={60} color="#534AB7" />
                <Text style={styles.emptyTitle}>No Courses Yet</Text>
                <Text style={styles.emptyText}>Tap + to enroll in a course and see lecturer documents</Text>
                <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowEnrollModal(true)}>
                  <Ionicons name="add-circle-outline" size={18} color="#fff" />
                  <Text style={styles.enrollBtnText}>Enroll in Course</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Enrolled Courses</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesRow}>
                  {enrolledCourses.map(course => (
                    <TouchableOpacity key={course} style={styles.courseChip} onLongPress={() => unenroll(course)}>
                      <Ionicons name="book-outline" size={14} color="#1D9E75" />
                      <Text style={styles.courseChipText}>{course}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={styles.addCourseChip} onPress={() => setShowEnrollModal(true)}>
                    <Ionicons name="add" size={16} color="#534AB7" />
                  </TouchableOpacity>
                </ScrollView>
                <Text style={styles.sectionLabel}>Documents from Lecturers</Text>
                {lecturerDocs.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="cloud-outline" size={48} color="#534AB7" />
                    <Text style={styles.emptyText}>No documents uploaded yet for your courses</Text>
                  </View>
                ) : (
                  lecturerDocs.map(doc => (
                    <TouchableOpacity key={doc.id} style={styles.docCard} onPress={() => openDoc(doc.file_url)}>
                      <View style={styles.docIcon}>
                        <Ionicons name={getFileIcon(doc.file_type) as any} size={28} color="#534AB7" />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docTitle}>{doc.title}</Text>
                        <Text style={styles.docCourse}>{doc.course_name}</Text>
                        {doc.description ? <Text style={styles.docDesc} numberOfLines={2}>{doc.description}</Text> : null}
                        <Text style={styles.docMeta}>By {doc.lecturer_name} • {formatDate(doc.created_at)}</Text>
                      </View>
                      <Ionicons name="download-outline" size={22} color="#1D9E75" />
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </>
        )}

        {/* LECTURER — UPLOADED DOCS */}
        {userType === 'lecturer' && activeTab === 'course' && (
          <>
            {lecturerDocs.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="cloud-upload-outline" size={60} color="#534AB7" />
                <Text style={styles.emptyTitle}>No Documents Yet</Text>
                <Text style={styles.emptyText}>Switch to Upload tab to add documents for your students</Text>
              </View>
            ) : (
              lecturerDocs.map(doc => (
                <View key={doc.id} style={styles.docCard}>
                  <View style={styles.docIcon}>
                    <Ionicons name={getFileIcon(doc.file_type) as any} size={28} color="#534AB7" />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docCourse}>{doc.course_name}</Text>
                    {doc.description ? <Text style={styles.docDesc} numberOfLines={2}>{doc.description}</Text> : null}
                    <Text style={styles.docMeta}>{formatDate(doc.created_at)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteDoc(doc)} style={styles.deleteDocBtn}>
                    <Ionicons name="trash-outline" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        )}

        {/* LECTURER — UPLOAD */}
        {userType === 'lecturer' && activeTab === 'upload' && (
          <View style={styles.uploadForm}>
            <Text style={styles.formTitle}>Upload Study Material</Text>

            <View style={styles.inputBox}>
              <Ionicons name="text-outline" size={18} color="#534AB7" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Document Title *" placeholderTextColor="#aaa" value={docTitle} onChangeText={setDocTitle} />
            </View>

            {/* CLASS PICKER — replaces manual course name input */}
            <TouchableOpacity style={styles.classPickerBtn} onPress={() => setShowClassPicker(true)}>
              <Ionicons name="school-outline" size={18} color="#534AB7" style={styles.inputIcon} />
              <Text style={[styles.input, !docCourse && { color: '#aaa' }]}>{docCourse || 'Select your class *'}</Text>
              <Ionicons name="chevron-down" size={18} color="#a0c4ff" />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, styles.descInput]}
              placeholder="Description (optional)"
              placeholderTextColor="#aaa"
              value={docDesc}
              onChangeText={setDocDesc}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
              {docFile ? (
                <View style={styles.filePickerSelected}>
                  <Ionicons name="document-attach" size={24} color="#1D9E75" />
                  <Text style={styles.filePickerSelectedText} numberOfLines={1}>{docFile.name}</Text>
                  <TouchableOpacity onPress={() => setDocFile(null)}>
                    <Ionicons name="close-circle" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.filePickerInner}>
                  <Ionicons name="cloud-upload-outline" size={36} color="#534AB7" />
                  <Text style={styles.filePickerText}>Tap to select a file</Text>
                  <Text style={styles.filePickerSub}>PDF, Word, PowerPoint, Excel, Images</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadBtn, uploading && { opacity: 0.6 }]} onPress={uploadDoc} disabled={uploading}>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>{uploading ? 'Uploading...' : 'Upload Document'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Class Picker Modal for lecturer */}
      <Modal visible={showClassPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Choose which class this document is for</Text>
            {lecturerClasses.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="school-outline" size={50} color="#534AB7" />
                <Text style={styles.emptyText}>No classes created yet. Go to Classroom to create a class first.</Text>
              </View>
            ) : (
              lecturerClasses.map((c: any) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.classOption, docCourse === c.class_name && styles.classOptionActive]}
                  onPress={() => { setDocCourse(c.class_name); setShowClassPicker(false); }}
                >
                  <Ionicons name="school-outline" size={20} color="#1D9E75" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classOptionName}>{c.class_name}</Text>
                    <Text style={styles.classOptionCode}>{c.class_code}</Text>
                  </View>
                  {docCourse === c.class_name && <Ionicons name="checkmark-circle" size={20} color="#1D9E75" />}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>

      {/* Student Enroll Modal */}
      <Modal visible={showEnrollModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enroll in Course</Text>
              <TouchableOpacity onPress={() => setShowEnrollModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Enter the exact course name your lecturer uses when uploading documents</Text>
            <View style={styles.inputBox}>
              <Ionicons name="book-outline" size={18} color="#1D9E75" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="e.g. Database Systems" placeholderTextColor="#aaa" value={newCourse} onChangeText={setNewCourse} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={enrollInCourse}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Enroll</Text>
            </TouchableOpacity>
            {enrolledCourses.length > 0 && (
              <>
                <Text style={styles.modalSub}>Current enrollments (long press to remove):</Text>
                {enrolledCourses.map(c => (
                  <TouchableOpacity key={c} style={styles.enrolledItem} onLongPress={() => { unenroll(c); setShowEnrollModal(false); }}>
                    <Ionicons name="book" size={16} color="#1D9E75" />
                    <Text style={styles.enrolledItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1D9E75' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  tabRow: { flexDirection: 'row', backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#1D9E75' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#a0c4ff', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  badge: { backgroundColor: '#D85A30', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  form: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#1D9E75', padding: 12, borderRadius: 10, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#fff' },
  contentInput: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#1D9E75', padding: 14, borderRadius: 10, fontSize: 14, color: '#fff', marginBottom: 14, minHeight: 120 },
  descInput: { marginBottom: 14, minHeight: 80, backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', padding: 12, borderRadius: 10, color: '#fff' },
  saveBtn: { backgroundColor: '#1D9E75', padding: 14, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#534AB7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  enrollBtnText: { color: '#fff', fontWeight: 'bold' },
  noteCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 12 },
  noteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1 },
  noteActions: { flexDirection: 'row', gap: 12 },
  noteContent: { fontSize: 14, color: '#a0c4ff', lineHeight: 20, marginBottom: 8 },
  noteDate: { fontSize: 11, color: '#7a9cc4' },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', marginBottom: 10, letterSpacing: 1 },
  coursesRow: { marginBottom: 16 },
  courseChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  courseChipText: { color: '#1D9E75', fontSize: 13, fontWeight: '600' },
  addCourseChip: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  docCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  docIcon: { width: 52, height: 52, borderRadius: 12, backgroundColor: '#1a1650', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#534AB7' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  docCourse: { fontSize: 12, color: '#FFD700', marginBottom: 4 },
  docDesc: { fontSize: 12, color: '#a0c4ff', marginBottom: 4 },
  docMeta: { fontSize: 11, color: '#7a9cc4' },
  deleteDocBtn: { padding: 6 },
  uploadForm: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 16 },
  classPickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 12 },
  filePicker: { backgroundColor: '#001f4d', borderWidth: 2, borderColor: '#534AB7', borderRadius: 12, borderStyle: 'dashed', minHeight: 120, marginBottom: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  filePickerInner: { alignItems: 'center', gap: 8, padding: 20 },
  filePickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  filePickerSelectedText: { color: '#1D9E75', fontSize: 14, flex: 1 },
  filePickerText: { color: '#a0c4ff', fontSize: 14, fontWeight: '600' },
  filePickerSub: { color: '#7a9cc4', fontSize: 12 },
  uploadBtn: { backgroundColor: '#534AB7', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  modalSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 14 },
  classOption: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#001f4d', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#534AB7' },
  classOptionActive: { borderColor: '#1D9E75', backgroundColor: '#0a3d2e' },
  classOptionName: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  classOptionCode: { color: '#FFD700', fontSize: 12, marginTop: 2 },
  enrolledItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#001f4d', borderRadius: 10, padding: 12, marginBottom: 8 },
  enrolledItemText: { color: '#fff', fontSize: 14 },
});