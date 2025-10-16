import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Book } from '../types';
import { updateBook, deleteBook } from '../services/api';

interface BookDetailsModalProps {
  visible: boolean;
  book: Book;
  onClose: () => void;
  onBookUpdated: () => void;
}

export default function BookDetailsModal({
  visible,
  book,
  onClose,
  onBookUpdated,
}: BookDetailsModalProps) {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(book.currentPage.toString());
  const [loading, setLoading] = useState(false);

  const handleUpdateProgress = async () => {
    const page = parseInt(currentPage);
    if (isNaN(page) || page < 0 || page > book.totalPages) {
      Alert.alert('Invalid Page', 'Please enter a valid page number');
      return;
    }

    setLoading(true);
    try {
      await updateBook(book.id, { currentPage: page });
      Alert.alert('Success', 'Progress updated!');
      onBookUpdated();
    } catch (error) {
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateBook(book.id, { status: newStatus });
      Alert.alert('Success', 'Book status updated!');
      onBookUpdated();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFinished = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Mark this book as read?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Mark as Finished',
            'Mark this book as read?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Mark as Read', onPress: () => resolve(true) },
            ]
          );
        });
    
    if (confirmed) {
      setLoading(true);
      try {
        await updateBook(book.id, { status: 'read' });
        if (Platform.OS === 'web') {
          alert('Book marked as read!');
        } else {
          Alert.alert('Success', 'Book marked as read!');
        }
        onBookUpdated();
      } catch (error) {
        if (Platform.OS === 'web') {
          alert('Failed to update book');
        } else {
          Alert.alert('Error', 'Failed to update book');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteBook = async () => {
    // Use native confirm on web, Alert on mobile
    const confirmed = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to remove this book from your library?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Delete Book',
            'Are you sure you want to remove this book from your library?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
    
    if (confirmed) {
      setLoading(true);
      try {
        await deleteBook(book.id);
        if (Platform.OS === 'web') {
          alert('Book removed from library');
        } else {
          Alert.alert('Success', 'Book removed from library');
        }
        onBookUpdated();
      } catch (error) {
        if (Platform.OS === 'web') {
          alert('Failed to delete book');
        } else {
          Alert.alert('Error', 'Failed to delete book');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.bookHeader}>
              {book.coverImage ? (
                <Image source={{ uri: book.coverImage }} style={styles.coverLarge} />
              ) : (
                <View style={styles.placeholderCoverLarge}>
                  <Ionicons name="book" size={60} color="#C7C7CC" />
                </View>
              )}
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{book.title}</Text>
                <Text style={styles.bookAuthor}>{book.author}</Text>
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
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Progress</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Page:</Text>
                <View style={styles.pageInputRow}>
                  <TextInput
                    style={styles.pageInput}
                    value={currentPage}
                    onChangeText={setCurrentPage}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.totalPages}>/ {book.totalPages}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleUpdateProgress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Update Progress</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Change Status</Text>
              <TouchableOpacity
                style={[styles.statusButton, book.status === 'want_to_read' && styles.statusButtonActive]}
                onPress={() => handleChangeStatus('want_to_read')}
                disabled={loading || book.status === 'want_to_read'}
              >
                <Ionicons name="bookmark" size={20} color={book.status === 'want_to_read' ? '#FFFFFF' : '#4A90E2'} />
                <Text style={[styles.statusButtonText, book.status === 'want_to_read' && styles.statusButtonTextActive]}>
                  Want to Read
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, book.status === 'currently_reading' && styles.statusButtonActive]}
                onPress={() => handleChangeStatus('currently_reading')}
                disabled={loading || book.status === 'currently_reading'}
              >
                <Ionicons name="book" size={20} color={book.status === 'currently_reading' ? '#FFFFFF' : '#4A90E2'} />
                <Text style={[styles.statusButtonText, book.status === 'currently_reading' && styles.statusButtonTextActive]}>
                  Currently Reading
                </Text>
              </TouchableOpacity>
              {book.status !== 'read' && (
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={handleMarkAsFinished}
                  disabled={loading}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.finishButtonText}>Mark as Finished</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteBook}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Remove from Library</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  modalBody: {
    padding: 20,
  },
  bookHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  coverLarge: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 16,
  },
  placeholderCoverLarge: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    minWidth: 45,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  pageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
    width: 100,
  },
  totalPages: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 12,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statusButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  statusButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  finishButtonText: {
    fontSize: 16,
    color: '#34C759',
    marginLeft: 8,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '600',
  },
});
