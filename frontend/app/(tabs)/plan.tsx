import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../../store/tripStore';
import { useImpactStore } from '../../store/impactStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

const TRANSPORT_MODES = [
  { id: 'carpool', name: 'Carpool', icon: 'car', color: '#10b981', co2: '48%' },
  { id: 'transit', name: 'Transit', icon: 'bus', color: '#3b82f6', co2: '78%' },
  { id: 'bike', name: 'Bike', icon: 'bicycle', color: '#f59e0b', co2: '100%' },
  { id: 'walk', name: 'Walk', icon: 'walk', color: '#8b5cf6', co2: '100%' },
];

export default function PlanTripScreen() {
  const { searchTrip, isSearching } = useTripStore();
  const { recordTrip } = useImpactStore();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedMode, setSelectedMode] = useState('carpool');
  const [departureTime, setDepartureTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!origin || !destination) {
      Alert.alert('Error', 'Please enter both origin and destination');
      return;
    }

    try {
      await searchTrip({
        origin: {
          latitude: 37.7749 + Math.random() * 0.1,
          longitude: -122.4194 + Math.random() * 0.1,
          address: origin,
        },
        destination: {
          latitude: 37.7749 + Math.random() * 0.1,
          longitude: -122.4194 + Math.random() * 0.1,
          address: destination,
        },
        departure_time: departureTime.toISOString(),
        mode: selectedMode,
        flexibility_minutes: 15,
      });
      setShowResults(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to search for trips');
    }
  };

  const handleCompleteTrip = async () => {
    await recordTrip({
      mode: selectedMode,
      distance_km: 10,
      passengers: 2,
    });
    Alert.alert('Success', 'Trip completed! Your impact has been recorded.');
    setShowResults(false);
    setOrigin('');
    setDestination('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Plan Your Trip</Text>
        <Text style={styles.subtitle}>Find the most sustainable route</Text>

        <View style={styles.section}>
          <Text style={styles.label}>From</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#10b981" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter origin"
              placeholderTextColor="#64748b"
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>To</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="flag" size={20} color="#ef4444" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              placeholderTextColor="#64748b"
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Departure Time</Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="time" size={20} color="#3b82f6" style={styles.inputIcon} />
            <Text style={styles.timeText}>{format(departureTime, 'MMM dd, yyyy hh:mm a')}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={departureTime}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setDepartureTime(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Transport Mode</Text>
          <View style={styles.modesContainer}>
            {TRANSPORT_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeCard,
                  selectedMode === mode.id && styles.modeCardSelected,
                ]}
                onPress={() => setSelectedMode(mode.id)}
              >
                <View
                  style={[
                    styles.modeIcon,
                    { backgroundColor: `${mode.color}20` },
                  ]}
                >
                  <Ionicons name={mode.icon as any} size={24} color={mode.color} />
                </View>
                <Text style={styles.modeName}>{mode.name}</Text>
                <Text style={styles.modeCo2}>{mode.co2} less CO2</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!showResults ? (
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.buttonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Ionicons name="search" size={20} color="#ffffff" />
            <Text style={styles.searchButtonText}>
              {isSearching ? 'Searching...' : 'Find Routes'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Route Found!</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name={TRANSPORT_MODES.find((m) => m.id === selectedMode)?.icon as any}
                  size={32}
                  color="#10b981"
                />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultMode}>
                    {TRANSPORT_MODES.find((m) => m.id === selectedMode)?.name}
                  </Text>
                  <Text style={styles.resultRoute}>{origin} to {destination}</Text>
                </View>
              </View>

              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Ionicons name="time" size={20} color="#64748b" />
                  <Text style={styles.resultStatText}>~25 min</Text>
                </View>
                <View style={styles.resultStat}>
                  <Ionicons name="leaf" size={20} color="#10b981" />
                  <Text style={styles.resultStatText}>-4.8 kg CO2</Text>
                </View>
                <View style={styles.resultStat}>
                  <Ionicons name="cash" size={20} color="#f59e0b" />
                  <Text style={styles.resultStatText}>$3.50 saved</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteTrip}
            >
              <Text style={styles.completeButtonText}>Complete Trip</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  timeText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  modeCardSelected: {
    borderColor: '#10b981',
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  modeCo2: {
    fontSize: 12,
    color: '#64748b',
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 16,
  },
  resultMode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultRoute: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  resultStat: {
    alignItems: 'center',
  },
  resultStatText: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
