import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PROGRAM_QUESTIONS: any = {
  'Computer Science': [
    {
      question: 'What does CPU stand for?',
      options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Core Processing Unit'],
      answer: 'Central Processing Unit',
    },
    {
      question: 'Which data structure uses LIFO order?',
      options: ['Queue', 'Stack', 'Array', 'Tree'],
      answer: 'Stack',
    },
    {
      question: 'What does HTML stand for?',
      options: ['Hyper Text Markup Language', 'High Text Machine Language', 'Hyper Transfer Markup Language', 'None of the above'],
      answer: 'Hyper Text Markup Language',
    },
    {
      question: 'Which programming language is known as the mother of all languages?',
      options: ['Java', 'Python', 'C', 'Assembly'],
      answer: 'C',
    },
    {
      question: 'What is the binary representation of the decimal number 10?',
      options: ['1010', '1100', '1001', '0110'],
      answer: '1010',
    },
    {
      question: 'Which sorting algorithm has the best average case time complexity?',
      options: ['Bubble Sort', 'Quick Sort', 'Insertion Sort', 'Selection Sort'],
      answer: 'Quick Sort',
    },
    {
      question: 'What does SQL stand for?',
      options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Structured Question Language'],
      answer: 'Structured Query Language',
    },
    {
      question: 'What is the time complexity of binary search?',
      options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
      answer: 'O(log n)',
    },
    {
      question: 'Which of these is NOT an object-oriented programming language?',
      options: ['Java', 'Python', 'C', 'C++'],
      answer: 'C',
    },
    {
      question: 'What does RAM stand for?',
      options: ['Random Access Memory', 'Read Access Memory', 'Rapid Access Module', 'Random Array Memory'],
      answer: 'Random Access Memory',
    },
  ],
  'Business': [
    {
      question: 'What does GDP stand for?',
      options: ['Gross Domestic Product', 'General Domestic Production', 'Gross Development Plan', 'Global Domestic Product'],
      answer: 'Gross Domestic Product',
    },
    {
      question: 'What is the formula for profit?',
      options: ['Revenue - Expenses', 'Revenue + Expenses', 'Expenses - Revenue', 'Revenue x Expenses'],
      answer: 'Revenue - Expenses',
    },
    {
      question: 'What does SWOT stand for in business analysis?',
      options: ['Strengths Weaknesses Opportunities Threats', 'Sales Workforce Output Targets', 'Strategy Work Operations Tactics', 'None of the above'],
      answer: 'Strengths Weaknesses Opportunities Threats',
    },
    {
      question: 'Which of these is a type of business ownership?',
      options: ['Sole Trader', 'Partnership', 'Limited Company', 'All of the above'],
      answer: 'All of the above',
    },
    {
      question: 'What is marketing?',
      options: ['Selling products', 'Identifying and satisfying customer needs', 'Making products', 'Managing employees'],
      answer: 'Identifying and satisfying customer needs',
    },
  ],
  'Engineering': [
    {
      question: 'What is Ohm\'s Law?',
      options: ['V = IR', 'V = I/R', 'V = I+R', 'V = I-R'],
      answer: 'V = IR',
    },
    {
      question: 'What does CAD stand for?',
      options: ['Computer Aided Design', 'Computer Automated Drawing', 'Central Aided Design', 'Computer Aided Development'],
      answer: 'Computer Aided Design',
    },
    {
      question: 'What is the SI unit of force?',
      options: ['Watt', 'Joule', 'Newton', 'Pascal'],
      answer: 'Newton',
    },
    {
      question: 'What does AC stand for in electrical engineering?',
      options: ['Alternating Current', 'Active Current', 'Alternating Circuit', 'Active Circuit'],
      answer: 'Alternating Current',
    },
    {
      question: 'What is the formula for power?',
      options: ['P = VI', 'P = V/I', 'P = V+I', 'P = V-I'],
      answer: 'P = VI',
    },
  ],
};

const DEFAULT_QUESTIONS = [
  {
    question: 'What is the scientific method?',
    options: ['A way to solve problems using evidence', 'A type of computer program', 'A math formula', 'A historical event'],
    answer: 'A way to solve problems using evidence',
  },
  {
    question: 'What does a thesis statement do in an essay?',
    options: ['Introduces the topic', 'States the main argument', 'Provides evidence', 'Concludes the essay'],
    answer: 'States the main argument',
  },
  {
    question: 'What is critical thinking?',
    options: ['Memorizing facts', 'Analyzing and evaluating information', 'Reading quickly', 'Writing essays'],
    answer: 'Analyzing and evaluating information',
  },
  {
    question: 'What is academic integrity?',
    options: ['Getting good grades', 'Being honest in academic work', 'Studying hard', 'Attending all classes'],
    answer: 'Being honest in academic work',
  },
  {
    question: 'What is peer review?',
    options: ['Reviewing work with friends', 'Expert evaluation of research', 'Student grading', 'Online review'],
    answer: 'Expert evaluation of research',
  },
];

