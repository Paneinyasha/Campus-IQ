// Inside login-student.tsx -> handleSubmit() -> if (result.success) { ... }

const result = await registerStudent(name, surname, program, regNumber, email, password, phone);

if (result.success) {
  // NEW: Send Welcome Notification to Supabase
  await supabase.from('notifications').insert({
    title: 'Welcome to Campus IQ!',
    message: `Welcome ${name}! Your account has been created successfully. Your reg number is ${regNumber}.`,
    target: 'all',
    type: 'info'
  });

  Alert.alert('Account Created!', `Welcome to Campus IQ, ${name}!...`);
  // ... rest of reset logic
}
