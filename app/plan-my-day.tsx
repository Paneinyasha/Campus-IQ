import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { supabase } from '../database/supabase';

const MOODS = ['😊 Great', '🙂 Good', '😐 Okay', '😔 Low', '😤 Stressed'];

export default function PlanMyDay() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [diaryText, setDiaryText] = useState('');
  const [mood, setMood] = useState('😊 Great');
  const [entryTitle, setEntryTitle] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [activeTab, setActiveTab] = useState<'diary' | 'goals' | 'tasks'>('diary');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateStr = selectedDate.toISOString().split('T')[0];

  useEffect(() => { loadStudent(); }, []);
  useEffect(() => { if (studentId) { loadEntry(); loadTasks(); } }, [studentId, selectedDate]);

  const loadStudent = async () => {
    const saved = await AsyncStorage.getItem('current_student');
    if (saved) { const s = JSON.parse(saved); setStudentId(s.id); }
  };

  const loadEntry = async () => {
    const { data } = await supabase.from('diary')
      .select('*').eq('student_id', studentId).eq('entry_date', dateStr).maybeSingle();
    if (data) {
      setEntry(data);
      setEntryTitle(data.title || '');
      setDiaryText(data.content || '');
      setMood(data.mood || '😊 Great');
      setGoals(typeof data.goals === 'string' ? JSON.parse(data.goals) : (data.goals || []));
    } else {
      setEntry(null);
      setEntryTitle('');
      setDiaryText('');
      setMood('😊 Great');
      setGoals([]);
    }
  };

  const loadTasks = async () => {
    const { data } = await supabase.from('planner').select('*')
      .eq('student_id', studentId).eq('date', dateStr).order('id', { ascending: true });
    setTasks(data || []);
  };

  const saveEntry = async () => {
    if (!diaryText.trim() && goals.length === 0) {
      Alert.alert('Nothing to save', 'Write something in your diary or add a goal first');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        student_id: studentId,
        entry_date: dateStr,
        title: entryTitle.trim() || `Entry - ${selectedDate.toDateString()}`,
        content: diaryText,
        goals: JSON.stringify(goals),
        mood,
        updated_at: new Date().toISOString(),
      };
      if (entry) {
        await supabase.from('diary').update(payload).eq('id', entry.id);
      } else {
        await supabase.from('diary').insert({ ...payload, created_at: new Date().toISOString() });
      }
      Alert.alert('✅ Saved!', 'Your diary entry has been saved.');
      loadEntry();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals(prev => [...prev, { text: newGoal.trim(), achieved: false }]);
    setNewGoal('');
    setShowGoalForm(false);
  };

  const toggleGoal = (index: number) => {
    setGoals(prev => prev.map((g, i) => i === index ? { ...g, achieved: !g.achieved } : g));
  };

  const removeGoal = (index: number) => {
    setGoals(prev => prev.filter((_, i) => i !== index));
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await supabase.from('planner').insert({ student_id: studentId, task: newTask.trim(), date: dateStr, is_done: 0 });
    setNewTask('');
    setShowTaskForm(false);
    loadTasks();
  };

  const toggleTask = async (id: string, isDone: number) => {
    await supabase.from('planner').update({ is_done: isDone === 1 ? 0 : 1 }).eq('id', id);
    loadTasks();
  };

  const deleteTask = (id: string) => {
    Alert.alert('Delete Task', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('planner').delete().eq('id', id); loadTasks(); } }
    ]);
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const isToday = dateStr === new Date().toISOString().split('T')[0];
  const doneTasks = tasks.filter(t => t.is_done === 1);
  const pendingTasks = tasks.filter(t => t.is_done === 0);
  const achievedGoals = goals.filter(g => g.achieved).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Diary</Text>
        <TouchableOpacity onPress={saveEntry} disabled={saving}>
          <Text style={styles.saveHeaderBtn}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={22} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
          {isToday && <Text style={styles.todayBadge}>Today</Text>}
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={22} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{achievedGoals}/{goals.length}</Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <TouchableOpacity style={styles.moodBox} onPress={() => setShowMoodPicker(true)}>
          <Text style={styles.moodEmoji}>{mood.split(' ')[0]}</Text>
          <Text style={styles.moodLabel}>Mood</Text>
        </TouchableOpacity>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{doneTasks.length}/{tasks.length}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['diary', 'goals', 'tasks'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'diary' ? 'book-outline' : tab === 'goals' ? 'flag-outline' : 'checkbox-outline'}
              size={16}
              color={activeTab === tab ? '#FFD700' : '#a0c4ff'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* DIARY TAB */}
        {activeTab === 'diary' && (
          <View>
            <View style={styles.inputBox}>
              <Ionicons name="create-outline" size={18} color="#FFD700" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.titleInput}
                placeholder="Entry title (optional)"
                placeholderTextColor="#aaa"
                value={entryTitle}
                onChangeText={setEntryTitle}
              />
            </View>
            <TextInput
              style={styles.diaryInput}
              placeholder={`How was your day on ${selectedDate.toDateString()}?\n\nWrite your thoughts, feelings, what happened, what you learned...`}
              placeholderTextColor="#aaa"
              value={diaryText}
              onChangeText={setDiaryText}
              multiline
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveDiaryBtn} onPress={saveEntry} disabled={saving}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveDiaryBtnText}>{saving ? 'Saving...' : 'Save Entry'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                Goals for {isToday ? 'Today' : selectedDate.toDateString()}
              </Text>
              <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowGoalForm(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addSmallBtnText}>Add Goal</Text>
              </TouchableOpacity>
            </View>

            {showGoalForm && (
              <View style={styles.inlineForm}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="Enter your goal..."
                  placeholderTextColor="#aaa"
                  value={newGoal}
                  onChangeText={setNewGoal}
                  autoFocus
                />
                <View style={styles.inlineFormBtns}>
                  <TouchableOpacity style={styles.cancelSmallBtn} onPress={() => { setShowGoalForm(false); setNewGoal(''); }}>
                    <Text style={styles.cancelSmallBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addGoalBtn} onPress={addGoal}>
                    <Text style={styles.addGoalBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {goals.length === 0 && !showGoalForm ? (
              <View style={styles.emptyBox}>
                <Ionicons name="flag-outline" size={50} color="#534AB7" />
                <Text style={styles.emptyTitle}>No Goals Yet</Text>
                <Text style={styles.emptyText}>Set goals for this day and tick them off as you achieve them</Text>
              </View>
            ) : (
              <>
                {goals.filter(g => !g.achieved).map((goal, i) => (
                  <TouchableOpacity key={i} style={styles.goalCard} onPress={() => toggleGoal(goals.indexOf(goal))}>
                    <View style={styles.goalLeft}>
                      <View style={styles.goalCircle}>
                        <Ionicons name="ellipse-outline" size={22} color="#534AB7" />
                      </View>
                      <Text style={styles.goalText}>{goal.text}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeGoal(goals.indexOf(goal))}>
                      <Ionicons name="trash-outline" size={16} color="#D85A30" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
                {goals.filter(g => g.achieved).length > 0 && (
                  <Text style={styles.achievedLabel}>✅ Achieved</Text>
                )}
                {goals.filter(g => g.achieved).map((goal, i) => (
                  <TouchableOpacity key={i} style={[styles.goalCard, styles.goalCardDone]} onPress={() => toggleGoal(goals.indexOf(goal))}>
                    <View style={styles.goalLeft}>
                      <Ionicons name="checkmark-circle" size={22} color="#1D9E75" />
                      <Text style={[styles.goalText, styles.goalTextDone]}>{goal.text}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeGoal(goals.indexOf(goal))}>
                      <Ionicons name="trash-outline" size={16} color="#D85A30" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {goals.length > 0 && (
              <TouchableOpacity style={styles.saveDiaryBtn} onPress={saveEntry} disabled={saving}>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveDiaryBtnText}>{saving ? 'Saving...' : 'Save Goals'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <View>
            <View style={styles.progressBox}>
              <Text style={styles.progressText}>{doneTasks.length} of {tasks.length} tasks completed</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: tasks.length > 0 ? `${(doneTasks.length / tasks.length) * 100}%` : '0%' }]} />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Tasks</Text>
              <TouchableOpacity style={styles.addSmallBtn} onPress={() => setShowTaskForm(!showTaskForm)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addSmallBtnText}>Add Task</Text>
              </TouchableOpacity>
            </View>

            {showTaskForm && (
              <View style={styles.inlineForm}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="What do you need to do?"
                  placeholderTextColor="#aaa"
                  value={newTask}
                  onChangeText={setNewTask}
                  autoFocus
                />
                <View style={styles.inlineFormBtns}>
                  <TouchableOpacity style={styles.cancelSmallBtn} onPress={() => { setShowTaskForm(false); setNewTask(''); }}>
                    <Text style={styles.cancelSmallBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addGoalBtn} onPress={addTask}>
                    <Text style={styles.addGoalBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {tasks.length === 0 && !showTaskForm ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkbox-outline" size={50} color="#D85A30" />
                <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                <Text style={styles.emptyText}>Add tasks to plan your day</Text>
              </View>
            ) : (
              <>
                {pendingTasks.length > 0 && <Text style={styles.achievedLabel}>📋 Pending</Text>}
                {pendingTasks.map((t: any) => (
                  <View key={t.id} style={styles.taskCard}>
                    <TouchableOpacity style={styles.taskLeft} onPress={() => toggleTask(t.id, t.is_done)}>
                      <Ionicons name="square-outline" size={24} color="#a0c4ff" />
                      <Text style={styles.taskText}>{t.task}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(t.id)}>
                      <Ionicons name="trash-outline" size={18} color="#D85A30" />
                    </TouchableOpacity>
                  </View>
                ))}
                {doneTasks.length > 0 && <Text style={styles.achievedLabel}>✅ Completed</Text>}
                {doneTasks.map((t: any) => (
                  <View key={t.id} style={[styles.taskCard, styles.taskCardDone]}>
                    <TouchableOpacity style={styles.taskLeft} onPress={() => toggleTask(t.id, t.is_done)}>
                      <Ionicons name="checkmark-circle" size={24} color="#1D9E75" />
                      <Text style={[styles.taskText, styles.taskTextDone]}>{t.task}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(t.id)}>
                      <Ionicons name="trash-outline" size={18} color="#D85A30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Mood Picker Modal */}
      <Modal visible={showMoodPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>How are you feeling?</Text>
            {MOODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.moodOption, mood === m && styles.moodOptionActive]}
                onPress={() => { setMood(m); setShowMoodPicker(false); }}
              >
                <Text style={styles.moodOptionText}>{m}</Text>
                {mood === m && <Ionicons name="checkmark-circle" size={20} color="#1D9E75" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowMoodPicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#001f4d' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  saveHeaderBtn: { color: '#1D9E75', fontWeight: 'bold', fontSize: 16 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0a2a4a', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  dateArrow: { padding: 8 },
  dateCenter: { alignItems: 'center' },
  dateText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  todayBadge: { fontSize: 11, color: '#FFD700', fontWeight: 'bold', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#0a2a4a', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#FFD700' },
  statLabel: { fontSize: 11, color: '#a0c4ff', marginTop: 2 },
  moodBox: { alignItems: 'center' },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 11, color: '#a0c4ff', marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0a2a4a', borderBottomWidth: 1, borderBottomColor: '#534AB7' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#FFD700' },
  tabText: { color: '#a0c4ff', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#FFD700' },
  content: { flex: 1, padding: 16 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 10, padding: 12, marginBottom: 12 },
  titleInput: { flex: 1, color: '#fff', fontSize: 15 },
  diaryInput: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, minHeight: 220, lineHeight: 24, marginBottom: 16 },
  saveDiaryBtn: { backgroundColor: '#1D9E75', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveDiaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: '#FFD700' },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#534AB7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  addSmallBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  inlineForm: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, marginBottom: 14 },
  inlineInput: { color: '#fff', fontSize: 15, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#534AB7', marginBottom: 12 },
  inlineFormBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelSmallBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#a0c4ff' },
  cancelSmallBtnText: { color: '#a0c4ff', fontWeight: '600' },
  addGoalBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: '#534AB7' },
  addGoalBtnText: { color: '#fff', fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', paddingTop: 50, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  emptyText: { fontSize: 14, color: '#a0c4ff', textAlign: 'center', paddingHorizontal: 40 },
  goalCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  goalCardDone: { backgroundColor: '#0a3d2e', borderColor: '#1D9E75', opacity: 0.85 },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  goalCircle: { width: 28, alignItems: 'center' },
  goalText: { fontSize: 15, color: '#fff', flex: 1 },
  goalTextDone: { textDecorationLine: 'line-through', color: '#a0c4ff' },
  achievedLabel: { fontSize: 13, fontWeight: 'bold', color: '#a0c4ff', marginBottom: 8, marginTop: 4 },
  progressBox: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#D85A30', borderRadius: 12, padding: 14, marginBottom: 16 },
  progressText: { fontSize: 13, color: '#a0c4ff', marginBottom: 8 },
  progressBar: { backgroundColor: '#001f4d', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { backgroundColor: '#1D9E75', height: 8, borderRadius: 4 },
  taskCard: { backgroundColor: '#0a2a4a', borderWidth: 1, borderColor: '#534AB7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  taskCardDone: { backgroundColor: '#0a3d2e', borderColor: '#1D9E75', opacity: 0.8 },
  taskLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  taskText: { fontSize: 15, color: '#fff', flex: 1 },
  taskTextDone: { textDecorationLine: 'line-through', color: '#a0c4ff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#0a2a4a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 16, textAlign: 'center' },
  moodOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#001f4d', borderRadius: 12, padding: 14, marginBottom: 10 },
  moodOptionActive: { backgroundColor: '#0a3d2e', borderWidth: 1, borderColor: '#1D9E75' },
  moodOptionText: { fontSize: 16, color: '#fff' },
  modalClose: { padding: 14, alignItems: 'center' },
  modalCloseText: { color: '#a0c4ff', fontSize: 15 },
});
