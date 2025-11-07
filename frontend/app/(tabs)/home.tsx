import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useImpactStore } from '../../store/impactStore';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { impact, fetchImpact } = useImpactStore();

  useEffect(() => {
    fetchImpact();
  }, []);

  const quickStats = [
    {
      icon: 'leaf',
      label: 'CO2 Saved',
      value: `${impact?.total_carbon_saved?.toFixed(1) || 0} kg`,
      color: '#10b981',
    },
    {
      icon: 'cash',
      label: 'Money Saved',
      value: `$${impact?.money_saved?.toFixed(0) || 0}`,
      color: '#f59e0b',
    },
    {
      icon: 'flame',
      label: 'Streak',
      value: `${impact?.current_streak || 0} days`,
      color: '#ef4444',
    },
    {
      icon: 'trophy',
      label: 'Credits',
      value: impact?.eco_credits || 0,
      color: '#8b5cf6',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.full_name?.split(' ')[0]}!</Text>
            <Text style={styles.subGreeting}>Ready for a sustainable commute?</Text>
          </View>
          <View style={styles.universityBadge}>
            <Ionicons name="school" size={16} color="#10b981" />
          </View>
        </View>

        <View style={styles.quickStatsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/plan')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="navigate" size={24} color="#10b981" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Plan a Trip</Text>
              <Text style={styles.actionDescription}>Find the best sustainable route</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/impact')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="bar-chart" size={24} color="#8b5cf6" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Impact</Text>
              <Text style={styles.actionDescription}>See your environmental contribution</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#64748b" />
            <Text style={styles.emptyStateText}>No recent trips</Text>
            <Text style={styles.emptyStateSubtext}>Start your first sustainable journey</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  universityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
});
