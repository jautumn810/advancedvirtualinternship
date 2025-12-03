"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getBooksByStatus } from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Book } from "@/types";
import { useAudioDurations } from "@/hooks/useAudioDuration";
import { formatDuration } from "@/lib/audio";
import { FiClock, FiStar, FiFilter } from "react-icons/fi";
import styles from "./page.module.css";

const FALLBACK_IMAGE = "https://via.placeholder.com/320x480?text=No+Image";

const getDescription = (book: Book): string => {
  const source = book.bookDescription || book.summary || "";
  if (!source) return "";
  const firstSentence = source.split(". ").slice(0, 2).join(". ");
  return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
};

type BookStatus = "all" | "selected" | "recommended" | "suggested";

function BookTile({ book, duration }: { book: Book; duration?: number }) {
  const [imageSrc, setImageSrc] = useState(book.imageLink || FALLBACK_IMAGE);
  const description = useMemo(() => getDescription(book), [book]);

  return (
    <Link href={`/book/${book.id}`} className={styles.bookTile}>
      {book.subscriptionRequired && <span className={styles.badge}>Premium</span>}
      <div className={styles.cover}>
        <Image
          src={imageSrc}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 45vw, 180px"
          onError={() => {
            if (imageSrc !== FALLBACK_IMAGE) {
              setImageSrc(FALLBACK_IMAGE);
            }
          }}
        />
      </div>
      <h3 className={styles.tileTitle}>{book.title}</h3>
      <p className={styles.tileAuthor}>{book.author}</p>
      {description && <p className={styles.tileDescription}>{description}</p>}
      <div className={styles.tileMeta}>
        {duration ? (
          <span className={styles.metaItem}>
            <FiClock aria-hidden="true" />
            {formatDuration(duration)}
          </span>
        ) : null}
        {book.averageRating ? (
          <span className={styles.metaItem}>
            <FiStar aria-hidden="true" />
            {book.averageRating.toFixed(1)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

// Helper function to check if a book matches the search query
const matchesSearch = (book: Book, searchQuery: string): boolean => {
  const query = searchQuery.toLowerCase().trim();
  if (!query) return true;

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

  // Check for abbreviation matches
  const titleWords = title.split(/\s+/);
  const authorWords = author.split(/\s+/);
  const allWords = [...titleWords, ...authorWords];

  // Check if query matches the beginning of any word
  for (const word of allWords) {
    if (word.startsWith(query)) {
      return true;
    }
  }

  // Check if query matches initials
  const initials = allWords
    .map(word => word.charAt(0))
    .join('')
    .toLowerCase();
  if (initials.includes(query)) {
    return true;
  }

  return false;
};

export default function BooksPage() {
  const dispatch = useDispatch();
  const { searchResults } = useSelector((state: RootState) => state.books);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const durations = useAudioDurations(allBooks);

  useEffect(() => {
    const fetchAllBooks = async () => {
      setLoading(true);
      setError(null);

      try {
        const [selected, recommended, suggested] = await Promise.all([
          getBooksByStatus("selected"),
          getBooksByStatus("recommended"),
          getBooksByStatus("suggested"),
        ]);

        const books: Book[] = [];

        // Add selected book
        if (selected) {
          if (Array.isArray(selected)) {
            books.push(...selected);
          } else {
            books.push(selected);
          }
        }

        // Add recommended books
        if (recommended) {
          if (Array.isArray(recommended)) {
            books.push(...recommended);
          } else {
            books.push(recommended);
          }
        }

        // Add suggested books
        if (suggested) {
          if (Array.isArray(suggested)) {
            books.push(...suggested);
          } else {
            books.push(suggested);
          }
        }

        // Remove duplicates based on book ID
        const uniqueBooks = Array.from(
          new Map(books.map((book) => [book.id, book])).values()
        );

        setAllBooks(uniqueBooks);
      } catch (err: any) {
        setError(err.message || "Failed to load books");
      } finally {
        setLoading(false);
      }
    };

    fetchAllBooks();
  }, []);

  // Combine search results with all books if available
  const booksToDisplay = useMemo(() => {
    if (searchResults.length > 0) {
      return searchResults;
    }
    return allBooks;
  }, [allBooks, searchResults]);

  const filteredBooks = useMemo(() => {
    let books = booksToDisplay;

    // Apply local search filter if there's a search query and no global search results
    if (searchQuery.trim() && searchResults.length === 0) {
      books = books.filter(book => matchesSearch(book, searchQuery));
    }

    if (filter === "all") {
      return books;
    }

    return books;
  }, [booksToDisplay, filter, searchQuery, searchResults]);

  const handleRetry = () => {
    setError(null);
    const fetchAllBooks = async () => {
      setLoading(true);
      try {
        const [selected, recommended, suggested] = await Promise.all([
          getBooksByStatus("selected"),
          getBooksByStatus("recommended"),
          getBooksByStatus("suggested"),
        ]);

        const books: Book[] = [];

        if (selected) {
          if (Array.isArray(selected)) {
            books.push(...selected);
          } else {
            books.push(selected);
          }
        }

        if (recommended) {
          if (Array.isArray(recommended)) {
            books.push(...recommended);
          } else {
            books.push(recommended);
          }
        }

        if (suggested) {
          if (Array.isArray(suggested)) {
            books.push(...suggested);
          } else {
            books.push(suggested);
          }
        }

        const uniqueBooks = Array.from(
          new Map(books.map((book) => [book.id, book])).values()
        );

        setAllBooks(uniqueBooks);
      } catch (err: any) {
        setError(err.message || "Failed to load books");
      } finally {
        setLoading(false);
      }
    };
    fetchAllBooks();
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>All Books</h1>
            {!loading && (
              <span className={styles.count}>{filteredBooks.length} books</span>
            )}
          </div>
          <SearchBar 
            localFilterMode={searchResults.length === 0}
            localBooks={allBooks}
            onLocalFilter={(query) => setSearchQuery(query)}
          />
        </header>

        {error && (
          <div className={styles.errorWrapper}>
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
        )}

        <div className={styles.filters}>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === "all" ? styles.active : ""}`}
            onClick={() => setFilter("all")}
          >
            <FiFilter aria-hidden="true" />
            All Books
          </button>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className={styles.grid}>
            {filteredBooks.map((book) => (
              <BookTile key={book.id} book={book} duration={durations[book.id]} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No books found.</p>
            <p>Try adjusting your filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  );
}

