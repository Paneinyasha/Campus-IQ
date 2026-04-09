import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database/db';

export default function PlanMyDay() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [task, setTask] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    try {
      const result = db.getAllSync(
        `SELECT * FROM planner WHERE date = ? ORDER BY id DESC`,
        [new Date().toISOString().split('T')[0]]
      );
      setTasks(result);
    } catch (e) {}
  };

  const handleAdd = () => {
    if (!task) {
      Alert.alert('Missing Field', 'Please enter a task');
      return;
    }
    try {
      db.runSync(
        `INSERT INTO planner (student_id, task, date) VALUES (1, ?, ?)`,
        [task, date]
      );
      setTask('');
      setShowForm(false);
      loadTasks();
    } catch (e) {
      Alert.alert('Error', 'Could not add task');
    }
  };

  const toggleTask = (id: number, isDone: number) => {
    try {
      db.runSync(
        `UPDATE planner SET is_done = ? WHERE id = ?`,
        [isDone === 1 ? 0 : 1, id]
      );
      loadTasks();
    } catch (e) {}
  };

  const deleteTask = (id: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              db.runSync(`DELETE FROM planner WHERE id = ?`, [id]);
              loadTasks();
            } catch (e) {}
          }
        }
      ]
    );
  };

  const doneTasks = tasks.filter((t: any) => t.is_done === 1);
  const pendingTasks = tasks.filter((t: any) => t.is_done === 0);

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Plan My Day</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      <View style={styles.dateBox}>
        <Ionicons name="calendar-outline" size={20} color="#FFD700" />
        <Text style={styles.dateText}>
          {new Date().toDateString()}
        </Text>
      </View>

      <View style={styles.progressBox}>
        <Text style={styles.progressText}>
          {doneTasks.length} of {tasks.length} tasks completed
        </Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: tasks.length > 0 ? `${(doneTasks.length / tasks.length) * 100}%` : '0%' }
          ]} />
        </View>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Task</Text>
          <View style={styles.inputBox}>
            <Ionicons name="checkbox-outline" size={20} color="#D85A30" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="What do you need to do?"
              placeholderTextColor="#aaa"
              value={task}
              onChangeText={setTask}
            />
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.saveBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      )}

      {tasks.length === 0 && !showForm ? (
        <View style={styles.emptyBox}>
          <Ionicons name="today-outline" size={60} color="#D85A30" />
          <Text style={styles.emptyTitle}>No Tasks Yet</Text>
          <Text style={styles.emptyText}>
            Tap the + button to plan your day
          </Text>
        </View>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Pending</Text>
              {pendingTasks.map((t: any) => (
                <View key={t.id} style={styles.taskCard}>
                  <TouchableOpacity
                    style={styles.taskLeft}
                    onPress={() => toggleTask(t.id, t.is_done)}
                  >
                    <View style={styles.checkbox}>
                      <Ionicons name="square-outline" size={24} color="#a0c4ff" />
                    </View>
                    <Text style={styles.taskText}>{t.task}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTask(t.id)}>
                    <Ionicons name="trash-outline" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {doneTasks.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Completed</Text>
              {doneTasks.map((t: any) => (
                <View key={t.id} style={[styles.taskCard, styles.doneCard]}>
                  <TouchableOpacity
                    style={styles.taskLeft}
                    onPress={() => toggleTask(t.id, t.is_done)}
                  >
                    <View style={styles.checkbox}>
                      <Ionicons name="checkmark-circle" size={24} color="#1D9E75" />
                    </View>
                    <Text style={[styles.taskText, styles.doneText]}>{t.task}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTask(t.id)}>
                    <Ionicons name="trash-outline" size={20} color="#D85A30" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </>
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
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addBtn: {
    padding: 4,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  progressBox: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 13,
    color: '#a0c4ff',
    marginBottom: 8,
  },
  progressBar: {
    backgroundColor: '#001f4d',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#1D9E75',
    height: 8,
    borderRadius: 4,
  },
  form: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#D85A30',
    borderRadius: 14,
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#D85A30',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 80,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    marginTop: 6,
    letterSpacing: 1,
  },
  taskCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doneCard: {
    backgroundColor: '#0a3d2e',
    borderColor: '#1D9E75',
    opacity: 0.8,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 28,
    alignItems: 'center',
  },
  taskText: {
    fontSize: 15,
    color: '#ffffff',
    flex: 1,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#a0c4ff',
  },
});