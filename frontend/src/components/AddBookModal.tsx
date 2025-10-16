import React, { useState, useEffect } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { searchBookByISBN, addBook } from '../services/api';

// Lazy load BarCodeScanner only when needed
let BarCodeScanner: any = null;
let barcodeScannerLoaded = false;

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
  const { theme } = useTheme();
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
      // Dynamically load BarCodeScanner only when needed
      if (!barcodeScannerLoaded) {
        const BarcodeModule = await import('expo-barcode-scanner');
        BarCodeScanner = BarcodeModule.BarCodeScanner;
        barcodeScannerLoaded = true;
      }
      
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
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.ean13,
              BarCodeScanner.Constants.BarCodeType.ean8,
              BarCodeScanner.Constants.BarCodeType.code128,
              BarCodeScanner.Constants.BarCodeType.code39,
            ]}
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
          style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Book</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: theme.background, borderColor: theme.primary }]}
              onPress={requestCameraPermission}
              disabled={loading}
            >
              <Ionicons name="barcode-outline" size={32} color={theme.primary} />
              <Text style={[styles.scanButtonText, { color: theme.primary }]}>Scan ISBN Barcode</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            <Text style={[styles.inputLabel, { color: theme.text }]}>Enter ISBN manually:</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
              placeholder="Enter ISBN (e.g., 9780545582889)"
              placeholderTextColor={theme.textSecondary}
              value={isbn}
              onChangeText={setIsbn}
              keyboardType="numeric"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }, loading && styles.addButtonDisabled]}
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
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
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
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonDisabled: {
    opacity: 0.5,
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