export default function QuizProgram() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [program, setProgram] = useState('');
  const [programInput, setProgramInput] = useState('');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (started && timeLeft > 0 && !finished) {
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
  }, [started, finished]);

  const getQuestionsForProgram = (prog: string) => {
    const key = Object.keys(PROGRAM_QUESTIONS).find(k =>
      prog.toLowerCase().includes(k.toLowerCase())
    );
    return key ? PROGRAM_QUESTIONS[key] : DEFAULT_QUESTIONS;
  };

  const startQuiz = () => {
    if (!programInput.trim()) {
      Alert.alert('Missing Program', 'Please enter your program name');
      return;
    }
    setProgram(programInput);
    const qs = getQuestionsForProgram(programInput);
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setTimeLeft(shuffled.length * 60);
    setStarted(true);
    setCurrent(0);
    setAnswers([]);
    setSelected('');
    setFinished(false);
  };

  const handleAnswer = (option: string) => {
    setSelected(option);
  };

  const handleNext = () => {
    if (!selected) {
      Alert.alert('Please select an answer');
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
    setFinished(true);
    setStarted(false);
  };

  const getScore = () => {
    return answers.filter((a, i) => a === questions[i]?.answer).length;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!started && !finished) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Program Quiz</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="book" size={70} color="#FFD700" />
          <Text style={styles.infoTitle}>Program Knowledge Quiz</Text>
          <Text style={styles.infoText}>
            Test your knowledge in your specific program of study!
          </Text>

          <View style={styles.inputBox}>
            <Ionicons name="school-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your program e.g. Computer Science"
              placeholderTextColor="#aaa"
              value={programInput}
              onChangeText={setProgramInput}
            />
          </View>

          <View style={styles.ruleBox}>
            <View style={styles.ruleRow}>
              <Ionicons name="help-circle-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>Questions based on your program</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="time-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>1 minute per question</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="shuffle-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>Questions are randomized</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>Auto marked after completion</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startQuiz}>
            <Ionicons name="play-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.startBtnText}>Start Quiz</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (finished) {
    const score = getScore();
    const percent = Math.round((score / questions.length) * 100);
    const passed = percent >= 50;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Results</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.resultBox}>
          <Ionicons
            name={passed ? 'trophy' : 'sad-outline'}
            size={70}
            color={passed ? '#FFD700' : '#D85A30'}
          />
          <Text style={styles.resultTitle}>{passed ? 'Well Done!' : 'Keep Studying!'}</Text>
          <Text style={styles.programLabel}>{program}</Text>
          <Text style={styles.scoreText}>{score}/{questions.length}</Text>
          <Text style={styles.percentText}>{percent}%</Text>
          <Text style={[styles.passText, { color: passed ? '#1D9E75' : '#D85A30' }]}>
            {passed ? 'Passed' : 'Failed'}
          </Text>
        </View>

        <Text style={styles.reviewTitle}>Review Answers</Text>
        {questions.map((q, i) => {
          const isCorrect = answers[i] === q.answer;
          return (
            <View key={i} style={[styles.reviewCard, isCorrect ? styles.correctCard : styles.wrongCard]}>
              <Text style={styles.reviewQuestion}>{i + 1}. {q.question}</Text>
              <Text style={styles.reviewYour}>
                Your answer: <Text style={{ color: isCorrect ? '#1D9E75' : '#D85A30' }}>{answers[i] || 'No answer'}</Text>
              </Text>
              {!isCorrect && (
                <Text style={styles.reviewCorrect}>
                  Correct: <Text style={{ color: '#1D9E75' }}>{q.answer}</Text>
                </Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.retryBtn} onPress={() => {
          setFinished(false);
          setStarted(false);
          setProgramInput(program);
        }}>
          <Ionicons name="refresh-outline" size={22} color="#ffffff" />
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
          <Text style={styles.homeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => Alert.alert(
            'Quit Quiz',
            'Are you sure you want to quit?',
            [
              { text: 'Continue', style: 'cancel' },
              { text: 'Quit', style: 'destructive', onPress: () => { clearInterval(timerRef.current); router.back(); } }
            ]
          )}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>{program}</Text>
        <View style={[styles.timerBadge, { backgroundColor: timeLeft < 30 ? '#D85A30' : '#0a3d2e' }]}>
          <Ionicons name="time-outline" size={16} color="#FFD700" />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Question {current + 1} of {questions.length}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>{questions[current]?.question}</Text>
      </View>

      <View style={styles.optionsBox}>
        {questions[current]?.options.map((option: string, i: number) => (
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
          {current + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
        </Text>
        <Ionicons name="arrow-forward" size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
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
  infoBox: {
    alignItems: 'center',
    paddingTop: 10,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#a0c4ff',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    width: '100%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  ruleBox: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 30,
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
  startBtn: {
    backgroundColor: '#534AB7',
    width: '100%',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 18,
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
  programLabel: {
    fontSize: 14,
    color: '#a0c4ff',
    marginTop: 4,
    marginBottom: 4,
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
  retryBtn: {
    backgroundColor: '#534AB7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
    marginTop: 10,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeBtn: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});