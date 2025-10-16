import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Book, GoogleBookInfo } from '../types';

// Get backend URL from environment or use appropriate default
const getBaseURL = () => {
  // For native apps (iOS/Android)
  if (Platform.OS !== 'web') {
    // Get the packager hostname from Expo constants
    const packagerHostname = Constants.expoConfig?.hostUri;
    
    if (packagerHostname) {
      // Use the same host as the packager for API calls
      // This ensures requests go through the Expo tunnel
      const host = packagerHostname.split(':')[0];
      return `http://${host}`;
    }
    
    // Last resort fallback
    return 'http://localhost:8001';
  }
  
  // For web
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return '';
};

const api = axios.create({
  baseURL: `${getBaseURL()}/api`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Search book by ISBN
export const searchBookByISBN = async (isbn: string): Promise<GoogleBookInfo> => {
  const response = await api.get(`/books/search/${isbn}`);
  return response.data;
};

// Add a new book
export const addBook = async (book: Omit<Book, 'id'>): Promise<Book> => {
  const response = await api.post('/books', book);
  return response.data;
};

// Get all books
export const getAllBooks = async (): Promise<Book[]> => {
  const response = await api.get('/books');
  return response.data;
};

// Get books by status
export const getBooksByStatus = async (status: string): Promise<Book[]> => {
  const response = await api.get(`/books/status/${status}`);
  return response.data;
};

// Get single book
export const getBook = async (bookId: string): Promise<Book> => {
  const response = await api.get(`/books/${bookId}`);
  return response.data;
};

// Update book
export const updateBook = async (
  bookId: string,
  updates: { currentPage?: number; status?: string }
): Promise<Book> => {
  const response = await api.put(`/books/${bookId}`, updates);
  return response.data;
};

// Delete book
export const deleteBook = async (bookId: string): Promise<void> => {
  await api.delete(`/books/${bookId}`);
};
