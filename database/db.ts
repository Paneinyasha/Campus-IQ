import { supabase } from './supabase';

export const initDatabase = async () => {
  console.log('Campus IQ connected to Supabase');
};

const RESEND_API_KEY = 're_6fCJZJhz_DvyFjrVx37hHuR2q35S3csxe';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email: string, name: string, otp: string) => {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Campus IQ <onboarding@resend.dev>',
      to: [email.toLowerCase()],
      subject: 'Campus IQ - Email Verification Code',
      html: `<div style="font-family:Arial,sans-serif;background:#001f4d;color:#fff;padding:32px;border-radius:16px;max-width:500px;margin:0 auto"><h1 style="color:#FFD700;text-align:center">Campus IQ</h1><h2 style="color:#1D9E75;text-align:center">Email Verification</h2><p style="color:#a0c4ff">Hi <strong>${name}</strong>,</p><p style="color:#a0c4ff">Your verification code is:</p><div style="background:#0a2a4a;border:2px solid #1D9E75;border-radius:12px;padding:24px;text-align:center;margin:24px 0"><span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#FFD700">${otp}</span></div><p style="color:#a0c4ff">This code expires in <strong>10 minutes</strong>.</p><p style="color:#7a9cc4;font-size:12px;text-align:center">Midlands State University 2026</p></div>`,
    }),
  });
};

export const registerStudent = async (
  name: string, surname: string, program: string,
  regNumber: string, email: string, password: string, phone: string
) => {
  try {
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .or(`email.eq.${email},reg_number.eq.${regNumber}`)
      .single();
    if (existing) return { success: false, error: 'Email or reg number already exists' };

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from('students').insert({
      name, surname, program,
      reg_number: regNumber,
      email: email.toLowerCase(),
      password, phone,
      otp_code: otp,
      otp_expiry: otpExpiry,
      is_verified: 0,
      is_suspended: 0,
    });
    if (error) return { success: false, error: error.message };

    await sendOTPEmail(email.toLowerCase(), name, otp);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const verifyStudentOTP = async (email: string, otp: string) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp)
      .single();

    if (error || !data) return { success: false, error: 'Invalid OTP' };

    if (new Date() > new Date(data.otp_expiry)) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }

    await supabase
      .from('students')
      .update({ is_verified: 1, otp_code: null, otp_expiry: null })
      .eq('email', email.toLowerCase());

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const resendStudentOTP = async (email: string) => {
  try {
    const { data } = await supabase
      .from('students')
      .select('name')
      .eq('email', email.toLowerCase())
      .single();

    if (!data) return { success: false, error: 'Email not found' };

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('students')
      .update({ otp_code: otp, otp_expiry: otpExpiry })
      .eq('email', email.toLowerCase());

    await sendOTPEmail(email.toLowerCase(), data.name, otp);

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
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .eq('is_suspended', 0)
      .single();
    if (error || !data) return { success: false, error: 'incorrect' };
    if (!data.is_verified) return { success: false, error: 'unverified', email };
    return { success: true, student: data };
  } catch (error: any) {
    return { success: false, error: 'incorrect' };
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