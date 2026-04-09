import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function QuizSet() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warned, setWarned] = useState(false);
  const timerRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    setupQuizTables();
    loadQuizzes();
  }, []);

  useEffect(() => {
    if (activeQuiz && !finished) {
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (
          appStateRef.current === 'active' &&
          nextState.match(/inactive|background/)
        ) {
          if (!warned) {
            setWarned(true);
            Alert.alert(
              'Warning!',
              'You left the quiz! This has been recorded. Please return immediately.',
              [{ text: 'Return to Quiz' }]
            );
          } else {
            Alert.alert(
              'Quiz Terminated',
              'You left the quiz more than once. Your quiz has been submitted.',
              [{ text: 'OK', onPress: () => finishQuiz() }]
            );
          }
        }
        appStateRef.current = nextState;
      });
      return () => subscription.remove();
    }
  }, [activeQuiz, finished, warned]);

  useEffect(() => {
    if (activeQuiz && timeLeft > 0 && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeQuiz, finished]);

  const setupQuizTables = () => {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS lecturer_quizzes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          module TEXT NOT NULL,
          time_limit INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lecturer_quiz_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          question TEXT NOT NULL,
          option_a TEXT NOT NULL,
          option_b TEXT NOT NULL,
          option_c TEXT NOT NULL,
          option_d TEXT NOT NULL,
          correct_answer TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quiz_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quiz_id INTEGER NOT NULL,
          student_reg TEXT NOT NULL,
          score INTEGER NOT NULL,
          total INTEGER NOT NULL,
          completed_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const existing = db.getAllSync(`SELECT * FROM lecturer_quizzes`);
      if (existing.length === 0) {
        db.execSync(`
          INSERT INTO lecturer_quizzes (title, module, time_limit) VALUES
          ('Introduction to Programming Test', 'Computer Science 101', 30),
          ('Business Ethics Quiz', 'Business Management 201', 20);

          INSERT INTO lecturer_quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES
          (1, 'What is a variable in programming?', 'A fixed value', 'A storage location', 'A function', 'A loop', 'A storage location'),
          (1, 'What does if-else do in code?', 'Loops through data', 'Makes decisions', 'Defines functions', 'Imports libraries', 'Makes decisions'),
          (1, 'Which symbol is used for comments in Python?', '//', '#', '/*', '--', '#'),
          (1, 'What is a function?', 'A variable type', 'A reusable block of code', 'A data structure', 'A loop', 'A reusable block of code'),
          (1, 'What does print() do in Python?', 'Prints to paper', 'Displays output', 'Saves a file', 'Deletes data', 'Displays output'),
          (2, 'What is business ethics?', 'Making profit', 'Moral principles in business', 'Marketing strategy', 'Financial planning', 'Moral principles in business'),
          (2, 'What is corporate social responsibility?', 'Company profits', 'Business contributing to society', 'Employee benefits', 'Tax avoidance', 'Business contributing to society'),
          (2, 'What is a stakeholder?', 'A shareholder only', 'Anyone affected by business decisions', 'Only employees', 'Only customers', 'Anyone affected by business decisions'),
          (2, 'What is insider trading?', 'Legal trading', 'Using private info for stock trading', 'Normal business', 'Employee trading', 'Using private info for stock trading'),
          (2, 'What does transparency mean in business?', 'Being secretive', 'Being open and honest', 'Making profit', 'Cutting costs', 'Being open and honest');
        `);
      }
    } catch (e) {}
  };

  const loadQuizzes = () => {
    try {
      const result = db.getAllSync(`SELECT * FROM lecturer_quizzes ORDER BY created_at DESC`);
      setQuizzes(result);
    } catch (e) {}
  };

  const startQuiz = (quiz: any) => {
    Alert.alert(
      'Start Quiz',
      `You are about to start "${quiz.title}". Once started you cannot exit the app until you finish. Are you ready?`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Start Now',
          onPress: () => {
            const qs = db.getAllSync(
              `SELECT * FROM lecturer_quiz_questions WHERE quiz_id = ?`,
              [quiz.id]
            );
            if (qs.length === 0) {
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
          }
        }
      ]
    );
  };

  const handleAnswer = (option: string) => {
    setSelected(option);
  };

  const handleNext = () => {
    if (!selected) {
      Alert.alert('Please select an answer before continuing');
      return;
    }
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected('');
    if (current + 1 >= questions.length) {
      clearInterval(timerRef.current);
      finishQuiz(newAnswers);
    } else {
      setCurrent(current + 1);
    }
  };

  const finishQuiz = (finalAnswers?: string[]) => {
    clearInterval(timerRef.current);
    const ans = finalAnswers || answers;
    const score = ans.filter((a, i) => a === (questions[i] as any)?.correct_answer).length;

    try {
      const student = db.getFirstSync(`SELECT * FROM students LIMIT 1`);
      if (student) {
        db.runSync(
          `INSERT INTO quiz_results (quiz_id, student_reg, score, total) VALUES (?, ?, ?, ?)`,
          [(activeQuiz as any).id, (student as any).reg_number, score, questions.length]
        );
      }
    } catch (e) {}

    setFinished(true);
  };

  const getScore = () => {
    return answers.filter((a, i) => a === (questions[i] as any)?.correct_answer).length;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (finished && activeQuiz) {
    const score = getScore();
    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= 50;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            setActiveQuiz(null);
            setFinished(false);
            router.back();
          }}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Quiz Results</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.resultBox}>
          <Ionicons
            name={passed ? 'trophy' : 'sad-outline'}
            size={70}
            color={passed ? '#FFD700' : '#D85A30'}
          />
          <Text style={styles.resultTitle}>{passed ? 'Well Done!' : 'Keep Studying!'}</Text>
          <Text style={styles.quizLabel}>{(activeQuiz as any).title}</Text>
          <Text style={styles.scoreText}>{score}/{questions.length}</Text>
          <Text style={styles.percentText}>{percent}%</Text>
          <Text style={[styles.passText, { color: passed ? '#1D9E75' : '#D85A30' }]}>
            {passed ? 'Passed' : 'Failed'}
          </Text>
        </View>

        <Text style={styles.reviewTitle}>Review Answers</Text>
        {questions.map((q: any, i: number) => {
          const isCorrect = answers[i] === q.correct_answer;
          return (
            <View key={i} style={[styles.reviewCard, isCorrect ? styles.correctCard : styles.wrongCard]}>
              <Text style={styles.reviewQuestion}>{i + 1}. {q.question}</Text>
              <Text style={styles.reviewYour}>
                Your answer: <Text style={{ color: isCorrect ? '#1D9E75' : '#D85A30' }}>{answers[i] || 'No answer'}</Text>
              </Text>
              {!isCorrect && (
                <Text style={styles.reviewCorrect}>
                  Correct: <Text style={{ color: '#1D9E75' }}>{q.correct_answer}</Text>
                </Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.homeBtn} onPress={() => {
          setActiveQuiz(null);
          setFinished(false);
          router.back();
        }}>
          <Ionicons name="home-outline" size={22} color="#ffffff" />
          <Text style={styles.homeBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>

      </ScrollView>
    );
  }

  if (activeQuiz && !finished) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={20} color="#D85A30" />
          </View>
          <Text style={styles.title} numberOfLines={1}>{(activeQuiz as any).title}</Text>
          <View style={[
            styles.timerBadge,
            { backgroundColor: timeLeft < 60 ? '#D85A30' : '#0a3d2e' }
          ]}>
            <Ionicons name="time-outline" size={16} color="#FFD700" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        {warned && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={16} color="#FFD700" />
            <Text style={styles.warningText}>
              Warning: Do not leave this screen again or your quiz will be submitted!
            </Text>
          </View>
        )}

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Question {current + 1} of {questions.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.questionBox}>
          <Text style={styles.questionText}>{(questions[current] as any)?.question}</Text>
        </View>

        <View style={styles.optionsBox}>
          {[
            (questions[current] as any)?.option_a,
            (questions[current] as any)?.option_b,
            (questions[current] as any)?.option_c,
            (questions[current] as any)?.option_d,
          ].map((option: string, i: number) => (
            <TouchableOpacity
              key={i}
              style={[styles.optionBtn, selected === option && styles.optionSelected]}
              onPress={() => handleAnswer(option)}
            >
              <View style={[styles.optionLetter, selected === option && styles.optionLetterSelected]}>
                <Text style={styles.optionLetterText}>{['A', 'B', 'C', 'D'][i]}</Text>
              </View>
              <Text style={[styles.optionText, selected === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!selected}
        >
          <Text style={styles.nextBtnText}>
            {current + 1 === questions.length ? 'Submit Quiz' : 'Next Question'}
          </Text>
          <Ionicons name="arrow-forward" size={22} color="#ffffff" />
        </TouchableOpacity>

      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Lecturer Quizzes</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.noticeBanner}>
        <Ionicons name="warning-outline" size={18} color="#FFD700" />
        <Text style={styles.noticeText}>
          Once you start a lecturer quiz you cannot exit the app until you finish!
        </Text>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="clipboard-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Quizzes Yet</Text>
          <Text style={styles.emptyText}>
            Your lecturers have not set any quizzes yet
          </Text>
        </View>
      ) : (
        quizzes.map((quiz: any) => (
          <View key={quiz.id} style={styles.quizCard}>
            <View style={styles.quizTop}>
              <View style={styles.quizIconBox}>
                <Ionicons name="clipboard" size={28} color="#534AB7" />
              </View>
              <View style={styles.quizInfo}>
                <Text style={styles.quizTitle}>{quiz.title}</Text>
                <Text style={styles.quizModule}>{quiz.module}</Text>
                <View style={styles.quizMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#a0c4ff" />
                    <Text style={styles.metaText}>{quiz.time_limit} minutes</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="lock-closed-outline" size={14} color="#D85A30" />
                    <Text style={[styles.metaText, { color: '#D85A30' }]}>No exit allowed</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => startQuiz(quiz)}
            >
              <Ionicons name="play-circle-outline" size={22} color="#ffffff" />
              <Text style={styles.startBtnText}>Start Quiz</Text>
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  lockIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  timerText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    color: '#FFD700',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3d1a0a',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  warningText: {
    color: '#FFD700',
    fontSize: 12,
    flex: 1,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
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
  quizCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  quizTop: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  quizIconBox: {
    backgroundColor: '#1a1650',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
  },
  quizInfo: { flex: 1 },
  quizTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  quizModule: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#a0c4ff',
    fontSize: 12,
  },
  startBtn: {
    backgroundColor: '#534AB7',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressRow: { marginBottom: 20 },
  progressLabel: {
    color: '#a0c4ff',
    fontSize: 13,
    marginBottom: 6,
  },
  progressBar: {
    backgroundColor: '#0a2a4a',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#FFD700',
    height: 6,
    borderRadius: 3,
  },
  questionBox: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#ffffff',
    lineHeight: 26,
    fontWeight: '500',
  },
  optionsBox: {
    gap: 12,
    marginBottom: 24,
  },
  optionBtn: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionSelected: {
    backgroundColor: '#1a1650',
    borderColor: '#FFD700',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1650',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
  },
  optionLetterSelected: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  optionLetterText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 15,
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: '#534AB7',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultBox: {
    alignItems: 'center',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  quizLabel: {
    fontSize: 14,
    color: '#a0c4ff',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
  },
  percentText: {
    fontSize: 22,
    color: '#a0c4ff',
    marginTop: 4,
  },
  passText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
    letterSpacing: 1,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  correctCard: {
    backgroundColor: '#0a3d2e',
    borderColor: '#1D9E75',
  },
  wrongCard: {
    backgroundColor: '#3d1a0a',
    borderColor: '#D85A30',
  },
  reviewQuestion: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 6,
    fontWeight: '500',
  },
  reviewYour: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 2,
  },
  reviewCorrect: {
    fontSize: 13,
    color: '#a0c4ff',
  },
  homeBtn: {
    backgroundColor: '#534AB7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
    marginTop: 10,
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});