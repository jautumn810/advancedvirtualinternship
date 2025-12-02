"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const pathname = usePathname();
  const shouldHide = pathname === "/" || pathname === "/choose-plan";
  
  // Get locally available books to enhance search
  const { selectedBook, recommendedBooks, suggestedBooks } = useSelector(
    (state: RootState) => state.books
  );
  
  // Memoize local books to avoid unnecessary re-renders
  const reduxLocalBooks = useMemo(() => [
    ...(selectedBook ? [selectedBook] : []),
    ...recommendedBooks,
    ...suggestedBooks,
  ], [selectedBook, recommendedBooks, suggestedBooks]);

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
      return;
    }

    dispatch(setLoading(true));
    searchBooks(debouncedSearchQuery, localBooks)
      .then((books) => {
        dispatch(setSearchResults(books));
        dispatch(setError(null));
      })
      .catch((error) => {
        dispatch(setError(error.message));
        dispatch(setSearchResults([]));
      })
      .finally(() => {
        dispatch(setLoading(false));
      });
  }, [debouncedSearchQuery, dispatch, shouldHide, localBooks, localFilterMode]);

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
      />
    </div>
  );
}

