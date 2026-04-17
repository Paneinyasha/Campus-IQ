import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Added Supabase client
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
    // Clear question form
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

  // UPDATED: Now an async function using Supabase
  const saveQuiz = async () => {
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
      // 1. Save the quiz header and get the new ID
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

      // 2. Prepare questions with the new quiz_id
      const questionsToSave = questions.map(q => ({
        quiz_id: newQuiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      }));

      // 3. Bulk insert questions
      const { error: qsError } = await supabase
        .from('lecturer_quiz_questions')
        .insert(questionsToSave);

      if (qsError) throw new Error('Failed to save questions');

      Alert.alert('Success', 'Quiz created successfully! Students can now take it.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save quiz');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* UI code remains the same */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Quiz</Text>
        <View style={{ width: 24 }} />
      </View>
      {/* ... (rest of the render logic) */}
