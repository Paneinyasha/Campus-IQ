import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

export default function QuizSet() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warned, setWarned] = useState(false);
  const timerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => { loadQuizzes(); }, []);

  useEffect(() => {
    if (!activeQuiz || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); finishQuiz(); return 0; }
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

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('lecturer_quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setQuizzes(data || []);
    } catch (e) {}
  };

  const startQuiz = (quiz) => {
    Alert.alert(
      'Start Quiz',
      `You are about to start "${quiz.title}". Once started you cannot exit the app until you finish. Are you ready?`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Start Now',
          onPress: async () => {
            const { data: qs, error } = await supabase
              .from('lecturer_quiz_questions')
              .select('*')
              .eq('quiz_id', quiz.id);
            if (error || !qs || qs.length === 0) {
              Alert.alert('No Questions', 'This quiz has no questions yet');
              return;
            }
            setActiveQuiz(quiz);
            setQuestions(qs);
            setTimeLeft(quiz.time_limit * 60);
            setCurrent(0);
            setAnswers([]);
            setSelected('');
            setFinished(false);
            setWarned(false);
          },
        },
      ]
    );
  };

  const finishQuiz = async (finalAnswers) => {
    clearInterval(timerRef.current);
    const ans = finalAnswers || answers;
    const score = ans.filter((a, i) => a === questions[i]?.correct_answer).length;
    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        const student = JSON.parse(saved);
        await supabase.from('quiz_results').insert({
          quiz_id: activeQuiz.id,
          student_reg: student.reg_number,
          score,
          total: questions.length,
        });
      }
    } catch (e) {}
    setFinished(true);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return m + ':' + s;
  };

  const handleAnswer = (option) => { setSelected(option); };

  const handleNext = () => {
    const updated = [...answers, selected];
    if (current + 1 >= questions.length) {
      finishQuiz(updated);
    } else {
      setAnswers(updated);
      setCurrent(current + 1);
      setSelected('');
    }
  };

  if (!activeQuiz) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Quizzes</Text>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {quizzes.length === 0 ? (
            <Text style={styles.empty}>No quizzes available right now.</Text>
          ) : (
            quizzes.map(q => (
              <TouchableOpacity key={q.id} style={styles.quizCard} onPress={() => startQuiz(q)}>
                <Text style={styles.quizTitle}>{q.title}</Text>
                <Text style={styles.quizMeta}>{q.subject} · {q.time_limit} min · {q.total_marks} marks</Text>
                <View style={styles.startBadge}>
                  <Text style={styles.startBadgeText}>Tap to Start</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  if (finished) {
    const score = answers.filter((a, i) => a === questions[i]?.correct_answer).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <View style={styles.container}>
        <View style={styles.resultBox}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          <Text style={styles.resultTitle}>Quiz Complete!</Text>
          <Text style={styles.resultScore}>{score} / {questions.length}</Text>
          <Text style={styles.resultPct}>{pct}%</Text>
          <Text style={styles.resultMsg}>
            {pct >= 70 ? 'Great work! You passed.' : 'Keep practising — you can do it!'}
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

  const q = questions[current];
  const options = q?.options
    ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options)
    : [];

  return (
    <View style={styles.container}>
      <View style={styles.quizHeader}>
        <Text style={styles.quizHeaderTitle} numberOfLines={1}>{activeQuiz.title}</Text>
        <View style={[styles.timerBadge, timeLeft <= 60 && styles.timerUrgent]}>
          <Ionicons name="time-outline" size={16} color={timeLeft <= 60 ? '#fff' : '#333'} />
          <Text style={[styles.timerText, timeLeft <= 60 && styles.timerTextUrgent]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: ((current + 1) / questions.length * 100) + '%' }]} />
      </View>
      <ScrollView contentContainerStyle={styles.questionArea}>
        <Text style={styles.questionCount}>Question {current + 1} of {questions.length}</Text>
        <Text style={styles.questionText}>{q?.question_text}</Text>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, selected === opt && styles.optionSelected]}
            onPress={() => handleAnswer(opt)}
          >
            <View style={[styles.optionDot, selected === opt && styles.optionDotSelected]} />
            <Text style={[styles.optionText, selected === opt && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected}
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
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
  quizCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quizTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  quizMeta: { fontSize: 13, color: '#666', marginBottom: 10 },
  startBadge: {
    alignSelf: 'flex-start', backgroundColor: '#e8f5e9',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  startBadgeText: { fontSize: 12, color: '#2e7d32', fontWeight: '600' },
  resultBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginTop: 16 },
  resultScore: { fontSize: 48, fontWeight: '900', color: '#4CAF50', marginTop: 8 },
  resultPct: { fontSize: 22, color: '#666', marginBottom: 8 },
  resultMsg: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 32 },
  doneBtn: { backgroundColor: '#4a6fa5', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  quizHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  quizHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', flex: 1, marginRight: 12 },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4,
  },
  timerUrgent: { backgroundColor: '#e53935' },
  timerText: { fontSize: 14, fontWeight: '700', color: '#333' },
  timerTextUrgent: { color: '#fff' },
  progressBar: { height: 4, backgroundColor: '#e0e0e0' },
  progressFill: { height: 4, backgroundColor: '#4a6fa5' },
  questionArea: { padding: 20, paddingBottom: 120 },
  questionCount: { fontSize: 13, color: '#999', marginBottom: 8 },
  questionText: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', lineHeight: 26, marginBottom: 24 },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#e0e0e0',
  },
  optionSelected: { borderColor: '#4a6fa5', backgroundColor: '#eef2ff' },
  optionDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', marginRight: 12 },
  optionDotSelected: { borderColor: '#4a6fa5', backgroundColor: '#4a6fa5' },
  optionText: { fontSize: 15, color: '#333', flex: 1 },
  optionTextSelected: { color: '#4a6fa5', fontWeight: '600' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee',
  },
  nextBtn: {
    backgroundColor: '#4a6fa5', borderRadius: 30, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  nextBtnDisabled: { backgroundColor: '#b0bec5' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
