import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../database/supabase';

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

  const saveQuiz = async () => {
    if (!title || !module) {
      Alert.alert('Missing Fields', 'Please enter quiz title and module');
      return;
    }
    if (questions.length < 1) {
      Alert.alert('No Questions', 'Please add at least one question');
      return;
    }

    try {
      const { data: newQuiz, error: quizError } = await supabase
        .from('lecturer_quizzes')
        .insert({ 
          title, 
          module, 
          time_limit: parseInt(timeLimit) 
        })
        .select()
        .single();

      if (quizError || !newQuiz) throw new Error('Failed to create quiz header');

      const questionsToSave = questions.map(q => ({
        quiz_id: newQuiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      }));

      const { error: qsError } = await supabase
        .from('lecturer_quiz_questions')
        .insert(questionsToSave);

      if (qsError) throw new Error('Failed to save questions');

      Alert.alert('Success', 'Quiz created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save quiz');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quiz</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Quiz Details</Text>
        <TextInput style={styles.input} placeholder="Quiz Title" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Module Name" value={module} onChangeText={setModule} />
        <TextInput style={styles.input} placeholder="Time Limit (mins)" keyboardType="numeric" value={timeLimit} onChangeText={setTimeLimit} />

        <Text style={styles.label}>Questions ({questions.length})</Text>
        {questions.map((q, i) => (
          <View key={i} style={styles.questionCard}>
            <Text style={styles.questionText}>{i + 1}. {q.question}</Text>
          </View>
        ))}

        {showQuestionForm ? (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Enter Question" value={question} onChangeText={setQuestion} />
            <TextInput style={styles.input} placeholder="Option A" value={optionA} onChangeText={setOptionA} />
            <TextInput style={styles.input} placeholder="Option B" value={optionB} onChangeText={setOptionB} />
            <TextInput style={styles.input} placeholder="Option C" value={optionC} onChangeText={setOptionC} />
            <TextInput style={styles.input} placeholder="Option D" value={optionD} onChangeText={setOptionD} />
            <TextInput style={styles.input} placeholder="Correct Letter (A, B, C, or D)" value={correctAnswer} onChangeText={setCorrectAnswer} />
            <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
              <Text style={styles.btnText}>Add to Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.outlineBtn} onPress={() => setShowQuestionForm(true)}>
            <Text style={styles.outlineBtnText}>+ Add New Question</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz}>
          <Text style={styles.btnText}>Finish & Save Quiz</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#007AFF', 
    padding: 20, 
    paddingTop: 50 
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  input: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  questionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  questionText: { fontWeight: '500' },
  form: { backgroundColor: '#eee', padding: 15, borderRadius: 10, marginBottom: 20 },
  addBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  saveBtn: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  outlineBtn: { padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF' },
  outlineBtnText: { color: '#007AFF', fontWeight: 'bold' },
});
