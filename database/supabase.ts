import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://vpltnzosdviqnkojlwrt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbHRuem9zZHZpcW5rb2psd3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODAwODEsImV4cCI6MjA5MTg1NjA4MX0.TfsL5YMspZdaPJq7VHaomMLKkLV-tK6NKernziohp4k';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});