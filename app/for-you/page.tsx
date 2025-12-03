"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  setSelectedBook,
  setRecommendedBooks,
  setSuggestedBooks,
  setLoading,
  setError,
} from "@/store/slices/booksSlice";
import { getBooksByStatus } from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { SkeletonCard } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Book } from "@/types";
import { useAudioDurations } from "@/hooks/useAudioDuration";
import { formatDuration } from "@/lib/audio";
import { FiClock, FiPlay, FiStar } from "react-icons/fi";
import styles from "./page.module.css";

const FALLBACK_IMAGE = "https://via.placeholder.com/320x480?text=No+Image";

const getDescription = (book: Book): string => {
  const source = book.bookDescription || book.summary || "";
  if (!source) return "";
  const firstSentence = source.split(". ").slice(0, 2).join(". ");
  return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
};

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

export default function ForYouPage() {
  const dispatch = useDispatch();
  const { selectedBook, recommendedBooks, suggestedBooks, searchResults, isLoading, error } = useSelector(
    (state: RootState) => state.books
  );

  const allBooks = [
    ...(selectedBook ? [selectedBook] : []),
    ...recommendedBooks,
    ...suggestedBooks,
    ...searchResults,
  ];
  const durations = useAudioDurations(allBooks);
  const [selectedCover, setSelectedCover] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    const fetchBooks = async () => {
      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
        const selected = await getBooksByStatus("selected");
        const normalizedSelected = Array.isArray(selected)
          ? (selected[0] as Book | undefined)
          : (selected as Book | undefined);
        dispatch(setSelectedBook(normalizedSelected ?? null));

        const recommended = await getBooksByStatus("recommended");
        dispatch(
          setRecommendedBooks(
            Array.isArray(recommended)
              ? (recommended as Book[])
              : recommended
              ? [recommended as Book]
              : []
          )
        );

        const suggested = await getBooksByStatus("suggested");
        dispatch(
          setSuggestedBooks(
            Array.isArray(suggested)
              ? (suggested as Book[])
              : suggested
              ? [suggested as Book]
              : []
          )
        );
      } catch (error: any) {
        dispatch(setError(error.message || "Failed to load books"));
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchBooks();
  }, [dispatch]);

  useEffect(() => {
    if (selectedBook?.imageLink) {
      setSelectedCover(selectedBook.imageLink);
    } else {
      setSelectedCover(FALLBACK_IMAGE);
    }
  }, [selectedBook]);

  const selectedDuration = selectedBook ? durations[selectedBook.id] : undefined;
  const selectedDescription = selectedBook ? getDescription(selectedBook) : "";
  const recommendedDisplay = recommendedBooks.slice(0, 6);
  const suggestedDisplay = suggestedBooks.slice(0, 6);
  const showSearchResults = searchResults.length > 0;

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <SearchBar />
        </div>

        {error && (
          <div className={styles.errorWrapper}>
            <ErrorMessage
              message={error}
              onRetry={() => {
                dispatch(setError(null));
                const fetchBooks = async () => {
                  dispatch(setLoading(true));
                  try {
                    const selected = await getBooksByStatus("selected");
                    const normalizedSelected = Array.isArray(selected)
                      ? (selected[0] as Book | undefined)
                      : (selected as Book | undefined);
                    dispatch(setSelectedBook(normalizedSelected ?? null));
                    const recommended = await getBooksByStatus("recommended");
                    dispatch(
                      setRecommendedBooks(
                        Array.isArray(recommended)
                          ? (recommended as Book[])
                          : recommended
                          ? [recommended as Book]
                          : []
                      )
                    );
                    const suggested = await getBooksByStatus("suggested");
                    dispatch(
                      setSuggestedBooks(
                        Array.isArray(suggested)
                          ? (suggested as Book[])
                          : suggested
                          ? [suggested as Book]
                          : []
                      )
                    );
                  } catch (err: any) {
                    dispatch(setError(err.message || "Failed to load books"));
                  } finally {
                    dispatch(setLoading(false));
                  }
                };
                fetchBooks();
              }}
            />
          </div>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Selected just for you</h2>
          {isLoading && !selectedBook ? (
            <div className={styles.selectedSkeleton}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : selectedBook ? (
            <article className={styles.selectedCard}>
              <p className={styles.selectedSummary}>{selectedDescription}</p>
              <div className={styles.selectedCover}>
                <Image
                  src={selectedCover}
                  alt={selectedBook.title}
                  fill
                  sizes="148px"
                  onError={() => {
                    if (selectedCover !== FALLBACK_IMAGE) {
                      setSelectedCover(FALLBACK_IMAGE);
                    }
                  }}
                />
              </div>
              <div className={styles.selectedMeta}>
                <h3 className={styles.selectedTitle}>{selectedBook.title}</h3>
                <p className={styles.selectedAuthor}>{selectedBook.author}</p>
                <div className={styles.selectedControls}>
                  <button type="button" className={styles.playButton} aria-label="Play summary">
                    <FiPlay aria-hidden="true" />
                  </button>
                  {selectedDuration ? (
                    <span className={styles.duration}>{formatDuration(selectedDuration)}</span>
                  ) : null}
                </div>
              </div>
            </article>
          ) : (
            <p className={styles.emptyState}>No selection available right now.</p>
          )}
        </section>

        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeading}>Recommended For You</h2>
            <p className={styles.sectionDescription}>We think you&apos;ll like these</p>
          </div>
          {isLoading && recommendedDisplay.length === 0 ? (
            <div className={styles.skeletonRow}>
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : recommendedDisplay.length > 0 ? (
            <div className={styles.bookRow}>
              {recommendedDisplay.map((book) => (
                <BookTile key={book.id} book={book} duration={durations[book.id]} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No recommended books available</p>
          )}
        </section>

        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionHeading}>Suggested Books</h2>
            <p className={styles.sectionDescription}>Browse those books</p>
          </div>
          {isLoading && suggestedDisplay.length === 0 ? (
            <div className={styles.skeletonRow}>
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : suggestedDisplay.length > 0 ? (
            <div className={styles.bookRow}>
              {suggestedDisplay.map((book) => (
                <BookTile key={book.id} book={book} duration={durations[book.id]} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>No suggested books available</p>
          )}
        </section>

        {showSearchResults && (
          <section className={styles.section}>
            <div>
              <h2 className={styles.searchTitle}>Search Results</h2>
            </div>
            <div className={styles.bookRow}>
              {searchResults.map((book) => (
                <BookTile key={book.id} book={book} duration={durations[book.id]} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
