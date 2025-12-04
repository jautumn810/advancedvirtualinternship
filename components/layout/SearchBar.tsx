"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store";
import { setSearchResults, setLoading, setError } from "@/store/slices/booksSlice";
import { searchBooks } from "@/lib/api";
import { FiSearch } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { Book } from "@/types";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  localBooks?: Book[];
  onLocalFilter?: (query: string) => void;
  localFilterMode?: boolean;
}

export default function SearchBar({ localBooks: propLocalBooks, onLocalFilter, localFilterMode = false }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const shouldHide = pathname === "/" || pathname === "/choose-plan";
  
  // Get locally available books to enhance search
  const { selectedBook, recommendedBooks, suggestedBooks } = useSelector(
    (state: RootState) => state.books
  );
  
  // Memoize local books to avoid unnecessary re-renders
  // Include searchResults to search through previously found books too
  const reduxLocalBooks = useMemo(() => {
    const books = [
      ...(selectedBook ? [selectedBook] : []),
      ...recommendedBooks,
      ...suggestedBooks,
    ];
    // Remove duplicates
    const uniqueBooks = Array.from(
      new Map(books.map(book => [book.id, book])).values()
    );
    return uniqueBooks;
  }, [selectedBook, recommendedBooks, suggestedBooks]);

  // Use prop books if provided, otherwise use Redux books
  const localBooks = propLocalBooks || reduxLocalBooks;

  // Handle local filtering mode (for library page)
  useEffect(() => {
    if (localFilterMode && onLocalFilter) {
      onLocalFilter(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, localFilterMode, onLocalFilter]);

  // Handle debounced search (global search mode)
  useEffect(() => {
    if (localFilterMode || shouldHide) {
      return;
    }

    if (!debouncedSearchQuery.trim()) {
      dispatch(setSearchResults([]));
      dispatch(setError(null));
      return;
    }

    const performSearch = async () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      try {
        // Use the API endpoint directly
        const response = await fetch(
          `https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search=${encodeURIComponent(debouncedSearchQuery.trim())}`
        );
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        const books = Array.isArray(data) ? data : [];
        
        dispatch(setSearchResults(books));
        dispatch(setError(null));
        
        // Navigate to for-you page to show search results if not already there
        if (books.length > 0 && pathname !== "/for-you" && !localFilterMode) {
          router.push("/for-you");
        }
      } catch (error: any) {
        console.error("Search error:", error);
        dispatch(setError(error.message || "Search failed. Please try again."));
        dispatch(setSearchResults([]));
      } finally {
        dispatch(setLoading(false));
      }
    };

    performSearch();
  }, [debouncedSearchQuery, dispatch, shouldHide, localFilterMode, pathname, router]);

  if (shouldHide) {
    return null;
  }

  return (
    <div className={styles.root}>
      <FiSearch className={styles.icon} />
      <input
        type="text"
        placeholder="Search for books..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.input}
        aria-label="Search for books"
      />
    </div>
  );
}

