import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Book } from '@/types';

interface BooksState {
  selectedBook: Book | null;
  recommendedBooks: Book[];
  suggestedBooks: Book[];
  searchResults: Book[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BooksState = {
  selectedBook: null,
  recommendedBooks: [],
  suggestedBooks: [],
  searchResults: [],
  isLoading: false,
  error: null,
};

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    setSelectedBook: (state, action: PayloadAction<Book | null>) => {
      state.selectedBook = action.payload;
    },
    setRecommendedBooks: (state, action: PayloadAction<Book[]>) => {
      state.recommendedBooks = action.payload;
    },
    setSuggestedBooks: (state, action: PayloadAction<Book[]>) => {
      state.suggestedBooks = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<Book[]>) => {
      state.searchResults = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  setSelectedBook, 
  setRecommendedBooks, 
  setSuggestedBooks, 
  setSearchResults,
  setLoading, 
  setError 
} = booksSlice.actions;
export default booksSlice.reducer;

