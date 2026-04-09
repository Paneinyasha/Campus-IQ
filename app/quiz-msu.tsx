import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MSU_QUESTIONS = [
  {
    question: 'In what year was Midlands State University officially established?',
    options: ['1995', '1997', '1999', '2001'],
    answer: '1999',
  },
  {
    question: 'What was MSU originally called before becoming a university?',
    options: ['Gweru Polytechnic', 'Gweru Teachers College', 'Midlands College', 'Zimbabwe Teachers College'],
    answer: 'Gweru Teachers College',
  },
  {
    question: 'In which city is the MSU main campus located?',
    options: ['Harare', 'Bulawayo', 'Gweru', 'Mutare'],
    answer: 'Gweru',
  },
  {
    question: 'Which of these is NOT an MSU campus?',
    options: ['Telone', 'Batanai', 'Zvishavane', 'Chinhoyi'],
    answer: 'Chinhoyi',
  },
  {
    question: 'What is the MSU vision statement about?',
    options: ['Being a research university', 'Being a leading innovative world class university', 'Producing engineers', 'Serving Midlands province only'],
    answer: 'Being a leading innovative world class university',
  },
  {
    question: 'Which of these is a core value of MSU?',
    options: ['Competition', 'Ubuntu/Unhu', 'Profit', 'Exclusivity'],
    answer: 'Ubuntu/Unhu',
  },
  {
    question: 'When did MSU officially open its doors to students?',
    options: ['1999', '2000', '2001', '2002'],
    answer: '2000',
  },
  {
    question: 'How many campuses does MSU have across Zimbabwe?',
    options: ['3', '4', '5', '6'],
    answer: '5',
  },
  {
    question: 'What does MSU stand for?',
    options: ['Midlands State University', 'Midlands Science University', 'Midlands Studies University', 'Modern State University'],
    answer: 'Midlands State University',
  },
  {
    question: 'Which MSU campus is located in Harare?',
    options: ['Telone', 'Batanai', 'Harare Campus', 'All of the above'],
    answer: 'All of the above',
  },
];

export default function QuizMSU() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
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

  const startQuiz = () => {
    const shuffled = [...MSU_QUESTIONS].sort(() => Math.random() - 0.5);
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
          <Text style={styles.title}>MSU Quiz</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="school" size={70} color="#FFD700" />
          <Text style={styles.infoTitle}>MSU Knowledge Quiz</Text>
          <Text style={styles.infoText}>
            Test your knowledge about Midlands State University!
          </Text>

          <View style={styles.ruleBox}>
            <View style={styles.ruleRow}>
              <Ionicons name="help-circle-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>{MSU_QUESTIONS.length} questions</Text>
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
          <Text style={styles.title}>Quiz Results</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.resultBox}>
          <Ionicons
            name={passed ? 'trophy' : 'sad-outline'}
            size={70}
            color={passed ? '#FFD700' : '#D85A30'}
          />
          <Text style={styles.resultTitle}>
            {passed ? 'Well Done!' : 'Keep Trying!'}
          </Text>
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

        <TouchableOpacity style={styles.retryBtn} onPress={startQuiz}>
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
            'Are you sure you want to quit? Your progress will be lost.',
            [
              { text: 'Continue Quiz', style: 'cancel' },
              { text: 'Quit', style: 'destructive', onPress: () => { clearInterval(timerRef.current); router.back(); } }
            ]
          )}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>MSU Quiz</Text>
        <View style={[
          styles.timerBadge,
          { backgroundColor: timeLeft < 30 ? '#D85A30' : '#0a3d2e' }
        ]}>
          <Ionicons name="time-outline" size={16} color="#FFD700" />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>
          Question {current + 1} of {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${((current + 1) / questions.length) * 100}%` }
          ]} />
        </View>
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>
          {questions[current]?.question}
        </Text>
      </View>

      <View style={styles.optionsBox}>
        {questions[current]?.options.map((option: string, i: number) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.optionBtn,
              selected === option && styles.optionSelected
            ]}
            onPress={() => handleAnswer(option)}
          >
            <View style={[
              styles.optionLetter,
              selected === option && styles.optionLetterSelected
            ]}>
              <Text style={styles.optionLetterText}>
                {['A', 'B', 'C', 'D'][i]}
              </Text>
            </View>
            <Text style={[
              styles.optionText,
              selected === option && styles.optionTextSelected
            ]}>
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
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
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
    paddingTop: 20,
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
    marginBottom: 30,
    paddingHorizontal: 20,
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
    backgroundColor: '#1D9E75',
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
  progressRow: {
    marginBottom: 20,
  },
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
  nextBtnDisabled: {
    opacity: 0.4,
  },
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