import { Book } from '@/types';

const BASE_URL = 'https://us-central1-summaristt.cloudfunctions.net';

const retryRequest = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const getBooksByStatus = async (status: 'selected' | 'recommended' | 'suggested'): Promise<Book | Book[]> => {
  return retryRequest(async () => {
    const response = await fetch(`${BASE_URL}/getBooks?status=${status}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch books: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  });
};

export const getBookById = async (id: string): Promise<Book> => {
  return retryRequest(async () => {
    // Ensure ID is properly encoded
    const encodedId = encodeURIComponent(id);
    const url = `${BASE_URL}/getBook?id=${encodedId}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Book with ID "${id}" not found`);
      }
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(`Failed to fetch book: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response from server');
    }
    
    return data as Book;
  });
};

/**
 * Helper function to check if a book matches the search query
 * Supports partial matches, case-insensitive search, and abbreviations
 */
const matchesSearch = (book: Book, searchQuery: string): boolean => {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return false;

  const title = book.title.toLowerCase();
  const author = book.author.toLowerCase();
  const subTitle = book.subTitle?.toLowerCase() || '';

  // Check for exact or partial matches in title
  if (title.includes(query) || subTitle.includes(query)) {
    return true;
  }

  // Check for exact or partial matches in author
  if (author.includes(query)) {
    return true;
  }

  // Check for abbreviation matches (e.g., "HP" matches "Harry Potter")
  // Split title and author into words and check if query matches the beginning of any word
  const titleWords = title.split(/\s+/);
  const authorWords = author.split(/\s+/);
  const allWords = [...titleWords, ...authorWords];

  // Check if query matches the beginning of any word (for abbreviations)
  for (const word of allWords) {
    if (word.startsWith(query)) {
      return true;
    }
  }

  // Check if query matches initials (e.g., "JK" matches "J.K. Rowling" or "J K Rowling")
  const initials = allWords
    .map(word => word.charAt(0))
    .join('')
    .toLowerCase();
  if (initials.includes(query)) {
    return true;
  }

  return false;
};

export const searchBooks = async (search: string, localBooks?: Book[]): Promise<Book[]> => {
  if (!search.trim()) {
    return [];
  }

  const searchQuery = search.trim();

  try {
    // Use the API endpoint for searching books by author or title
    const apiResults = await retryRequest(async () => {
      const response = await fetch(
        `${BASE_URL}/getBooksByAuthorOrTitle?search=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    });

    // Remove duplicates based on book ID
    const uniqueBooks = Array.from(
      new Map(apiResults.map((book: Book) => [book.id, book])).values()
    );

    return uniqueBooks;
  } catch (error) {
    // If API fails, search through local books only as fallback
    if (localBooks && localBooks.length > 0) {
      const localMatches = localBooks.filter((book: Book) => matchesSearch(book, searchQuery));
      return Array.from(
        new Map(localMatches.map(book => [book.id, book])).values()
      );
    }
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
