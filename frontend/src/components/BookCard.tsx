import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onPress: () => void;
}

export default function BookCard({ book, onPress }: BookCardProps) {
  // Generate cover image URL from ISBN if not available
  const getCoverImageUrl = () => {
    if (book.coverImage && book.coverImage.startsWith('data:image')) {
      return book.coverImage;
    }
    // Use Open Library cover API as fallback
    return `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.coverContainer}>
        <Image 
          source={{ uri: getCoverImageUrl() }} 
          style={styles.cover}
          defaultSource={require('../../assets/images/icon.png')}
        />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(book.progress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(book.progress)}%
          </Text>
        </View>

        <Text style={styles.pagesText}>
          {book.currentPage} / {book.totalPages} pages
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  coverContainer: {
    marginRight: 12,
  },
  cover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  placeholderCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    minWidth: 40,
    textAlign: 'right',
  },
  pagesText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
});
