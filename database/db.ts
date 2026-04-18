import { supabase } from './supabase';


export const initDatabase = async () => {
  console.log('Campus IQ connected to Supabase');
};

export const registerStudent = async (
  name: string, surname: string, program: string,
  regNumber: string, email: string, password: string, phone: string
) => {
  try {
    const { error } = await supabase.from('students').insert({
      name, surname, program,
      reg_number: regNumber,
      email, password, phone
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const loginStudent = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('is_suspended', 0)
      .single();
    if (error || !data) return { success: false };
    return { success: true, student: data };
  } catch (error: any) {
    return { success: false };
  }
};

export const loginLecturer = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase
      .from('lecturers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('is_suspended', 0)
      .single();
    if (error || !data) return { success: false };
    return { success: true, lecturer: data };
  } catch (error: any) {
    return { success: false };
  }
};

export const addLecturer = async (
  name: string, surname: string, department: string,
  email: string, password: string, phone: string
) => {
  try {
    const { error } = await supabase.from('lecturers').insert({
      name, surname, department, email, password, phone,
      must_change_password: 1
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAllVenues = async () => {
  try {
    const { data, error } = await supabase.from('venues').select('*');
    if (error) return { success: false, venues: [] };
    return { success: true, venues: data };
  } catch (error: any) {
    return { success: false, venues: [] };
  }
};

export const getAllLecturers = async () => {
  try {
    const { data, error } = await supabase.from('lecturers').select('*');
    if (error) return { success: false, lecturers: [] };
    return { success: true, lecturers: data };
  } catch (error: any) {
    return { success: false, lecturers: [] };
  }
};

export const getAllStudents = async () => {
  try {
    const { data, error } = await supabase.from('students').select('*');
    if (error) return { success: false, students: [] };
    return { success: true, students: data };
  } catch (error: any) {
    return { success: false, students: [] };
  }
};

export const suspendUser = async (id: string, type: string, reason: string) => {
  try {
    const table = type === 'student' ? 'students' : 'lecturers';
    const { error } = await supabase
      .from(table)
      .update({ is_suspended: 1, suspend_reason: reason })
      .eq('id', id);
    if (error) return { success: false };
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
};

export const unsuspendUser = async (id: string, type: string, reason: string) => {
  try {
    const table = type === 'student' ? 'students' : 'lecturers';
    const { error } = await supabase
      .from(table)
      .update({ is_suspended: 0, suspend_reason: reason })
      .eq('id', id);
    if (error) return { success: false };
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
};

export default supabase;
