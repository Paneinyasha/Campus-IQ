import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db, { getAllVenues } from '../database/db';

export default function ManageVenues() {
  const router = useRouter();
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [campus, setCampus] = useState('');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = () => {
    const result = getAllVenues();
    if (result.success) {
      setVenues(result.venues);
    }
  };

  const handleAddVenue = () => {
    if (!name || !capacity || !campus) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }
    try {
      db.runSync(
        `INSERT INTO venues (name, capacity, campus) VALUES (?, ?, ?)`,
        [name, parseInt(capacity), campus]
      );
      Alert.alert('Success', 'Venue added successfully!');
      setName('');
      setCapacity('');
      setCampus('');
      setShowForm(false);
      loadVenues();
    } catch (error) {
      Alert.alert('Error', 'Could not add venue');
    }
  };

  const toggleVenueStatus = (id: number, currentStatus: number) => {
    try {
      db.runSync(
        `UPDATE venues SET is_occupied = ? WHERE id = ?`,
        [currentStatus === 1 ? 0 : 1, id]
      );
      loadVenues();
    } catch (error) {
      Alert.alert('Error', 'Could not update venue');
    }
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Venues</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Add New Venue</Text>

          <View style={styles.inputBox}>
            <Ionicons name="business-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Venue Name e.g. LT1"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="people-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Capacity e.g. 50"
              placeholderTextColor="#aaa"
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="location-outline" size={20} color="#534AB7" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Campus e.g. Telone"
              placeholderTextColor="#aaa"
              value={campus}
              onChangeText={setCampus}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleAddVenue}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#ffffff" />
            <Text style={styles.saveBtnText}>Save Venue</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{venues.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#1D9E75' }]}>
            {venues.filter((v: any) => v.is_occupied === 0).length}
          </Text>
          <Text style={styles.statLbl}>Free</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#D85A30' }]}>
            {venues.filter((v: any) => v.is_occupied === 1).length}
          </Text>
          <Text style={styles.statLbl}>Occupied</Text>
        </View>
      </View>

      {venues.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="location-outline" size={60} color="#534AB7" />
          <Text style={styles.emptyTitle}>No Venues Yet</Text>
          <Text style={styles.emptyText}>
            Tap the + button above to add your first venue
          </Text>
        </View>
      ) : (
        venues.map((venue: any) => (
          <View key={venue.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <View style={[
                  styles.venueIcon,
                  { borderColor: venue.is_occupied === 1 ? '#D85A30' : '#1D9E75' }
                ]}>
                  <Ionicons
                    name="business"
                    size={24}
                    color={venue.is_occupied === 1 ? '#D85A30' : '#1D9E75'}
                  />
                </View>
                <View>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueCampus}>{venue.campus} Campus</Text>
                  <Text style={styles.venueCapacity}>
                    <Ionicons name="people-outline" size={12} color="#a0c4ff" /> {venue.capacity} seats
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: venue.is_occupied === 1 ? '#3d1a0a' : '#0a3d2e' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: venue.is_occupied === 1 ? '#D85A30' : '#1D9E75' }
                ]}>
                  {venue.is_occupied === 1 ? 'Occupied' : 'Free'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => toggleVenueStatus(venue.id, venue.is_occupied)}
            >
              <Text style={styles.toggleText}>
                Mark as {venue.is_occupied === 1 ? 'Free' : 'Occupied'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addBtn: {
    padding: 4,
  },
  form: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#534AB7',
    width: '100%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#534AB7',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#a0c4ff',
    width: '31%',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLbl: {
    fontSize: 11,
    color: '#a0c4ff',
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    color: '#a0c4ff',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: '#0a1a2e',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  venueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: '#1a1a2e',
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  venueCampus: {
    fontSize: 13,
    color: '#a0c4ff',
    marginTop: 2,
  },
  venueCapacity: {
    fontSize: 12,
    color: '#7a9cc4',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  toggleBtn: {
    borderTopWidth: 1,
    borderTopColor: '#1a1650',
    paddingTop: 12,
    alignItems: 'center',
  },
  toggleText: {
    color: '#a0c4ff',
    fontSize: 14,
  },
});