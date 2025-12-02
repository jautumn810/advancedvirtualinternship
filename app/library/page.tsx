"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiBook, FiCheckCircle } from "react-icons/fi";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import BookCard from "@/components/book/BookCard";
import LibraryBookCard from "@/components/book/LibraryBookCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  getLibraryBooks,
  getFinishedBooks,
  removeFromLibrary,
  LibraryBook,
  FinishedBook,
} from "@/lib/library";
import { useAudioDurations } from "@/hooks/useAudioDuration";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { Book } from "@/types";
import styles from "./page.module.css";
import typographyStyles from "@/styles/components/typography.module.css";
import buttonStyles from "@/styles/components/button.module.css";

const SKELETON_COUNT = 5;

export default function LibraryPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [savedBooks, setSavedBooks] = useState<LibraryBook[]>([]);
  const [finishedBooks, setFinishedBooks] = useState<FinishedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setSavedBooks([]);
      setFinishedBooks([]);
      return;
    }

    const fetchLibrary = async () => {
      try {
        setLoading(true);
        const [saved, finished] = await Promise.all([
          getLibraryBooks(user.uid),
          getFinishedBooks(user.uid),
        ]);
        setSavedBooks(saved);
        setFinishedBooks(finished);
      } catch (error) {
        console.error("Error fetching library:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, [user]);

  const allLibraryBooks = useMemo(
    () => [...savedBooks, ...finishedBooks] as Book[],
    [savedBooks, finishedBooks]
  );
  const durations = useAudioDurations(allLibraryBooks);

  // Filter books based on search query
  const filteredSavedBooks = useMemo(() => {
    if (!searchQuery.trim()) return savedBooks;
    return savedBooks.filter(book => matchesSearch(book, searchQuery));
  }, [savedBooks, searchQuery]);

  const filteredFinishedBooks = useMemo(() => {
    if (!searchQuery.trim()) return finishedBooks;
    return finishedBooks.filter(book => matchesSearch(book, searchQuery));
  }, [finishedBooks, searchQuery]);

  const handleLogin = () => {
    dispatch(setAuthModalOpen(true));
  };

  const handleRemoveFromLibrary = async (bookId: string) => {
    if (!user) return;

    const confirmed = window.confirm("Remove this book from your library?");
    if (!confirmed) return;

    try {
      setRemoving(bookId);
      await removeFromLibrary(user.uid, bookId);
      const [saved, finished] = await Promise.all([
        getLibraryBooks(user.uid),
        getFinishedBooks(user.uid),
      ]);
      setSavedBooks(saved);
      setFinishedBooks(finished);
    } catch (error) {
      console.error("Error removing book:", error);
      alert("Failed to remove book. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  const renderSkeletonGrid = (count = SKELETON_COUNT) => (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );

  const renderLibraryGrid = (books: LibraryBook[]) => (
    <div className={styles.grid}>
      {books.map((book) => (
        <LibraryBookCard
          key={book.id}
          book={book}
          duration={durations[book.id]}
          onRemove={() => handleRemoveFromLibrary(book.id)}
          isRemoving={removing === book.id}
        />
      ))}
    </div>
  );

  const renderFinishedGrid = (books: FinishedBook[]) => (
    <div className={styles.grid}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} duration={durations[book.id]} />
      ))}
    </div>
  );

  if (!user) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={typographyStyles.h2}>My Library</h1>
          </div>
            <SearchBar 
              localFilterMode={true}
              localBooks={allLibraryBooks}
              onLocalFilter={(query) => setSearchQuery(query)}
            />
          </header>

          <section className={styles.section}>
            <div className={styles.ctaCard}>
              <FiBook className={styles.ctaIcon} />
              <div className={styles.ctaWrapper}>
                <h2 className={styles.ctaHeading}>Please log in</h2>
                <p className={styles.ctaBody}>
                  Sign in to save books for later, track your progress, and sync
                  your library across all devices.
                </p>
              </div>
              <button
                type="button"
                className={`${buttonStyles.btn} ${buttonStyles.btnPrimary} ${buttonStyles.md}`}
                onClick={handleLogin}
              >
                Log in
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <h1 className={typographyStyles.h2}>My Library</h1>
            {(savedBooks.length > 0 || finishedBooks.length > 0) && (
              <span className={styles.titleCount}>
                {savedBooks.length + finishedBooks.length} titles
              </span>
            )}
          </div>
          <SearchBar 
            localFilterMode={true}
            localBooks={allLibraryBooks}
            onLocalFilter={(query) => setSearchQuery(query)}
          />
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>
              <FiBook />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>Saved Books</h2>
              {savedBooks.length > 0 && (
                <span className={styles.sectionCount}>
                  {searchQuery.trim()
                    ? `${filteredSavedBooks.length} of ${savedBooks.length} saved`
                    : `${savedBooks.length} saved`}
                </span>
              )}
            </div>
          </div>

          {loading
            ? renderSkeletonGrid()
            : filteredSavedBooks.length > 0
            ? renderLibraryGrid(filteredSavedBooks)
            : savedBooks.length > 0 && searchQuery.trim()
            ? (
              <div className={styles.emptyCard}>
                <p>No saved books match your search.</p>
                <p>
                  Try searching with a different keyword.
                </p>
              </div>
            )
            : (
              <div className={styles.emptyCard}>
                <p>Your saved books will appear here.</p>
                <p>
                  Tap "Add title to My Library" on any book page to build your collection.
                </p>
              </div>
            )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>
              <FiCheckCircle />
            </span>
            <div>
              <h2 className={styles.sectionTitle}>Finished Books</h2>
              {finishedBooks.length > 0 && (
                <span className={styles.sectionCount}>
                  {searchQuery.trim()
                    ? `${filteredFinishedBooks.length} of ${finishedBooks.length} finished`
                    : `${finishedBooks.length} finished`}
                </span>
              )}
            </div>
          </div>

          {loading
            ? renderSkeletonGrid()
            : filteredFinishedBooks.length > 0
            ? renderFinishedGrid(filteredFinishedBooks)
            : finishedBooks.length > 0 && searchQuery.trim()
            ? (
              <div className={styles.emptyCard}>
                <p>No finished books match your search.</p>
                <p>
                  Try searching with a different keyword.
                </p>
              </div>
            )
            : (
              <div className={styles.emptyCard}>
                <p>Keep up the momentum.</p>
                <p>
                  Summaries you complete will be stored here so you can revisit key ideas anytime.
                </p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}


