import { supabase } from './supabase';

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// ─── STUDENT AUTH ───────────────────────────────────────────────

export const registerStudent = async (
  name: string, surname: string, program: string,
  regNumber: string, email: string, password: string, phone: string
) => {
  try {
    const { data: existing } = await supabase
      .from('students')
      .select('id, is_verified')
      .or(`email.eq.${email.toLowerCase()},reg_number.eq.${regNumber}`)
      .maybeSingle();

    if (existing) {
      if (existing.is_verified === 0) {
        // Account exists but unverified — resend OTP
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        await supabase.from('students').update({
          otp_code: otp, otp_expiry: expiry
        }).eq('id', existing.id);
        return { success: true, needsVerification: true, email: email.toLowerCase(), resent: true };
      }
      return { success: false, error: 'An account with this email or reg number already exists.' };
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from('students').insert({
      name, surname, program,
      reg_number: regNumber,
      email: email.toLowerCase(),
      password, phone,
      otp_code: otp,
      otp_expiry: expiry,
      is_verified: 0,
      is_suspended: 0,
      avatar_id: 1,
    });

    if (error) return { success: false, error: error.message };

    // Store OTP in otp_codes table as backup
    await supabase.from('otp_codes').insert({
      email: email.toLowerCase(),
      code: otp,
      expires_at: expiry,
    });

    return { success: true, needsVerification: true, email: email.toLowerCase(), otp };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const verifyStudentOTP = async (email: string, code: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', code)
      .single();

    if (error || !data) return { success: false, error: 'Invalid verification code. Please check and try again.' };

    if (new Date() > new Date(data.otp_expiry)) {
      return { success: false, error: 'This code has expired. Please request a new one.' };
    }

    const { error: updateError } = await supabase
      .from('students')
      .update({ is_verified: 1, otp_code: null, otp_expiry: null })
      .eq('email', email.toLowerCase());

    if (updateError) return { success: false, error: updateError.message };

    const { data: verified } = await supabase
      .from('students')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    return { success: true, student: verified };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const resendOTP = async (email: string) => {
  try {
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('students')
      .update({ otp_code: otp, otp_expiry: expiry })
      .eq('email', email.toLowerCase());

    if (error) return { success: false, error: error.message };

    await supabase.from('otp_codes').insert({
      email: email.toLowerCase(),
      code: otp,
      expires_at: expiry,
    });

    return { success: true, otp };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const loginStudent = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .single();

    if (error || !data) return { success: false, error: 'incorrect' };
    if (data.is_suspended === 1) return { success: false, error: 'suspended', reason: data.suspend_reason };
    if (data.is_verified === 0) return { success: false, error: 'unverified', email: data.email };

    return { success: true, student: data };
  } catch (e: any) {
    return { success: false, error: 'incorrect' };
  }
};

// ─── LECTURER AUTH ──────────────────────────────────────────────

export const loginLecturer = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase
      .from('lecturers')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) return { success: false };
    if (data.is_suspended === 1) return { success: false, error: 'suspended', reason: data.suspend_reason };

    return { success: true, lecturer: data };
  } catch (e: any) {
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
      must_change_password: 1, is_suspended: 0,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// ─── USER MANAGEMENT ────────────────────────────────────────────

export const getAllStudents = async () => {
  try {
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (error) return { success: false, students: [] };
    return { success: true, students: data };
  } catch (e: any) {
    return { success: false, students: [] };
  }
};

export const getAllLecturers = async () => {
  try {
    const { data, error } = await supabase.from('lecturers').select('*').order('name');
    if (error) return { success: false, lecturers: [] };
    return { success: true, lecturers: data };
  } catch (e: any) {
    return { success: false, lecturers: [] };
  }
};

export const getAllVenues = async () => {
  try {
    const { data, error } = await supabase.from('venues').select('*').order('name');
    if (error) return { success: false, venues: [] };
    return { success: true, venues: data };
  } catch (e: any) {
    return { success: false, venues: [] };
  }
};

export const suspendUser = async (id: string, type: string, reason: string) => {
  try {
    const table = type === 'student' ? 'students' : 'lecturers';
    const { error } = await supabase.from(table).update({ is_suspended: 1, suspend_reason: reason }).eq('id', id);
    if (error) return { success: false };
    return { success: true };
  } catch (e: any) {
    return { success: false };
  }
};

export const unsuspendUser = async (id: string, type: string) => {
  try {
    const table = type === 'student' ? 'students' : 'lecturers';
    const { error } = await supabase.from(table).update({ is_suspended: 0, suspend_reason: '' }).eq('id', id);
    if (error) return { success: false };
    return { success: true };
  } catch (e: any) {
    return { success: false };
  }
};

export const markStudentVerified = async (email: string) => {
  try {
    await supabase.from('students').update({ is_verified: 1, otp_code: null, otp_expiry: null }).eq('email', email.toLowerCase());
    const { data } = await supabase.from('students').select('*').eq('email', email.toLowerCase()).single();
    return { success: true, student: data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export default supabase;