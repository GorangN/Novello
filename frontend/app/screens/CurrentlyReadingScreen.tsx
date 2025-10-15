import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BookCard from '../components/BookCard';
import AddBookModal from '../components/AddBookModal';
import BookDetailsModal from '../components/BookDetailsModal';
import { getBooksByStatus } from '../services/api';
import { Book } from '../types';

export default function CurrentlyReadingScreen() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    try {
      const data = await getBooksByStatus('currently_reading');
      setBooks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load books');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBooks();
  }, []);

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setDetailsModalVisible(true);
  };

  const handleBookAdded = () => {
    fetchBooks();
  };

  const handleBookUpdated = () => {
    fetchBooks();
    setDetailsModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.content}>
        {books.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color="#C7C7CC" />
            <Text style={styles.emptyText}>No books currently reading</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add a book</Text>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BookCard book={item} onPress={() => handleBookPress(item)} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
            }
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <AddBookModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onBookAdded={handleBookAdded}
        defaultStatus="currently_reading"
      />

      {selectedBook && (
        <BookDetailsModal
          visible={detailsModalVisible}
          book={selectedBook}
          onClose={() => setDetailsModalVisible(false)}
          onBookUpdated={handleBookUpdated}
        />
      )}
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
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
