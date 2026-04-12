import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [module, setModule] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');

  const addQuestion = () => {
    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      Alert.alert('Missing Fields', 'Please fill in all question fields');
      return;
    }
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer.toUpperCase())) {
      Alert.alert('Invalid Answer', 'Correct answer must be A, B, C or D');
      return;
    }

    const newQuestion = {
      question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_answer: correctAnswer.toUpperCase() === 'A' ? optionA :
        correctAnswer.toUpperCase() === 'B' ? optionB :
        correctAnswer.toUpperCase() === 'C' ? optionC : optionD,
    };

    setQuestions([...questions, newQuestion]);
    setQuestion('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswer('');
    setShowQuestionForm(false);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const saveQuiz = () => {
    if (!title || !module) {
      Alert.alert('Missing Fields', 'Please enter quiz title and module');
      return;
    }
    if (questions.length < 1) {
      Alert.alert('No Questions', 'Please add at least one question');
      return;
    }
    if (parseInt(timeLimit) < 1 || parseInt(timeLimit) > 60) {
      Alert.alert('Invalid Time', 'Time limit must be between 1 and 60 minutes');
      return;
    }

    try {
      db.runSync(
        `INSERT INTO lecturer_quizzes (title, module, time_limit) VALUES (?, ?, ?)`,
        [title, module, parseInt(timeLimit)]
      );

      const quiz = db.getFirstSync(
        `SELECT id FROM lecturer_quizzes ORDER BY id DESC LIMIT 1`
      ) as any;

      questions.forEach((q) => {
        db.runSync(
          `INSERT INTO lecturer_quiz_questions 
           (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [quiz.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer]
        );
      });

      Alert.alert('Success', 'Quiz created successfully! Students can now take it.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save quiz');
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Quiz</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Quiz Details</Text>

        <View style={styles.inputBox}>
          <Ionicons name="text-outline" size={20} color="#D85A30" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Quiz Title"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="book-outline" size={20} color="#D85A30" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Module e.g. Computer Science 101"
            placeholderTextColor="#aaa"
            value={module}
            onChangeText={setModule}
          />
        </View>

        <View style={styles.inputBox}>
          <Ionicons name="time-outline" size={20} color="#D85A30" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Time limit in minutes (max 60)"
            placeholderTextColor="#aaa"
            value={timeLimit}
            onChangeText={setTimeLimit}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.questionsHeader}>
        <Text style={styles.sectionTitle}>
          Questions ({questions.length})
        </Text>
        <TouchableOpacity
          style={styles.addQuestionBtn}
          onPress={() => setShowQuestionForm(!showQuestionForm)}
        >
          <Ionicons name={showQuestionForm ? 'close' : 'add'} size={22} color="#ffffff" />
          <Text style={styles.addQuestionBtnText}>
            {showQuestionForm ? 'Cancel' : 'Add Question'}
          </Text>
        </TouchableOpacity>
      </View>

      {showQuestionForm && (
        <View style={styles.questionForm}>
          <Text style={styles.questionFormTitle}>New Question</Text>

          <TextInput
            style={styles.questionInput}
            placeholder="Enter your question here..."
            placeholderTextColor="#aaa"
            value={question}
            onChangeText={setQuestion}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.optionBox}>
            <View style={styles.optionLabel}>
              <Text style={styles.optionLetter}>A</Text>
            </View>
            <TextInput
              style={styles.optionInput}
              placeholder="Option A"
              placeholderTextColor="#aaa"
              value={optionA}
              onChangeText={setOptionA}
            />
          </View>

          <View style={styles.optionBox}>
            <View style={styles.optionLabel}>
              <Text style={styles.optionLetter}>B</Text>
            </View>
            <TextInput
              style={styles.optionInput}
              placeholder="Option B"
              placeholderTextColor="#aaa"
              value={optionB}
              onChangeText={setOptionB}
            />
          </View>

          <View style={styles.optionBox}>
            <View style={styles.optionLabel}>
              <Text style={styles.optionLetter}>C</Text>
            </View>
            <TextInput
              style={styles.optionInput}
              placeholder="Option C"
              placeholderTextColor="#aaa"
              value={optionC}
              onChangeText={setOptionC}
            />
          </View>

          <View style={styles.optionBox}>
            <View style={styles.optionLabel}>
              <Text style={styles.optionLetter}>D</Text>
            </View>
            <TextInput
              style={styles.optionInput}
              placeholder="Option D"
              placeholderTextColor="#aaa"
              value={optionD}
              onChangeText={setOptionD}
            />
          </View>

          <View style={styles.correctBox}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#1D9E75" />
            <TextInput
              style={styles.correctInput}
              placeholder="Correct answer (A, B, C or D)"
              placeholderTextColor="#aaa"
              value={correctAnswer}
              onChangeText={setCorrectAnswer}
              autoCapitalize="characters"
              maxLength={1}
            />
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Question</Text>
          </TouchableOpacity>
        </View>
      )}

      {questions.length === 0 && !showQuestionForm ? (
        <View style={styles.emptyBox}>
          <Ionicons name="help-circle-outline" size={50} color="#534AB7" />
          <Text style={styles.emptyText}>No questions added yet</Text>
          <Text style={styles.emptySubText}>Tap Add Question to get started</Text>
        </View>
      ) : (
        questions.map((q, index) => (
          <View key={index} style={styles.questionCard}>
            <View style={styles.questionCardTop}>
              <Text style={styles.questionNum}>Q{index + 1}</Text>
              <Text style={styles.questionText} numberOfLines={2}>{q.question}</Text>
              <TouchableOpacity onPress={() => removeQuestion(index)}>
                <Ionicons name="trash-outline" size={20} color="#D85A30" />
              </TouchableOpacity>
            </View>
            <View style={styles.optionsList}>
              {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, i) => (
                <View
                  key={i}
                  style={[
                    styles.optionItem,
                    opt === q.correct_answer && styles.correctOption
                  ]}
                >
                  <Text style={styles.optionItemLetter}>
                    {['A', 'B', 'C', 'D'][i]}
                  </Text>
                  <Text style={styles.optionItemText}>{opt}</Text>
                  {opt === q.correct_answer && (
                    <Ionicons name="checkmark-circle" size={16} color="#1D9E75" />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {questions.length > 0 && (
        <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz}>
          <Ionicons name="save-outline" size={22} color="#ffffff" />
          <Text style={styles.saveBtnText}>Save Quiz ({questions.length} questions)</Text>
        </TouchableOpacity>
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
  backBtn: { padding: 4 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 16,
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
    borderColor: '#D85A30',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  questionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 1,
  },
  addQuestionBtn: {
    backgroundColor: '#534AB7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addQuestionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  questionForm: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  questionFormTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  questionInput: {
    backgroundColor: '#001f4d',
    borderWidth: 1,
    borderColor: '#534AB7',
    padding: 12,
    borderRadius: 10,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
    minHeight: 80,
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#001f4d',
    borderWidth: 1,
    borderColor: '#534AB7',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: '#ffffff',
  },
  correctBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#001f4d',
    borderWidth: 1,
    borderColor: '#1D9E75',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    marginTop: 4,
  },
  correctInput: {
    flex: 1,
    fontSize: 15,
    color: '#1D9E75',
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#534AB7',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
    marginBottom: 20,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubText: {
    color: '#a0c4ff',
    fontSize: 13,
  },
  questionCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  questionCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  questionNum: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    minWidth: 28,
  },
  questionText: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    lineHeight: 20,
  },
  optionsList: {
    gap: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#001f4d',
  },
  correctOption: {
    backgroundColor: '#0a3d2e',
    borderWidth: 1,
    borderColor: '#1D9E75',
  },
  optionItemLetter: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#a0c4ff',
    minWidth: 20,
  },
  optionItemText: {
    fontSize: 13,
    color: '#ffffff',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#1D9E75',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});