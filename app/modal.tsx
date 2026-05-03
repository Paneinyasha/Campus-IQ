import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="information-circle-outline" size={60} color="#534AB7" />
      <Text style={styles.title}>Campus IQ</Text>
      <Text style={styles.subtitle}>Midlands State University</Text>
      <Text style={styles.body}>Smart Campus Companion</Text>
      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#ffffff" />
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0c4ff',
  },
  body: {
    fontSize: 14,
    color: '#a0c4ff',
    marginBottom: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#534AB7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});