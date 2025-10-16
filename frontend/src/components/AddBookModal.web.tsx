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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchBookByISBN, addBook } from '../services/api';

interface AddBookModalProps {
  visible: boolean;
  onClose: () => void;
  onBookAdded: () => void;
  defaultStatus?: string;
}

export default function AddBookModal({
  visible,
  onClose,
  onBookAdded,
  defaultStatus = 'want_to_read',
}: AddBookModalProps) {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAndAddBook = async (isbnCode: string) => {
    if (!isbnCode.trim()) {
      alert('Please enter an ISBN');
      return;
    }

    setLoading(true);
    try {
      // Fetch book info from API
      const bookInfo = await searchBookByISBN(isbnCode);

      // Add book to database with Open Library cover URL
      const coverImageUrl = `https://covers.openlibrary.org/b/isbn/${isbnCode}-L.jpg`;
      
      await addBook({
        isbn: bookInfo.isbn,
        title: bookInfo.title,
        author: bookInfo.author,
        coverImage: coverImageUrl,
        totalPages: bookInfo.totalPages,
        currentPage: 0,
        status: defaultStatus,
        progress: 0,
        dateAdded: new Date().toISOString(),
      });

      alert('Book added to your library!');
      setIsbn('');
      onBookAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding book:', error);
      alert(error.response?.data?.detail || 'Failed to add book. Please check the ISBN and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsbn('');
    onClose();
  };

  const handleScannerClick = () => {
    alert('Barcode scanning is only available on iOS and Android devices. Please enter the ISBN manually or use the Expo Go app on your mobile device.');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Book</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#000000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScannerClick}
              disabled={loading}
            >
              <Ionicons name="barcode-outline" size={32} color="#C7C7CC" />
              <Text style={styles.scanButtonTextDisabled}>
                Scan ISBN (Mobile Only)
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ENTER MANUALLY</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.inputLabel}>ISBN Number:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ISBN (e.g., 9780439708180)"
              value={isbn}
              onChangeText={setIsbn}
              keyboardType="default"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={() => fetchAndAddBook(isbn)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>Add Book</Text>
              )}
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
    maxHeight: '80%',
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  scanButtonTextDisabled: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C7C7CC',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  addButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
