export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  coverImage?: string;
  totalPages: number;
  currentPage: number;
  status: 'read' | 'currently_reading' | 'want_to_read';
  progress: number;
  dateAdded: string;
  dateFinished?: string;
}

export interface GoogleBookInfo {
  title: string;
  author: string;
  coverImage?: string;
  totalPages: number;
  isbn: string;
}
