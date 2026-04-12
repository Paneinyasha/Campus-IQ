import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase } from '../database/db';

export default function RootLayout() {

  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login-student" options={{ headerShown: false }} />
        <Stack.Screen name="login-lecturer" options={{ headerShown: false }} />
        <Stack.Screen name="login-admin" options={{ headerShown: false }} />
        <Stack.Screen name="student-home" options={{ headerShown: false }} />
        <Stack.Screen name="lecturer-home" options={{ headerShown: false }} />
        <Stack.Screen name="admin-home" options={{ headerShown: false }} />
        <Stack.Screen name="add-lecturer" options={{ headerShown: false }} />
        <Stack.Screen name="all-lecturers" options={{ headerShown: false }} />
        <Stack.Screen name="all-students" options={{ headerShown: false }} />
        <Stack.Screen name="manage-timetable" options={{ headerShown: false }} />
        <Stack.Screen name="manage-venues" options={{ headerShown: false }} />
        <Stack.Screen name="generate-qr" options={{ headerShown: false }} />
        <Stack.Screen name="scan-attendance" options={{ headerShown: false }} />
        <Stack.Screen name="my-notes" options={{ headerShown: false }} />
        <Stack.Screen name="plan-my-day" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-msu" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-didyouknow" options={{ headerShown: false }} />
        <Stack.Screen name="msu-radio" options={{ headerShown: false }} />
        <Stack.Screen name="campus-map" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-program" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-set" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="profile-student" options={{ headerShown: false }} />
        <Stack.Screen name="profile-lecturer" options={{ headerShown: false }} />
        <Stack.Screen name="profile-admin" options={{ headerShown: false }} />
        <Stack.Screen name="broadcast" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="app-settings" options={{ headerShown: false }} />
        <Stack.Screen name="suspend-user" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-results" options={{ headerShown: false }} />
        <Stack.Screen name="create-quiz" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}