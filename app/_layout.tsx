import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useState } from 'react';

export type AppThemeType = {
  isDark: boolean;
  fontSize: number;
  fontSizeLabel: string;
  themeName: string;
};

const defaultTheme: AppThemeType = {
  isDark: true,
  fontSize: 15,
  fontSizeLabel: 'Medium',
  themeName: 'dark',
};

export const ThemeContext = createContext<AppThemeType>(defaultTheme);
export const useAppTheme = () => useContext(ThemeContext);

export const loadThemeSettings = async (): Promise<AppThemeType> => {
  try {
    const saved = await AsyncStorage.getItem('campusiq_personal_settings');
    if (saved) {
      const s = JSON.parse(saved);
      const fontMap: any = { small: 12, medium: 15, large: 18, xlarge: 21 };
      const labelMap: any = { small: 'Small', medium: 'Medium', large: 'Large', xlarge: 'Very Large' };
      const themeName = s.theme || 'dark';
      return {
        isDark: themeName !== 'light',
        fontSize: fontMap[s.fontSize] || 15,
        fontSizeLabel: labelMap[s.fontSize] || 'Medium',
        themeName,
      };
    }
  } catch (e) {}
  return defaultTheme;
};

export default function RootLayout() {
  const [theme, setTheme] = useState<AppThemeType>(defaultTheme);

  useEffect(() => {
    loadThemeSettings().then(setTheme);
    const interval = setInterval(() => loadThemeSettings().then(setTheme), 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login-student" />
        <Stack.Screen name="login-lecturer" />
        <Stack.Screen name="login-admin" />
        <Stack.Screen name="student-home" />
        <Stack.Screen name="lecturer-home" />
        <Stack.Screen name="admin-home" />
        <Stack.Screen name="add-lecturer" />
        <Stack.Screen name="all-lecturers" />
        <Stack.Screen name="all-students" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="anonymous-report" />
        <Stack.Screen name="app-settings" />
        <Stack.Screen name="broadcast" />
        <Stack.Screen name="campus-map" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="create-quiz" />
        <Stack.Screen name="emergency-services" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="games" />
        <Stack.Screen name="generate-qr" />
        <Stack.Screen name="lecturer-change-password" />
        <Stack.Screen name="lost-found" />
        <Stack.Screen name="manage-classes" />
        <Stack.Screen name="manage-timetable" />
        <Stack.Screen name="manage-users" />
        <Stack.Screen name="manage-venues" />
        <Stack.Screen name="modal" />
        <Stack.Screen name="msu-radio" />
        <Stack.Screen name="my-classes" />
        <Stack.Screen name="my-notes" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="plan-my-day" />
        <Stack.Screen name="profile-admin" />
        <Stack.Screen name="profile-lecturer" />
        <Stack.Screen name="profile-student" />
        <Stack.Screen name="quiz-didyouknow" />
        <Stack.Screen name="quiz-msu" />
        <Stack.Screen name="quiz-program" />
        <Stack.Screen name="quiz-results" />
        <Stack.Screen name="quiz-set" />
        <Stack.Screen name="scan-attendance" />
        <Stack.Screen name="src-elections" />
        <Stack.Screen name="suspend-user" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeContext.Provider>
  );
}