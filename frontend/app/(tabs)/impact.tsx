import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useImpactStore } from '../../store/impactStore';
import { Ionicons } from '@expo/vector-icons';

export default function ImpactScreen() {
  const { impact, fetchImpact, isLoading } = useImpactStore();

  useEffect(() => {
    fetchImpact();
  }, []);

  const achievements = [
    { id: 'first_trip', name: 'First Trip', icon: 'rocket', earned: (impact?.total_trips || 0) >= 1 },
    { id: 'eco_starter', name: 'Eco Starter', icon: 'leaf', earned: (impact?.total_trips || 0) >= 10 },
    { id: '50kg_saver', name: '50kg Saver', icon: 'checkmark-circle', earned: (impact?.total_carbon_saved || 0) >= 50 },
    { id: '100kg_saver', name: '100kg Saver', icon: 'trophy', earned: (impact?.total_carbon_saved || 0) >= 100 },
    { id: 'week_warrior', name: 'Week Warrior', icon: 'flame', earned: (impact?.current_streak || 0) >= 7 },
    { id: 'mode_master', name: 'Mode Master', icon: 'apps', earned: Object.keys(impact?.trips_by_mode || {}).filter(k => (impact?.trips_by_mode?.[k] || 0) > 0).length >= 3 },
  ];

  const treesEquivalent = ((impact?.total_carbon_saved || 0) / 20 * 365).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your Impact</Text>
        <Text style={styles.subtitle}>Making a difference, one trip at a time</Text>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="earth" size={48} color="#10b981" />
          </View>
          <Text style={styles.heroValue}>{impact?.total_carbon_saved?.toFixed(1) || 0} kg</Text>
          <Text style={styles.heroLabel}>CO2 Saved</Text>
          <Text style={styles.heroSubtext}>Equivalent to {treesEquivalent} trees planted</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>${impact?.money_saved?.toFixed(0) || 0}</Text>
            <Text style={styles.statLabel}>Money Saved</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="map" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{impact?.sustainable_miles?.toFixed(0) || 0}</Text>
            <Text style={styles.statLabel}>Green Miles</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color="#10b981" />
            <Text style={styles.statValue}>{impact?.total_trips || 0}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#ef4444" />
            <Text style={styles.statValue}>{impact?.current_streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eco Credits</Text>
          <View style={styles.creditsCard}>
            <View style={styles.creditsHeader}>
              <Ionicons name="star" size={32} color="#f59e0b" />
              <Text style={styles.creditsValue}>{impact?.eco_credits || 0}</Text>
            </View>
            <Text style={styles.creditsLabel}>Credits Available</Text>
            <Text style={styles.creditsSubtext}>
              Redeem for rewards, discounts, and more!
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trips by Mode</Text>
          <View style={styles.modesGrid}>
            <View style={styles.modeCard}>
              <Ionicons name="car" size={24} color="#10b981" />
              <Text style={styles.modeValue}>{impact?.trips_by_mode?.carpool || 0}</Text>
              <Text style={styles.modeLabel}>Carpool</Text>
            </View>
            <View style={styles.modeCard}>
              <Ionicons name="bus" size={24} color="#3b82f6" />
              <Text style={styles.modeValue}>{impact?.trips_by_mode?.transit || 0}</Text>
              <Text style={styles.modeLabel}>Transit</Text>
            </View>
            <View style={styles.modeCard}>
              <Ionicons name="bicycle" size={24} color="#f59e0b" />
              <Text style={styles.modeValue}>{impact?.trips_by_mode?.bike || 0}</Text>
              <Text style={styles.modeLabel}>Bike</Text>
            </View>
            <View style={styles.modeCard}>
              <Ionicons name="walk" size={24} color="#8b5cf6" />
              <Text style={styles.modeValue}>{impact?.trips_by_mode?.walk || 0}</Text>
              <Text style={styles.modeLabel}>Walk</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.earned && styles.achievementLocked,
                ]}
              >
                <Ionicons
                  name={achievement.icon as any}
                  size={32}
                  color={achievement.earned ? '#10b981' : '#64748b'}
                />
                <Text style={[
                  styles.achievementName,
                  !achievement.earned && styles.achievementNameLocked,
                ]}>
                  {achievement.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  creditsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginLeft: 12,
  },
  creditsLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  creditsSubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4,
  },
  modeLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  achievementLocked: {
    borderColor: '#334155',
    opacity: 0.5,
  },
  achievementName: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementNameLocked: {
    color: '#64748b',
  },
});
