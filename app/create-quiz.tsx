import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function CreateQuiz() {
  const router = useRouter();
  const [lecturer, setLecturer] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [myQuizzes, setMyQuizzes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // Question form
  const [questionType, setQuestionType] = useState<'mcq' | 'text'>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [maxWords, setMaxWords] = useState('50');

  useEffect(() => { loadLecturer(); }, []);

  const loadLecturer = async () => {
    const saved = await AsyncStorage.getItem('current_lecturer');
    if (saved) {
      const l = JSON.parse(saved);
      setLecturer(l);
      loadMyQuizzes(l.id);
    }
  };

  const loadMyQuizzes = async (lecturerId: string) => {
    const { data } = await supabase
      .from('lecturer_quizzes')
      .select('*, lecturer_quiz_questions(count)')
      .eq('lecturer_id', lecturerId)
      .order('created_at', { ascending: false });
    setMyQuizzes(data || []);
  };

  const resetQuestionForm = () => {
    setQuestionText(''); setOptionA(''); setOptionB('');
    setOptionC(''); setOptionD(''); setCorrectAnswer('');
    setMaxWords('50'); setQuestionType('mcq');
    setShowQuestionForm(false);
  };

  const resetAll = () => {
    setTitle(''); setSubject(''); setTimeLimit('30');
    setQuestions([]); setEditingQuizId(null);
    resetQuestionForm();
  };

  const addQuestion = () => {
    if (!questionText.trim()) { Alert.alert('Missing', 'Please enter the question text'); return; }
    if (questionType === 'mcq') {
      if (!optionA || !optionB || !optionC || !optionD) { Alert.alert('Missing', 'Please fill in all 4 options'); return; }
      if (!correctAnswer) { Alert.alert('Missing', 'Please select the correct answer (A, B, C or D)'); return; }
      const answerMap: any = { A: optionA, B: optionB, C: optionC, D: optionD };
      const correctFull = answerMap[correctAnswer.toUpperCase()];
      if (!correctFull) { Alert.alert('Invalid', 'Correct answer must be A, B, C or D'); return; }
      setQuestions(prev => [...prev, {
        question_type: 'mcq',
        question_text: questionText,
        options: [optionA, optionB, optionC, optionD],
        correct_answer: correctFull,
        option_a: optionA, option_b: optionB, option_c: optionC, option_d: optionD,
      }]);
    } else {
      setQuestions(prev => [...prev, {
        question_type: 'text',
        question_text: questionText,
        options: null,
        correct_answer: null,
        max_words: parseInt(maxWords) || 50,
      }]);
    }
    resetQuestionForm();
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const saveQuiz = async () => {
    if (!title.trim() || !subject.trim()) { Alert.alert('Missing', 'Please enter quiz title and subject'); return; }
    if (questions.length < 1) { Alert.alert('No Questions', 'Please add at least one question'); return; }
    if (!lecturer?.id) { Alert.alert('Error', 'Lecturer session not found. Please log out and back in.'); return; }

    try {
      const mcqCount = questions.filter(q => q.question_type === 'mcq').length;
      let quizId = editingQuizId;

      if (editingQuizId) {
        // Update existing quiz
        const { error } = await supabase.from('lecturer_quizzes').update({
          title: title.trim(),
          subject: subject.trim(),
          module: subject.trim(),
          time_limit: parseInt(timeLimit) || 30,
          total_marks: mcqCount,
        }).eq('id', editingQuizId);
        if (error) throw new Error('Failed to update quiz: ' + error.message);
        // Delete old questions
        await supabase.from('lecturer_quiz_questions').delete().eq('quiz_id', editingQuizId);
      } else {
        // Create new quiz
        const { data: newQuiz, error: quizError } = await supabase
          .from('lecturer_quizzes')
          .insert({
            title: title.trim(),
            subject: subject.trim(),
            module: subject.trim(),
            time_limit: parseInt(timeLimit) || 30,
            total_marks: mcqCount,
            lecturer_id: lecturer.id,
          })
          .select('id')
          .single();
        if (quizError || !newQuiz) throw new Error('Failed to create quiz: ' + (quizError?.message || 'Unknown error'));
        quizId = newQuiz.id;
      }

      // Save questions
      const questionsToSave = questions.map(q => ({
        quiz_id: quizId,
        question_type: q.question_type,
        question_text: q.question_text,
        question: q.question_text,
        options: q.options ? JSON.stringify(q.options) : null,
        option_a: q.option_a || null,
        option_b: q.option_b || null,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_answer: q.correct_answer || null,
        max_words: q.max_words || null,
      }));

      const { error: qsError } = await supabase.from('lecturer_quiz_questions').insert(questionsToSave);
      if (qsError) throw new Error('Failed to save questions: ' + qsError.message);

      Alert.alert('✅ Success!', editingQuizId ? 'Quiz updated successfully!' : `Quiz "${title}" created with ${questions.length} question(s)!`, [
        { text: 'OK', onPress: () => { resetAll(); loadMyQuizzes(lecturer.id); setActiveTab('manage'); } }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save quiz');
    }
  };

  const editQuiz = async (quiz: any) => {
    setEditingQuizId(quiz.id);
    setTitle(quiz.title);
    setSubject(quiz.subject || quiz.module || '');
    setTimeLimit(String(quiz.time_limit || 30));
    // Load questions
    const { data: qs } = await supabase.from('lecturer_quiz_questions').select('*').eq('quiz_id', quiz.id);
    if (qs) {
      setQuestions(qs.map(q => ({
        question_type: q.question_type || 'mcq',
        question_text: q.question_text || q.question,
        options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
        correct_answer: q.correct_answer,
        option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d,
        max_words: q.max_words,
      })));
    }
    setActiveTab('create');
  };

  const deleteQuiz = (quiz: any) => {
    Alert.alert('Delete Quiz', `Delete "${quiz.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await supabase.from('lecturer_quiz_questions').delete().eq('quiz_id', quiz.id);
        await supabase.from('quiz_results').delete().eq('quiz_id', quiz.id);
        await supabase.from('lecturer_quizzes').delete().eq('id', quiz.id);
        loadMyQuizzes(lecturer.id);
        Alert.alert('Deleted', 'Quiz deleted successfully');
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingQuizId ? 'Edit Quiz' : 'Quiz Manager'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'create' && styles.tabActive]} onPress={() => setActiveTab('create')}>
          <Ionicons name="add-circle-outline" size={18} color={activeTab === 'create' ? '#fff' : '#a0c4ff'} />
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            {editingQuizId ? 'Edit Quiz' : 'Create Quiz'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'manage' && styles.tabActive]} onPress={() => { setActiveTab('manage'); if (lecturer) loadMyQuizzes(lecturer.id); }}>
          <Ionicons name="list-outline" size={18} color={activeTab === 'manage' ? '#fff' : '#a0c4ff'} />
          <Text style={[styles.tabText, activeTab === 'manage' && styles.tabTextActive]}>My Quizzes ({myQuizzes.length})</Text>
        </TouchableOpacity>
      </View>

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
          {editingQuizId && (
            <View style={styles.editingBanner}>
              <Ionicons name="pencil" size={16} color="#FFD700" />
              <Text style={styles.editingBannerText}>Editing existing quiz — save to update</Text>
              <TouchableOpacity onPress={resetAll}>
                <Text style={styles.editingBannerCancel}>Cancel Edit</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz Details</Text>
            <View style={styles.inputBox}>
              <Ionicons name="clipboard-outline" size={18} color="#534AB7" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Quiz Title" placeholderTextColor="#aaa" value={title} onChangeText={setTitle} />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="book-outline" size={18} color="#534AB7" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Subject / Module" placeholderTextColor="#aaa" value={subject} onChangeText={setSubject} />
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="time-outline" size={18} color="#534AB7" style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Time Limit (minutes)" placeholderTextColor="#aaa" keyboardType="numeric" value={timeLimit} onChangeText={setTimeLimit} />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
              {questions.length > 0 && (
                <Text style={styles.sectionBadge}>
                  {questions.filter(q => q.question_type === 'mcq').length} MCQ • {questions.filter(q => q.question_type === 'text').length} Open
                </Text>
              )}
            </View>

            {questions.map((q, i) => (
              <View key={i} style={[styles.questionCard, q.question_type === 'text' && styles.questionCardOpen]}>
                <View style={styles.questionCardTop}>
                  <View style={[styles.typeBadge, q.question_type === 'text' && styles.typeBadgeOpen]}>
                    <Text style={[styles.typeBadgeText, q.question_type === 'text' && styles.typeBadgeTextOpen]}>
                      {q.question_type === 'mcq' ? 'MCQ' : 'OPEN'}
                    </Text>
                  </View>
                  <Text style={styles.questionNum}>Q{i + 1}</Text>
                  <TouchableOpacity onPress={() => removeQuestion(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color="#D85A30" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.questionCardText}>{q.question_text}</Text>
                {q.question_type === 'mcq' && q.options && (
                  <View style={styles.optionsPreview}>
                    {q.options.map((opt: string, j: number) => (
                      <Text key={j} style={[styles.optionPreview, opt === q.correct_answer && styles.optionPreviewCorrect]}>
                        {['A', 'B', 'C', 'D'][j]}. {opt} {opt === q.correct_answer ? '✓' : ''}
                      </Text>
                    ))}
                  </View>
                )}
                {q.question_type === 'text' && (
                  <Text style={styles.maxWordsLabel}>Max words: {q.max_words}</Text>
                )}
              </View>
            ))}

            {showQuestionForm ? (
              <View style={styles.questionForm}>
                <Text style={styles.formTitle}>New Question</Text>
                <View style={styles.typeToggleRow}>
                  <TouchableOpacity style={[styles.typeToggle, questionType === 'mcq' && styles.typeToggleActiveMCQ]} onPress={() => setQuestionType('mcq')}>
                    <Ionicons name="list-outline" size={16} color={questionType === 'mcq' ? '#fff' : '#a0c4ff'} />
                    <Text style={[styles.typeToggleText, questionType === 'mcq' && { color: '#fff' }]}>Multiple Choice</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeToggle, questionType === 'text' && styles.typeToggleActiveOpen]} onPress={() => setQuestionType('text')}>
                    <Ionicons name="create-outline" size={16} color={questionType === 'text' ? '#fff' : '#a0c4ff'} />
                    <Text style={[styles.typeToggleText, questionType === 'text' && { color: '#fff' }]}>Open Answer</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Enter your question..."
                  placeholderTextColor="#aaa"
                  value={questionText}
                  onChangeText={setQuestionText}
                  multiline
                />

                {questionType === 'mcq' && (
                  <>
                    <Text style={styles.formLabel}>Answer Options</Text>
                    {[
                      { label: 'A', value: optionA, set: setOptionA },
                      { label: 'B', value: optionB, set: setOptionB },
                      { label: 'C', value: optionC, set: setOptionC },
                      { label: 'D', value: optionD, set: setOptionD },
                    ].map((opt) => (
                      <View key={opt.label} style={styles.optionInputRow}>
                        <View style={[styles.optionLabel, correctAnswer.toUpperCase() === opt.label && styles.optionLabelCorrect]}>
                          <Text style={styles.optionLabelText}>{opt.label}</Text>
                        </View>
                        <TextInput style={styles.optionInput} placeholder={`Option ${opt.label}`} placeholderTextColor="#aaa" value={opt.value} onChangeText={opt.set} />
                      </View>
                    ))}
                    <Text style={styles.formLabel}>Correct Answer</Text>
                    <View style={styles.correctRow}>
                      {['A', 'B', 'C', 'D'].map(l => (
                        <TouchableOpacity key={l} style={[styles.correctBtn, correctAnswer.toUpperCase() === l && styles.correctBtnActive]} onPress={() => setCorrectAnswer(l)}>
                          <Text style={[styles.correctBtnText, correctAnswer.toUpperCase() === l && { color: '#fff' }]}>{l}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {questionType === 'text' && (
                  <>
                    <Text style={styles.formLabel}>Maximum Words Allowed</Text>
                    <TextInput style={styles.formInput} placeholder="e.g. 50" placeholderTextColor="#aaa" keyboardType="numeric" value={maxWords} onChangeText={setMaxWords} />
                    <Text style={styles.formHint}>Students will type their answer limited to this word count</Text>
                  </>
                )}

                <View style={styles.formBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetQuestionForm}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.addQuestionBtnText}>Add Question</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addQuestionOutlineBtn} onPress={() => setShowQuestionForm(true)}>
                <Ionicons name="add-circle-outline" size={22} color="#534AB7" />
                <Text style={styles.addQuestionOutlineBtnText}>Add New Question</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz}>
            <Ionicons name="save-outline" size={22} color="#fff" />
            <Text style={styles.saveBtnText}>{editingQuizId ? 'Update Quiz' : 'Finish & Save Quiz'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* MANAGE TAB */}
      {activeTab === 'manage' && (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>
          {myQuizzes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="clipboard-outline" size={60} color="#534AB7" />
              <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
              <Text style={styles.emptyText}>Switch to Create Quiz tab to make your first quiz</Text>
            </View>
          ) : (
            myQuizzes.map(quiz => (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={styles.quizCardTop}>
                  <Text style={styles.quizCardTitle}>{quiz.title}</Text>
                  <View style={styles.quizCardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => editQuiz(quiz)}>
                      <Ionicons name="pencil-outline" size={18} color="#FFD700" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteQuiz(quiz)}>
                      <Ionicons name="trash-outline" size={18} color="#D85A30" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.quizCardSub}>{quiz.subject || quiz.module} • {quiz.time_limit} min</Text>
                <View style={styles.quizCardStats}>
                  <View style={styles.quizStat}>
                    <Ionicons name="help-circle-outline" size={14} color="#a0c4ff" />
                    <Text style={styles.quizStatText}>{quiz.total_marks || 0} marks</Text>
                  </View>
                  <View style={styles.quizStat}>
                    <Ionicons name="calendar-outline" size={14} color="#a0c4ff" />
                    <Text style={styles.quizStatText}>{new Date(quiz.created_at).toDateString()}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  tabRow: { flexDirection: 'row', backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#a0c4ff', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  content: { flex: 1, padding: 16 },
  editingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2a1a00', borderWidth: 1, borderColor: '#FFD700', borderRadius: 10, padding: 10, marginBottom: 16 },
  editingBannerText: { color: '#FFD700', fontSize: 13, flex: 1 },
  editingBannerCancel: { color: '#D85A30', fontSize: 13, fontWeight: 'bold' },
  section: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  sectionBadge: { fontSize: 12, color: '#a0c4ff' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#fff' },
  questionCard: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 12, marginBottom: 10 },
  questionCardOpen: { borderColor: '#D85A30' },
  questionCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  typeBadge: { backgroundColor: '#534AB722', borderWidth: 1, borderColor: '#534AB7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeOpen: { backgroundColor: '#D85A3022', borderColor: '#D85A30' },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#534AB7' },
  typeBadgeTextOpen: { color: '#D85A30' },
  questionNum: { fontSize: 13, color: '#a0c4ff', flex: 1 },
  removeBtn: { padding: 4 },
  questionCardText: { fontSize: 14, color: '#fff', marginBottom: 8, lineHeight: 20 },
  optionsPreview: { gap: 4 },
  optionPreview: { fontSize: 12, color: '#a0c4ff', paddingLeft: 8 },
  optionPreviewCorrect: { color: '#1D9E75', fontWeight: 'bold' },
  maxWordsLabel: { fontSize: 12, color: '#D85A30' },
  questionForm: { backgroundColor: '#001f4d', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 12 },
  formTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', marginBottom: 14 },
  typeToggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#0a2a4a' },
  typeToggleActiveMCQ: { backgroundColor: '#534AB7', borderColor: '#534AB7' },
  typeToggleActiveOpen: { backgroundColor: '#D85A30', borderColor: '#D85A30' },
  typeToggleText: { fontSize: 13, color: '#a0c4ff', fontWeight: '600' },
  formInput: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 14 },
  formLabel: { fontSize: 13, color: '#a0c4ff', marginBottom: 8, fontWeight: '600' },
  formHint: { fontSize: 12, color: '#7a9cc4', marginBottom: 14, fontStyle: 'italic' },
  optionInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionLabel: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', alignItems: 'center', justifyContent: 'center' },
  optionLabelCorrect: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  optionLabelText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  optionInput: { flex: 1, backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 10, color: '#fff', fontSize: 14 },
  correctRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  correctBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#534AB7', backgroundColor: '#0a2a4a', alignItems: 'center' },
  correctBtnActive: { backgroundColor: '#1D9E75', borderColor: '#1D9E75' },
  correctBtnText: { fontSize: 16, fontWeight: 'bold', color: '#a0c4ff' },
  formBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#a0c4ff', alignItems: 'center' },
  cancelBtnText: { color: '#a0c4ff', fontWeight: '600' },
  addQuestionBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#534AB7' },
  addQuestionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addQuestionOutlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#534AB7', borderStyle: 'dashed' },
  addQuestionOutlineBtnText: { color: '#534AB7', fontWeight: 'bold', fontSize: 15 },
  saveBtn: { backgroundColor: '#1D9E75', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyBox: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  quizCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, marginBottom: 12 },
  quizCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  quizCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1 },
  quizCardActions: { flexDirection: 'row', gap: 12 },
  editBtn: { padding: 6, backgroundColor: '#2a2000', borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  deleteBtn: { padding: 6, backgroundColor: '#3d0a0a', borderRadius: 8, borderWidth: 1, borderColor: '#D85A30' },
  quizCardSub: { fontSize: 13, color: '#a0c4ff', marginBottom: 10 },
  quizCardStats: { flexDirection: 'row', gap: 16 },
  quizStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quizStatText: { fontSize: 12, color: '#a0c4ff' },
});
