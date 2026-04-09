import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DYK_QUESTIONS = [
  {
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    answer: 'Mars',
    fact: 'Mars appears red because of iron oxide (rust) on its surface!',
  },
  {
    question: 'How many bones are in the adult human body?',
    options: ['196', '206', '216', '226'],
    answer: '206',
    fact: 'Babies are born with around 270 bones, but many fuse together as we grow!',
  },
  {
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    answer: 'Pacific',
    fact: 'The Pacific Ocean covers more than 30% of the Earth\'s surface!',
  },
  {
    question: 'Which country has the most natural lakes?',
    options: ['Russia', 'USA', 'Canada', 'Brazil'],
    answer: 'Canada',
    fact: 'Canada has over 60% of the world\'s natural lakes!',
  },
  {
    question: 'What is the speed of light?',
    options: ['299,792 km/s', '199,792 km/s', '399,792 km/s', '499,792 km/s'],
    answer: '299,792 km/s',
    fact: 'Light takes about 8 minutes to travel from the Sun to Earth!',
  },
  {
    question: 'Which animal has the longest lifespan?',
    options: ['Elephant', 'Tortoise', 'Whale', 'Parrot'],
    answer: 'Tortoise',
    fact: 'Some tortoises have lived for over 250 years!',
  },
  {
    question: 'What percentage of the Earth is covered by water?',
    options: ['51%', '61%', '71%', '81%'],
    answer: '71%',
    fact: 'Despite all that water, only 3% of it is fresh water!',
  },
  {
    question: 'Which gas do plants absorb from the atmosphere?',
    options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
    answer: 'Carbon Dioxide',
    fact: 'Plants use CO2, water and sunlight to make food through photosynthesis!',
  },
  {
    question: 'How many continents are there on Earth?',
    options: ['5', '6', '7', '8'],
    answer: '7',
    fact: 'The 7 continents are Africa, Antarctica, Asia, Australia, Europe, North America and South America!',
  },
  {
    question: 'What is the hardest natural substance on Earth?',
    options: ['Gold', 'Iron', 'Diamond', 'Quartz'],
    answer: 'Diamond',
    fact: 'Diamonds are made of carbon atoms arranged in a crystal structure!',
  },
  {
    question: 'Which country is the largest in the world by area?',
    options: ['China', 'USA', 'Canada', 'Russia'],
    answer: 'Russia',
    fact: 'Russia spans 11 time zones and covers about 17 million square kilometers!',
  },
  {
    question: 'How many chambers does the human heart have?',
    options: ['2', '3', '4', '5'],
    answer: '4',
    fact: 'The heart beats about 100,000 times every single day!',
  },
  {
    question: 'What is the tallest mountain in the world?',
    options: ['K2', 'Kilimanjaro', 'Mont Blanc', 'Mount Everest'],
    answer: 'Mount Everest',
    fact: 'Mount Everest grows about 4mm taller every year due to tectonic movement!',
  },
  {
    question: 'Which element has the chemical symbol Au?',
    options: ['Silver', 'Gold', 'Aluminum', 'Argon'],
    answer: 'Gold',
    fact: 'Au comes from the Latin word Aurum meaning gold!',
  },
  {
    question: 'How many languages are spoken in Africa?',
    options: ['Over 500', 'Over 1000', 'Over 2000', 'Over 3000'],
    answer: 'Over 2000',
    fact: 'Africa is the most linguistically diverse continent on Earth!',
  },
];

export default function QuizDidYouKnow() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showFact, setShowFact] = useState(false);
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
    const shuffled = [...DYK_QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    setQuestions(shuffled);
    setTimeLeft(shuffled.length * 60);
    setStarted(true);
    setCurrent(0);
    setAnswers([]);
    setSelected('');
    setFinished(false);
    setShowFact(false);
  };

  const handleAnswer = (option: string) => {
    setSelected(option);
    setShowFact(true);
  };

  const handleNext = () => {
    if (!selected) {
      Alert.alert('Please select an answer');
      return;
    }

    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected('');
    setShowFact(false);

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
          <Text style={styles.title}>Did You Know</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="globe" size={70} color="#FFD700" />
          <Text style={styles.infoTitle}>Global Facts Quiz</Text>
          <Text style={styles.infoText}>
            Discover amazing facts about our world while testing your knowledge!
          </Text>

          <View style={styles.ruleBox}>
            <View style={styles.ruleRow}>
              <Ionicons name="help-circle-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>10 random questions</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="time-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>1 minute per question</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="bulb-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>Learn a fun fact after each answer</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons name="shuffle-outline" size={20} color="#a0c4ff" />
              <Text style={styles.ruleText}>Questions are randomized</Text>
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
          <Text style={styles.resultTitle}>
            {passed ? 'Amazing!' : 'Keep Learning!'}
          </Text>
          <Text style={styles.scoreText}>{score}/{questions.length}</Text>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>

        <Text style={styles.reviewTitle}>Facts You Learned</Text>

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
              <View style={styles.factBox}>
                <Ionicons name="bulb-outline" size={16} color="#FFD700" />
                <Text style={styles.factText}>{q.fact}</Text>
              </View>
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
            'Are you sure you want to quit?',
            [
              { text: 'Continue', style: 'cancel' },
              {
                text: 'Quit', style: 'destructive', onPress: () => {
                  clearInterval(timerRef.current);
                  router.back();
                }
              }
            ]
          )}
        >
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Did You Know</Text>
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
              selected === option && option === questions[current]?.answer && styles.optionCorrect,
              selected === option && option !== questions[current]?.answer && styles.optionWrong,
              selected && selected !== option && option === questions[current]?.answer && styles.optionCorrect,
            ]}
            onPress={() => !selected && handleAnswer(option)}
            disabled={!!selected}
          >
            <View style={styles.optionLetter}>
              <Text style={styles.optionLetterText}>
                {['A', 'B', 'C', 'D'][i]}
              </Text>
            </View>
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showFact && (
        <View style={styles.factBanner}>
          <Ionicons name="bulb" size={20} color="#FFD700" />
          <Text style={styles.factBannerText}>
            {questions[current]?.fact}
          </Text>
        </View>
      )}

      {selected !== '' && (
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {current + 1 === questions.length ? 'See Results' : 'Next Question'}
          </Text>
          <Ionicons name="arrow-forward" size={22} color="#ffffff" />
        </TouchableOpacity>
      )}
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
    gap: 10,
    marginBottom: 16,
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
  optionCorrect: {
    backgroundColor: '#0a3d2e',
    borderColor: '#1D9E75',
  },
  optionWrong: {
    backgroundColor: '#3d1a0a',
    borderColor: '#D85A30',
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
  factBanner: {
    backgroundColor: '#2a1500',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  factBannerText: {
    color: '#FFD700',
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
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
    marginBottom: 6,
  },
  factBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#2a1500',
    padding: 10,
    borderRadius: 8,
  },
  factText: {
    color: '#FFD700',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
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