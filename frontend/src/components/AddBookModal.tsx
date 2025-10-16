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
import { BarCodeScanner } from 'expo-barcode-scanner';
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
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available on Web', 'Barcode scanning is only available on iOS and Android devices. Please enter ISBN manually.');
      return;
    }
    
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        setShowScanner(true);
      } else {
        Alert.alert('Permission Denied', 'Camera permission is required to scan barcodes. Please enable camera access in your device settings.');
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', 'Unable to access camera. Please enter ISBN manually.');
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setShowScanner(false);
    setIsbn(data);
    await fetchAndAddBook(data);
  };

  const fetchAndAddBook = async (isbnCode: string) => {
    if (!isbnCode.trim()) {
      Alert.alert('Error', 'Please enter or scan an ISBN');
      return;
    }

    setLoading(true);
    try {
      // Fetch book info from Google Books API
      const bookInfo = await searchBookByISBN(isbnCode);

      // Add book to database
      await addBook({
        isbn: bookInfo.isbn,
        title: bookInfo.title,
        author: bookInfo.author,
        coverImage: bookInfo.coverImage,
        totalPages: bookInfo.totalPages,
        currentPage: 0,
        status: defaultStatus,
        progress: 0,
        dateAdded: new Date().toISOString(),
      });

      Alert.alert('Success', 'Book added to your library!');
      setIsbn('');
      onBookAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding book:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to add book. Please check the ISBN and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsbn('');
    setShowScanner(false);
    onClose();
  };

  if (showScanner) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
            barCodeTypes={[BarCodeScanner.Constants.BarCodeType.ean13]}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowScanner(false)}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.scannerFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <Text style={styles.scannerText}>Align the barcode within the frame</Text>
          </View>
        </View>
      </Modal>
    );
  }

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
              onPress={requestCameraPermission}
              disabled={loading}
            >
              <Ionicons name="barcode-outline" size={32} color="#4A90E2" />
              <Text style={styles.scanButtonText}>Scan ISBN Barcode</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.inputLabel}>Enter ISBN manually:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ISBN (e.g., 9780545582889)"
              value={isbn}
              onChangeText={setIsbn}
              keyboardType="numeric"
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
    borderColor: '#4A90E2',
    borderStyle: 'dashed',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
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
    backgroundColor: '#F5F5F5',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerHeader: {
    width: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFFFFF',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFFFFF',
  },
  scannerText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 100,
    paddingHorizontal: 40,
  },
});
