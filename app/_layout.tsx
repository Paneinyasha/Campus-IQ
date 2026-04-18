import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    console.log('Campus IQ Initialized');
  }, []);
  return (
    <>
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
        <Stack.Screen name="manage-timetable" />
        <Stack.Screen name="manage-venues" />
        <Stack.Screen name="generate-qr" />
        <Stack.Screen name="scan-attendance" />
        <Stack.Screen name="my-notes" />
        <Stack.Screen name="plan-my-day" />
        <Stack.Screen name="quiz-msu" />
        <Stack.Screen name="quiz-didyouknow" />
        <Stack.Screen name="msu-radio" />
        <Stack.Screen name="campus-map" />
        <Stack.Screen name="quiz-program" />
        <Stack.Screen name="quiz-set" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile-student" />
        <Stack.Screen name="profile-lecturer" />
        <Stack.Screen name="profile-admin" />
        <Stack.Screen name="broadcast" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="app-settings" />
        <Stack.Screen name="suspend-user" />
        <Stack.Screen name="quiz-results" />
        <Stack.Screen name="create-quiz" />
        <Stack.Screen name="lecturer-change-password" />
        <Stack.Screen name="forgot-password" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
