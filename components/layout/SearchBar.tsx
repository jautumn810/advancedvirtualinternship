"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const isNavigatingRef = useRef(false);
  
  // Restore search query from URL or maintain it across navigation
  useEffect(() => {
    // Keep search query when navigating to for-you page
    if (pathname === "/for-you" && inputRef.current && !inputRef.current.value && searchQuery) {
      // Query is maintained by state, so this is fine
    }
    // Reset navigation flag when pathname changes
    isNavigatingRef.current = false;
  }, [pathname, searchQuery]);
  
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
      // Only clear results if we're on the for-you page, otherwise keep them
      if (pathname === "/for-you") {
        dispatch(setSearchResults([]));
      }
      dispatch(setError(null));
      return;
    }

    let navigationTimeout: NodeJS.Timeout | null = null;

    const performSearch = async () => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      try {
        const searchTerm = debouncedSearchQuery.trim();
        const apiUrl = `https://us-central1-summaristt.cloudfunctions.net/getBooksByAuthorOrTitle?search=${encodeURIComponent(searchTerm)}`;
        
        console.log("Searching for:", searchTerm);
        console.log("API URL:", apiUrl);
        
        // Use the API endpoint directly - searches by author or title
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        const books = Array.isArray(data) ? data : [];
        
        console.log("Search results:", books.length, "books found");
        
        dispatch(setSearchResults(books));
        dispatch(setError(null));
        
        // Don't navigate while user is typing - only navigate after they've stopped typing
        // Check if current query matches debounced query (user has stopped typing)
        const currentQuery = searchQuery.trim();
        const debouncedQuery = debouncedSearchQuery.trim();
        
        // Only navigate if:
        // 1. We're not already on for-you page
        // 2. We have search results
        // 3. User has stopped typing (queries match)
        // 4. We're not already navigating
        if (
          pathname !== "/for-you" && 
          !localFilterMode && 
          books.length > 0 && 
          !isNavigatingRef.current &&
          currentQuery === debouncedQuery &&
          currentQuery.length > 0
        ) {
          // Use a longer delay to ensure user has completely stopped typing
          // This prevents the search bar from disappearing while typing
          navigationTimeout = setTimeout(() => {
            // Double-check query hasn't changed during timeout
            if (searchQuery.trim() === debouncedQuery && !isNavigatingRef.current) {
              isNavigatingRef.current = true;
              router.replace("/for-you");
            }
          }, 500); // Wait 500ms after debounce completes
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

    // Cleanup function
    return () => {
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [debouncedSearchQuery, searchQuery, dispatch, shouldHide, localFilterMode, pathname, router]);

  // Don't hide the search bar - keep it visible even during navigation
  // Only hide on home and choose-plan pages
  if (shouldHide) {
    return null;
  }

  return (
    <div className={styles.root}>
      <FiSearch className={styles.icon} />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for books..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
        onFocus={(e) => {
          // Ensure search bar stays visible on focus
          e.target.select();
        }}
        onBlur={(e) => {
          // Don't clear the search query on blur - keep it visible
        }}
        onKeyDown={(e) => {
          // Prevent form submission or navigation that might hide the search bar
          if (e.key === "Enter") {
            e.preventDefault();
            // Don't navigate on Enter - let debounced search handle it
          }
        }}
        className={styles.input}
        aria-label="Search for books"
        autoComplete="off"
      />
    </div>
  );
}

