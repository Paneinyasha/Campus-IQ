import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, AppState, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

export default function QuizSet() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
  const [answers, setAnswers] = useState<any[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warned, setWarned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const timerRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!activeQuiz || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); finishQuiz(answers); return 0; }
        if (prev === 60 && !warned) { Alert.alert('Time Warning', 'Only 1 minute remaining!'); setWarned(true); }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeQuiz, finished]);

  useEffect(() => {
    if (!activeQuiz || finished) return;
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        Alert.alert('Warning', 'Do not leave the app during a quiz!');
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [activeQuiz, finished]);

  const loadData = async () => {
    try {
      setLoading(true);
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        const s = JSON.parse(saved);
        setStudent(s);
        await loadQuizzes();
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('lecturer_quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setQuizzes(data || []);
    } catch (e) {}
  };

  const startQuiz = (quiz: any) => {
    Alert.alert(
      'Start Quiz',
      `You are about to start "${quiz.title}".\n\nOnce started you cannot exit until you finish.\n\nAre you ready?`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Start Now',
          onPress: async () => {
            try {
              const { data: qs, error } = await supabase
                .from('lecturer_quiz_questions')
                .select('*')
                .eq('quiz_id', quiz.id);
              if (error || !qs || qs.length === 0) {
                Alert.alert('No Questions', 'This quiz has no questions yet. Check back later.');
                return;
              }
              setActiveQuiz(quiz);
              setQuestions(qs);
              setTimeLeft(quiz.time_limit * 60);
              setCurrent(0);
              setAnswers([]);
              setSelected('');
              setTextAnswer('');
              setFinished(false);
              setWarned(false);
            } catch (e) {
              Alert.alert('Error', 'Could not load quiz questions');
            }
          },
        },
      ]
    );
  };

  // FIX: Wrap finishQuiz in a retry helper to handle transient network failures
  const withRetry = async (fn: () => Promise<any>, retries = 3, delayMs = 1000): Promise<any> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const isNetwork = err?.message?.toLowerCase().includes('network') ||
          err?.message?.toLowerCase().includes('fetch') ||
          err?.message?.toLowerCase().includes('typeerror');
        if (isNetwork && attempt < retries - 1) {
          await new Promise(res => setTimeout(res, delayMs * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
  };

  const finishQuiz = async (finalAnswers?: any[]) => {
    clearInterval(timerRef.current);
    const ans = finalAnswers || answers;
    const mcqQuestions = questions.filter(q => q.question_type === 'mcq' || !q.question_type);
    const score = ans.filter((a: any, i: number) => {
      const q = questions[i];
      if (!q || q.question_type === 'text') return false;
      return a === q.correct_answer;
    }).length;

    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        const s = JSON.parse(saved);
        await withRetry(() =>
          supabase.from('quiz_results').insert({
            quiz_id: activeQuiz.id,
            student_reg: s.reg_number,
            student_id: s.id,
            score,
            total: mcqQuestions.length,
            answers: JSON.stringify(ans),
          })
        );
      }
    } catch (e) {
      // Still show results even if saving failed
      console.warn('Could not save quiz result:', e);
    }
    setFinished(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNext = () => {
    const q = questions[current];
    const isText = q?.question_type === 'text';
    const answer = isText ? textAnswer : selected;

    if (!answer.trim()) {
      Alert.alert('Answer Required', isText ? 'Please type your answer before continuing' : 'Please select an answer before continuing');
      return;
    }

    const updated = [...answers, answer];
    if (current + 1 >= questions.length) {
      finishQuiz(updated);
    } else {
      setAnswers(updated);
      setCurrent(current + 1);
      setSelected('');
      setTextAnswer('');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="hourglass-outline" size={48} color="#534AB7" />
        <Text style={[styles.empty, { marginTop: 16 }]}>Loading quizzes...</Text>
      </View>
    );
  }

  // Quiz list screen
  if (!activeQuiz) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Quizzes</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {quizzes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="clipboard-outline" size={70} color="#b0bec5" />
              <Text style={styles.emptyTitle}>No Quizzes Available</Text>
              <Text style={styles.empty}>Your lecturers haven't set any quizzes yet.</Text>
              <Text style={styles.empty}>Check back later!</Text>
              <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="#fff" />
                <Text style={styles.goBackBtnText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          ) : (
            quizzes.map((q: any) => (
              <TouchableOpacity key={q.id} style={styles.quizCard} onPress={() => startQuiz(q)}>
                <View style={styles.quizCardLeft}>
                  <Ionicons name="clipboard" size={32} color="#534AB7" />
                </View>
                <View style={styles.quizCardInfo}>
                  <Text style={styles.quizTitle}>{q.title}</Text>
                  <Text style={styles.quizMeta}>{q.subject || q.module} • {q.time_limit} min</Text>
                  {q.total_marks > 0 && <Text style={styles.quizMarks}>{q.total_marks} marks</Text>}
                </View>
                <View style={styles.startBadge}>
                  <Text style={styles.startBadgeText}>Start</Text>
                  <Ionicons name="chevron-forward" size={14} color="#2e7d32" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // Results screen
  if (finished) {
    const mcqQuestions = questions.filter(q => q.question_type === 'mcq' || !q.question_type);
    const score = answers.filter((a: any, i: number) => {
      const q = questions[i];
      if (!q || q.question_type === 'text') return false;
      return a === q.correct_answer;
    }).length;
    const pct = mcqQuestions.length > 0 ? Math.round((score / mcqQuestions.length) * 100) : 0;
    const openCount = questions.filter(q => q.question_type === 'text').length;

    return (
      <View style={styles.container}>
        <View style={styles.resultBox}>
          <Ionicons name="checkmark-circle" size={72} color="#4CAF50" />
          <Text style={styles.resultTitle}>Quiz Complete!</Text>
          {mcqQuestions.length > 0 && (
            <>
              <Text style={styles.resultScore}>{score} / {mcqQuestions.length}</Text>
              <Text style={styles.resultPct}>{pct}%</Text>
            </>
          )}
          {openCount > 0 && (
            <View style={styles.openAnswerNote}>
              <Ionicons name="document-text-outline" size={18} color="#FFD700" />
              <Text style={styles.openAnswerNoteText}>{openCount} open question(s) submitted for lecturer review</Text>
            </View>
          )}
          <Text style={styles.resultMsg}>
            {mcqQuestions.length === 0
              ? 'Your open answers have been submitted!'
              : pct >= 70 ? '🎉 Great work! You passed.' : 'Keep practising — you can do it!'}
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => { setActiveQuiz(null); setFinished(false); loadQuizzes(); }}
          >
            <Text style={styles.doneBtnText}>Back to Quizzes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active quiz screen
  const q = questions[current];
  const isTextQuestion = q?.question_type === 'text';
  const options = !isTextQuestion && q?.options
    ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
    : [];
  const wordCount = textAnswer.trim().split(/\s+/).filter(Boolean).length;
  const maxWords = q?.max_words || 50;
  const wordLimitReached = wordCount >= maxWords;

  return (
    <View style={styles.container}>
      <View style={styles.quizHeader}>
        <Text style={styles.quizHeaderTitle} numberOfLines={1}>{activeQuiz.title}</Text>
        <View style={[styles.timerBadge, timeLeft <= 60 && styles.timerUrgent]}>
          <Ionicons name="time-outline" size={16} color={timeLeft <= 60 ? '#fff' : '#333'} />
          <Text style={[styles.timerText, timeLeft <= 60 && styles.timerTextUrgent]}>{formatTime(timeLeft)}</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>
      <ScrollView contentContainerStyle={styles.questionArea}>
        <View style={styles.questionMeta}>
          <Text style={styles.questionCount}>Question {current + 1} of {questions.length}</Text>
          <View style={[styles.qTypeBadge, isTextQuestion && { backgroundColor: '#fff3e0', borderColor: '#D85A30' }]}>
            <Text style={[styles.qTypeBadgeText, isTextQuestion && { color: '#D85A30' }]}>
              {isTextQuestion ? 'Open Answer' : 'Multiple Choice'}
            </Text>
          </View>
        </View>
        <Text style={styles.questionText}>{q?.question_text || q?.question}</Text>

        {/* MCQ Options */}
        {!isTextQuestion && options.map((opt: string, i: number) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, selected === opt && styles.optionSelected]}
            onPress={() => setSelected(opt)}
          >
            <View style={[styles.optionLabel2, selected === opt && styles.optionLabel2Selected]}>
              <Text style={[styles.optionLabelTxt, selected === opt && { color: '#fff' }]}>
                {['A', 'B', 'C', 'D'][i]}
              </Text>
            </View>
            <Text style={[styles.optionText, selected === opt && styles.optionTextSelected]}>{opt}</Text>
            {selected === opt && <Ionicons name="checkmark-circle" size={20} color="#4a6fa5" />}
          </TouchableOpacity>
        ))}

        {/* Text Answer */}
        {isTextQuestion && (
          <View style={styles.textAnswerBox}>
            <TextInput
              style={[styles.textAnswerInput, wordLimitReached && { borderColor: '#D85A30' }]}
              placeholder="Type your answer here..."
              placeholderTextColor="#999"
              value={textAnswer}
              onChangeText={(text) => {
                const words = text.trim().split(/\s+/).filter(Boolean);
                if (words.length <= maxWords) setTextAnswer(text);
                else Alert.alert('Word Limit', `Maximum ${maxWords} words allowed`);
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.wordCountRow}>
              <Text style={[styles.wordCount, wordLimitReached && { color: '#D85A30' }]}>
                {wordCount} / {maxWords} words
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, (!selected && !textAnswer.trim()) && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected && !textAnswer.trim()}
        >
          <Text style={styles.nextBtnText}>
            {current + 1 === questions.length ? 'Submit Quiz' : 'Next Question'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 60 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e' },
  empty: { textAlign: 'center', color: '#999', fontSize: 14, paddingHorizontal: 40 },
  goBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#534AB7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  goBackBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  quizCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  quizCardLeft: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f0eeff', alignItems: 'center', justifyContent: 'center' },
  quizCardInfo: { flex: 1 },
  quizTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  quizMeta: { fontSize: 13, color: '#666' },
  quizMarks: { fontSize: 12, color: '#534AB7', fontWeight: '600', marginTop: 2 },
  startBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  startBadgeText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  resultBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginTop: 16 },
  resultScore: { fontSize: 52, fontWeight: '900', color: '#4CAF50', marginTop: 8 },
  resultPct: { fontSize: 22, color: '#666', marginBottom: 8 },
  openAnswerNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff8e1', borderRadius: 10, padding: 12, marginVertical: 8 },
  openAnswerNoteText: { fontSize: 13, color: '#333', flex: 1 },
  resultMsg: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  doneBtn: { backgroundColor: '#4a6fa5', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  quizHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', paddingTop: 60 },
  quizHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1, marginRight: 12 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  timerUrgent: { backgroundColor: '#e53935' },
  timerText: { fontSize: 14, fontWeight: '700', color: '#333' },
  timerTextUrgent: { color: '#fff' },
  progressBar: { height: 4, backgroundColor: '#e0e0e0' },
  progressFill: { height: 4, backgroundColor: '#4a6fa5' },
  questionArea: { padding: 20, paddingBottom: 120 },
  questionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  questionCount: { fontSize: 13, color: '#999' },
  qTypeBadge: { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#4a6fa5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  qTypeBadgeText: { fontSize: 11, color: '#4a6fa5', fontWeight: '600' },
  questionText: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', lineHeight: 26, marginBottom: 24 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e0e0', gap: 12 },
  optionSelected: { borderColor: '#4a6fa5', backgroundColor: '#eef2ff' },
  optionLabel2: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  optionLabel2Selected: { borderColor: '#4a6fa5', backgroundColor: '#4a6fa5' },
  optionLabelTxt: { fontSize: 13, fontWeight: 'bold', color: '#999' },
  optionText: { fontSize: 15, color: '#333', flex: 1 },
  optionTextSelected: { color: '#4a6fa5', fontWeight: '600' },
  textAnswerBox: { backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1.5, borderColor: '#e0e0e0' },
  textAnswerInput: { minHeight: 140, padding: 12, fontSize: 15, color: '#1a1a2e', textAlignVertical: 'top' },
  wordCountRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: 8, paddingTop: 4 },
  wordCount: { fontSize: 12, color: '#999', fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  nextBtn: { backgroundColor: '#4a6fa5', borderRadius: 30, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextBtnDisabled: { backgroundColor: '#b0bec5' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
