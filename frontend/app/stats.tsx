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
import { useTheme } from '../src/context/ThemeContext';
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
  const { theme } = useTheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Failed to load statistics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>Reading Statistics</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard, { backgroundColor: theme.card }]}>
            <Ionicons name="library" size={32} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.total_books}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Books</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-circle" size={32} color={theme.success} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.books_read}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Books Read</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="book" size={32} color="#FF9500" />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.books_reading}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reading Now</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="bookmark" size={32} color="#5856D6" />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.books_to_read}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Want to Read</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pages Read</Text>
          </View>
          <View style={[styles.pagesCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.pagesNumber, { color: theme.primary }]}>{stats.total_pages_read.toLocaleString()}</Text>
            <Text style={[styles.pagesLabel, { color: theme.textSecondary }]}>Total Pages</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={24} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Average Progress</Text>
          </View>
          <View style={[styles.progressCard, { backgroundColor: theme.card }]}>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.average_progress}%`, backgroundColor: theme.primary },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.primary }]}>{stats.average_progress}%</Text>
          </View>
        </View>

        {Object.keys(stats.books_by_month).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Books Finished by Month</Text>
            </View>
            {Object.entries(stats.books_by_month)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([month, count]) => (
                <View key={month} style={[styles.monthRow, { backgroundColor: theme.card }]}>
                  <Text style={[styles.monthLabel, { color: theme.text }]}>{month}</Text>
                  <View style={[styles.monthBar, { backgroundColor: theme.border }]}>
                    <View
                      style={[
                        styles.monthBarFill,
                        {
                          width: `${(count / Math.max(...Object.values(stats.books_by_month))) * 100}%`,
                          backgroundColor: theme.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.monthCount, { color: theme.primary }]}>{count}</Text>
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
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
    marginLeft: 8,
  },
  pagesCard: {
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
  },
  pagesLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  progressCard: {
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
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  monthLabel: {
    width: 80,
    fontSize: 14,
  },
  monthBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  monthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  monthCount: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
