import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Added Supabase client
import { supabase } from '../database/supabase';

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
    loadQuizzes();
  }, []);

  // UPDATED: Now fetches quizzes from Supabase
  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('lecturer_quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) setQuizzes(data || []);
    } catch (e) {}
  };

  // UPDATED: Fetches specific questions for the selected quiz
  const startQuiz = (quiz: any) => {
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
          }
        }
      ]
    );
  };

  // UPDATED: Saves the result to Supabase
  const finishQuiz = async (finalAnswers?: string[]) => {
    clearInterval(timerRef.current);
    const ans = finalAnswers || answers;
    const score = ans.filter((a, i) => a === (questions[i] as any)?.correct_answer).length;

    try {
      const saved = await AsyncStorage.getItem('current_student');
      if (saved) {
        const student = JSON.parse(saved);
        await supabase.from('quiz_results').insert({
          quiz_id: activeQuiz.id,
          student_reg: student.reg_number,
          score,
          total: questions.length
        });
      }
    } catch (e) {}

    setFinished(true);
  };

  // ... (formatTime, handleAnswer, handleNext, and UI logic remain the same)
