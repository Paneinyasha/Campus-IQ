import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('campusiq.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      program TEXT NOT NULL,
      reg_number TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lecturers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      campus TEXT NOT NULL,
      is_occupied INTEGER DEFAULT 0,
      current_class TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      lecturer_id INTEGER NOT NULL,
      venue_id INTEGER NOT NULL,
      day TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      program TEXT NOT NULL,
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
      FOREIGN KEY (venue_id) REFERENCES venues(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      timetable_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'present',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (timetable_id) REFERENCES timetable(id)
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      created_by INTEGER,
      time_limit INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS planner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      task TEXT NOT NULL,
      date TEXT NOT NULL,
      is_done INTEGER DEFAULT 0,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );
  `);
};

export const registerStudent = (name, surname, program, regNumber, email, password) => {
  try {
    db.runSync(
      `INSERT INTO students (name, surname, program, reg_number, email, password) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, surname, program, regNumber, email, password]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginStudent = (email, password) => {
  try {
    const student = db.getFirstSync(
      `SELECT * FROM students WHERE email = ? AND password = ?`,
      [email, password]
    );
    return student ? { success: true, student } : { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const loginLecturer = (email, password) => {
  try {
    const lecturer = db.getFirstSync(
      `SELECT * FROM lecturers WHERE email = ? AND password = ?`,
      [email, password]
    );
    return lecturer ? { success: true, lecturer } : { success: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const addLecturer = (name, surname, department, email, password) => {
  try {
    db.runSync(
      `INSERT INTO lecturers (name, surname, department, email, password) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, surname, department, email, password]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllVenues = () => {
  try {
    const venues = db.getAllSync(`SELECT * FROM venues`);
    return { success: true, venues };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllLecturers = () => {
  try {
    const lecturers = db.getAllSync(`SELECT * FROM lecturers`);
    return { success: true, lecturers };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getAllStudents = () => {
  try {
    const students = db.getAllSync(`SELECT * FROM students`);
    return { success: true, students };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default db;