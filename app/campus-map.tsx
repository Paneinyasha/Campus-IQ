import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CAMPUSES = [
  {
    id: 1,
    name: 'Main Campus',
    location: 'Gweru, Zimbabwe',
    description: 'The main and largest MSU campus. Home to most faculties and administrative offices.',
    coordinates: { lat: -19.4629, lng: 29.8165 },
    buildings: ['Admin Block', 'Library', 'FSAS', 'FBL', 'FECE', 'Sports Complex', 'Student Union'],
    color: '#1D9E75',
  },
  {
    id: 2,
    name: 'Telone Campus',
    location: 'Gweru, Zimbabwe',
    description: 'Home to the Graduate School of Business Leadership (GSBL) and ICT programs.',
    coordinates: { lat: -19.4521, lng: 29.8201 },
    buildings: ['GSBL Block', 'ICT Labs', 'Lecture Theatres', 'Cafeteria'],
    color: '#534AB7',
  },
  {
    id: 3,
    name: 'Batanai Campus',
    location: 'Gweru, Zimbabwe',
    description: 'A smaller campus offering selected programs in Gweru.',
    coordinates: { lat: -19.4580, lng: 29.8120 },
    buildings: ['Lecture Rooms', 'Admin Office', 'Computer Lab'],
    color: '#D85A30',
  },
  {
    id: 4,
    name: 'Harare Campus',
    location: 'Harare, Zimbabwe',
    description: 'MSU campus in the capital city offering various programs.',
    coordinates: { lat: -17.8252, lng: 31.0335 },
    buildings: ['Lecture Theatres', 'Admin Block', 'Computer Labs', 'Library'],
    color: '#FFD700',
  },
  {
    id: 5,
    name: 'Zvishavane Campus',
    location: 'Zvishavane, Zimbabwe',
    description: 'MSU campus in Zvishavane serving students in the Midlands region.',
    coordinates: { lat: -20.3333, lng: 30.0333 },
    buildings: ['Lecture Rooms', 'Admin Office', 'Labs'],
    color: '#a0c4ff',
  },
  {
    id: 6,
    name: 'Bulawayo Campus',
    location: 'Bulawayo, Zimbabwe',
    description: 'MSU campus in Zimbabwe\'s second largest city.',
    coordinates: { lat: -20.1325, lng: 28.6264 },
    buildings: ['Lecture Theatres', 'Admin Block', 'Computer Labs'],
    color: '#F0997B',
  },
];

export default function CampusMap() {
  const router = useRouter();
  const [selectedCampus, setSelectedCampus] = useState<any>(null);

  const openInMaps = (campus: any) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${campus.coordinates.lat},${campus.coordinates.lng}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Campus Map</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#a0c4ff" />
        <Text style={styles.infoText}>
          Tap a campus to see details. Tap the map icon to open in Google Maps.
        </Text>
      </View>

      <View style={styles.mapVisual}>
        <View style={styles.mapHeader}>
          <Ionicons name="map" size={24} color="#FFD700" />
          <Text style={styles.mapHeaderText}>MSU Campuses — Zimbabwe</Text>
        </View>

        {CAMPUSES.map((campus) => (
          <TouchableOpacity
            key={campus.id}
            style={[styles.mapPin, { borderColor: campus.color }]}
            onPress={() => setSelectedCampus(
              selectedCampus?.id === campus.id ? null : campus
            )}
          >
            <View style={[styles.pinDot, { backgroundColor: campus.color }]} />
            <View style={styles.pinInfo}>
              <Text style={styles.pinName}>{campus.name}</Text>
              <Text style={styles.pinLocation}>{campus.location}</Text>
            </View>
            <Ionicons
              name={selectedCampus?.id === campus.id ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#a0c4ff"
            />
          </TouchableOpacity>
        ))}
      </View>

      {selectedCampus && (
        <View style={[styles.detailCard, { borderColor: selectedCampus.color }]}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailName}>{selectedCampus.name}</Text>
              <Text style={styles.detailLocation}>
                <Ionicons name="location-outline" size={14} color="#a0c4ff" /> {selectedCampus.location}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.mapsBtn, { backgroundColor: selectedCampus.color }]}
              onPress={() => openInMaps(selectedCampus)}
            >
              <Ionicons name="map-outline" size={20} color="#ffffff" />
              <Text style={styles.mapsBtnText}>Open Maps</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.detailDesc}>{selectedCampus.description}</Text>

          <Text style={styles.buildingsTitle}>Buildings & Facilities</Text>
          <View style={styles.buildingsList}>
            {selectedCampus.buildings.map((building: string, i: number) => (
              <View key={i} style={[styles.buildingTag, { borderColor: selectedCampus.color }]}>
                <Ionicons name="business-outline" size={14} color={selectedCampus.color} />
                <Text style={[styles.buildingText, { color: selectedCampus.color }]}>
                  {building}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.coordBox}>
            <Ionicons name="navigate-outline" size={16} color="#a0c4ff" />
            <Text style={styles.coordText}>
              {selectedCampus.coordinates.lat}, {selectedCampus.coordinates.lng}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>All MSU Campuses</Text>
        {CAMPUSES.map((campus) => (
          <View key={campus.id} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: campus.color }]} />
            <Text style={styles.legendName}>{campus.name}</Text>
            <Text style={styles.legendCity}>{campus.location.split(',')[0]}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001f4d',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    color: '#a0c4ff',
    fontSize: 13,
    flex: 1,
  },
  mapVisual: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a5a',
  },
  mapHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  mapPin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: '#001f4d',
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pinInfo: {
    flex: 1,
  },
  pinName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  pinLocation: {
    fontSize: 12,
    color: '#a0c4ff',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  detailLocation: {
    fontSize: 13,
    color: '#a0c4ff',
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  mapsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  detailDesc: {
    fontSize: 14,
    color: '#a0c4ff',
    lineHeight: 22,
    marginBottom: 16,
  },
  buildingsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  buildingsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  buildingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#001f4d',
  },
  buildingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#001f4d',
    padding: 10,
    borderRadius: 8,
  },
  coordText: {
    color: '#7a9cc4',
    fontSize: 12,
  },
  legendCard: {
    backgroundColor: '#0a2a4a',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 14,
    padding: 16,
    marginBottom: 40,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 14,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendName: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  legendCity: {
    fontSize: 12,
    color: '#a0c4ff',
  },
});