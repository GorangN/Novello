import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = typeof window !== 'undefined' ? window.location.origin : '';

interface Stats {
  total_books: number;
  books_read: number;
  books_reading: number;
  books_to_read: number;
  total_pages_read: number;
  average_progress: number;
  books_by_month: Record<string, number>;
}

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`, {
        withCredentials: true,
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load statistics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Reading Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Ionicons name="library" size={32} color="#4A90E2" />
            <Text style={styles.statNumber}>{stats.total_books}</Text>
            <Text style={styles.statLabel}>Total Books</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color="#34C759" />
            <Text style={styles.statNumber}>{stats.books_read}</Text>
            <Text style={styles.statLabel}>Books Read</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="book" size={32} color="#FF9500" />
            <Text style={styles.statNumber}>{stats.books_reading}</Text>
            <Text style={styles.statLabel}>Reading Now</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="bookmark" size={32} color="#5856D6" />
            <Text style={styles.statNumber}>{stats.books_to_read}</Text>
            <Text style={styles.statLabel}>Want to Read</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Pages Read</Text>
          </View>
          <View style={styles.pagesCard}>
            <Text style={styles.pagesNumber}>{stats.total_pages_read.toLocaleString()}</Text>
            <Text style={styles.pagesLabel}>Total Pages</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color="#4A90E2" />
            <Text style={styles.sectionTitle}>Average Progress</Text>
          </View>
          <View style={styles.progressCard}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.average_progress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{stats.average_progress}%</Text>
          </View>
        </View>

        {Object.keys(stats.books_by_month).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Books Finished by Month</Text>
            </View>
            {Object.entries(stats.books_by_month)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, count]) => (
                <View key={month} style={styles.monthRow}>
                  <Text style={styles.monthLabel}>{month}</Text>
                  <View style={styles.monthBar}>
                    <View
                      style={[
                        styles.monthBarFill,
                        {
                          width: `${(count / Math.max(...Object.values(stats.books_by_month))) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.monthCount}>{count}</Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryCard: {
    width: '98%',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  pagesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pagesNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#4A90E2',
  },
  pagesLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  monthLabel: {
    width: 80,
    fontSize: 14,
    color: '#000000',
  },
  monthBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  monthBarFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  monthCount: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    textAlign: 'right',
  },
});
