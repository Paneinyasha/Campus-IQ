import { supabase } from './supabase';

export const initDatabase = async () => {
  console.log('Campus IQ connected to Supabase');
};

// ===================== CONFIG =====================
const RESEND_API_KEY = 're_6fCJZJhz_DvyFjrVx37hHuR2q35S3csxe';
const AT_API_KEY = 'atsk_4014260f2d12f20c627639ff335dda99374d52bbebe0febdb64a6586899a60df5293309b';
const AT_USERNAME = 'sandbox'; // Change to your Africa's Talking username when going live

// ===================== HELPERS =====================
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Format phone to international Zimbabwe format +263XXXXXXXXX
const formatZimbabwePhone = (phone: string): string => {
  let p = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (p.startsWith('00263')) p = '+' + p.slice(2);
  if (p.startsWith('263')) p = '+' + p;
  if (p.startsWith('0')) p = '+263' + p.slice(1);
  if (!p.startsWith('+')) p = '+263' + p;
  return p;
};

// Send SMS via Africa's Talking
const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    const formattedPhone = formatZimbabwePhone(phone);
    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: formattedPhone,
      message: message,
    });
    const response = await fetch('https://api.sandbox.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_API_KEY,
      },
      body: body.toString(),
    });
    const result = await response.json();
    const status = result?.SMSMessageData?.Recipients?.[0]?.status;
    return status === 'Success' || response.ok;
  } catch (e) {
    console.log('SMS error:', e);
    return false;
  }
};

// Send OTP email via Resend
const sendOTPEmail = async (email: string, name: string, otp: string) => {
  try {
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
  } catch (e) {
    console.log('Email error:', e);
  }
};

// ===================== BROADCAST SMS =====================
export const sendBroadcastSMS = async (message: string, target: 'all' | 'students' | 'lecturers') => {
  try {
    const phones: string[] = [];

    if (target === 'all' || target === 'students') {
      const { data: students } = await supabase.from('students').select('phone, name').eq('is_suspended', 0);
      (students || []).forEach((s: any) => { if (s.phone) phones.push(s.phone); });
    }

    if (target === 'all' || target === 'lecturers') {
      const { data: lecturers } = await supabase.from('lecturers').select('phone, name').eq('is_suspended', 0);
      (lecturers || []).forEach((l: any) => { if (l.phone) phones.push(l.phone); });
    }

    // Send SMS to all collected numbers
    const smsText = `Campus IQ Notification:\n${message}\n- MSU Campus IQ`;
    for (const phone of phones) {
      await sendSMS(phone, smsText);
    }

    return { success: true, count: phones.length };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// ===================== STUDENT REGISTRATION & OTP =====================
export const registerStudent = async (
  name: string, surname: string, program: string,
  regNumber: string, email: string, password: string, phone: string
) => {
  try {
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .or(`email.eq.${email.toLowerCase()},reg_number.eq.${regNumber}`)
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

    // Send OTP via both Email AND SMS simultaneously
    await Promise.all([
      sendOTPEmail(email.toLowerCase(), name, otp),
      sendSMS(phone, `Campus IQ Verification Code: ${otp}\nExpires in 10 minutes.\nDo not share this code.`),
    ]);

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
      .select('name, phone')
      .eq('email', email.toLowerCase())
      .single();

    if (!data) return { success: false, error: 'Email not found' };

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('students')
      .update({ otp_code: otp, otp_expiry: otpExpiry })
      .eq('email', email.toLowerCase());

    // Resend via both email and SMS
    await Promise.all([
      sendOTPEmail(email.toLowerCase(), data.name, otp),
      data.phone ? sendSMS(data.phone, `Campus IQ Verification Code: ${otp}\nExpires in 10 minutes.\nDo not share this code.`) : Promise.resolve(),
    ]);

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