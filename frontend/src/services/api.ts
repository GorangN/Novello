import axios from 'axios';
import { Book, GoogleBookInfo } from '../types';

// For development, use the current origin
// In production, this would be your actual backend URL
const getBaseURL = () => {
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
