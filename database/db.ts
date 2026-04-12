import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('campusiq4.db');

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
      phone TEXT DEFAULT '',
      avatar_id INTEGER DEFAULT 1,
      is_suspended INTEGER DEFAULT 0,
      suspend_reason TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lecturers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      surname TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      avatar_id INTEGER DEFAULT 1,
      is_suspended INTEGER DEFAULT 0,
      suspend_reason TEXT DEFAULT '',
      must_change_password INTEGER DEFAULT 1,
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
      status TEXT DEFAULT 'absent',
      UNIQUE(student_id, timetable_id, date),
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
      type TEXT DEFAULT 'general',
      is_read INTEGER DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL,
      sender_reg TEXT NOT NULL,
      sender_role TEXT DEFAULT 'student',
      avatar_id INTEGER DEFAULT 1,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lecturer_quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      module TEXT NOT NULL,
      time_limit INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lecturer_quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      student_reg TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS board_meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meeting_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      lecturer_id INTEGER NOT NULL,
      status TEXT DEFAULT 'absent',
      UNIQUE(meeting_id, lecturer_id),
      FOREIGN KEY (meeting_id) REFERENCES board_meetings(id),
      FOREIGN KEY (lecturer_id) REFERENCES lecturers(id)
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_role TEXT NOT NULL,
      from_id TEXT NOT NULL,
      to_role TEXT NOT NULL,
      to_id TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const registerStudent = (
  name: string, surname: string, program: string,
  regNumber: string, email: string, password: string, phone: string
) => {
  try {
    db.runSync(
      `INSERT INTO students (name, surname, program, reg_number, email, password, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, surname, program, regNumber, email, password, phone]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const loginStudent = (email: string, password: string) => {
  try {
    const student = db.getFirstSync(
      `SELECT * FROM students WHERE email = ? AND password = ? AND is_suspended = 0`,
      [email, password]
    );
    return student ? { success: true, student } : { success: false };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const loginLecturer = (email: string, password: string) => {
  try {
    const lecturer = db.getFirstSync(
      `SELECT * FROM lecturers WHERE email = ? AND password = ? AND is_suspended = 0`,
      [email, password]
    );
    return lecturer ? { success: true, lecturer } : { success: false };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const addLecturer = (
  name: string, surname: string, department: string,
  email: string, password: string, phone: string
) => {
  try {
    db.runSync(
      `INSERT INTO lecturers (name, surname, department, email, password, phone, must_change_password) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, surname, department, email, password, phone]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const getAllVenues = () => {
  try {
    const venues = db.getAllSync(`SELECT * FROM venues`);
    return { success: true, venues };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const getAllLecturers = () => {
  try {
    const lecturers = db.getAllSync(`SELECT * FROM lecturers`);
    return { success: true, lecturers };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const getAllStudents = () => {
  try {
    const students = db.getAllSync(`SELECT * FROM students`);
    return { success: true, students };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const suspendUser = (id: number, type: string, reason: string) => {
  try {
    const table = type === 'student' ? 'students' : 'lecturers';
    db.runSync(
      `UPDATE ${table} SET is_suspended = 1, suspend_reason = ? WHERE id = ?`,
      [reason, id]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const unsuspendUser = (id: number, type: string, reason: string) => {
  try {
    const table = type === 'student' ? 'students' : 'lecturers';
    db.runSync(
      `UPDATE ${table} SET is_suspended = 0, suspend_reason = ? WHERE id = ?`,
      [reason, id]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as any).message };
  }
};

export const getAttendanceStats = (studentId: number) => {
  try {
    const total = db.getFirstSync(
      `SELECT COUNT(*) as count FROM attendance WHERE student_id = ?`,
      [studentId]
    ) as any;
    const present = db.getFirstSync(
      `SELECT COUNT(*) as count FROM attendance WHERE student_id = ? AND status = 'present'`,
      [studentId]
    ) as any;
    const totalCount = total?.count || 0;
    const presentCount = present?.count || 0;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
    return { success: true, total: totalCount, present: presentCount, percentage };
  } catch (error) {
    return { success: false, total: 0, present: 0, percentage: 0 };
  }
};

export default db;