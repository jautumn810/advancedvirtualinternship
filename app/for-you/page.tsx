"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, createContext, useContext, useRef, useCallback } from "react";
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
import { addToLibrary, removeFromLibrary, getLibraryBooks, LibraryBook } from "@/lib/library";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { FiPlay, FiPause, FiClock, FiStar, FiBookmark } from "react-icons/fi";
import styles from "./page.module.css";

// Audio Sample Context
interface AudioSampleContextType {
  playingId: string | null;
  playSample: (bookId: string, book: Book) => void;
  stopSample: () => void;
}

const AudioSampleContext = createContext<AudioSampleContextType | null>(null);

function AudioSampleProvider({ children }: { children: React.ReactNode }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      }
    };

    // Some browsers load voices asynchronously
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const stopSample = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playSample = useCallback((bookId: string, book: Book) => {
    // Stop any currently playing audio
    stopSample();

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      alert("Your browser doesn't support text-to-speech. Please use a modern browser like Chrome, Edge, or Safari.");
      return;
    }

    // Get the book summary text
    const summaryText = book.summary || book.bookDescription || book.subTitle || 
      `Welcome to ${book.title} by ${book.author}. ${book.subTitle || 'This is a summary of the key ideas and insights from this book.'}`;

    // Create a 30-second sample text (approximately 60-75 words)
    const words = summaryText.split(' ');
    const sampleWords = words.slice(0, 75).join(' ');
    const sampleText = sampleWords.length < summaryText.length 
      ? `${sampleWords}...` 
      : sampleWords;

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Use a pleasant voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(voice => 
        (voice.name.includes('Google') || voice.name.includes('Microsoft')) &&
        voice.lang.startsWith('en')
      ) || voices.find(voice => 
        voice.lang.startsWith('en') && voice.localService === false
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    speechSynthesisRef.current = utterance;

    // Handle when speech ends
    utterance.onend = () => {
      stopSample();
    };

    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error);
      stopSample();
    };

    // Play the speech
    try {
      window.speechSynthesis.speak(utterance);
      setPlayingId(bookId);

      // Stop after 30 seconds (sample duration)
      timeoutRef.current = setTimeout(() => {
        stopSample();
      }, 30000);
    } catch (error) {
      console.error("Error starting speech:", error);
      alert("Unable to play audio. Please check your browser settings.");
      stopSample();
    }
  }, [stopSample]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSample();
    };
  }, [stopSample]);

  return (
    <AudioSampleContext.Provider value={{ playingId, playSample, stopSample }}>
      {children}
    </AudioSampleContext.Provider>
  );
}

function useAudioSample() {
  const context = useContext(AudioSampleContext);
  if (!context) {
    throw new Error("useAudioSample must be used within AudioSampleProvider");
  }
  return context;
}

const FALLBACK_IMAGE = "https://via.placeholder.com/320x480?text=No+Image";

const getDescription = (book: Book): string => {
  const source = book.bookDescription || book.summary || "";
  if (!source) return "";
  const firstSentence = source.split(". ").slice(0, 2).join(". ");
  return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
};

function BookTile({ book, duration, isBookmarked, onBookmarkToggle }: { book: Book; duration?: number; isBookmarked: boolean; onBookmarkToggle: () => void }) {
  const [imageSrc, setImageSrc] = useState(book.imageLink || FALLBACK_IMAGE);
  const { playingId, playSample, stopSample } = useAudioSample();
  const isPlaying = playingId === book.id;
  const router = useRouter();

  // Generate a color index based on book ID for consistent semi-circle colors
  const colorIndex = useMemo(() => {
    const colors = ['#dc3545', '#8b6f47', '#d4af37', '#fef3d9', '#ffd700'];
    const hash = book.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [book.id]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      stopSample();
    } else {
      playSample(book.id, book);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle();
  };

  const handleTileClick = (e: React.MouseEvent) => {
    // Only navigate if the click is not on a button (buttons stop propagation)
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      e.preventDefault();
      return; // Let the button handle the click
    }
    // Use router.push to ensure navigation works
    e.preventDefault();
    // Next.js handles URL encoding automatically, but we'll encode to be safe
    const bookPath = `/book/${encodeURIComponent(book.id)}`;
    console.log("Navigating to book page:", bookPath, "Book ID:", book.id);
    router.push(bookPath);
  };

  if (!book.id) {
    return null; // Don't render if book ID is missing
  }

  return (
    <Link 
      href={`/book/${encodeURIComponent(book.id)}`} 
      className={styles.bookTile}
      style={{ '--semi-circle-color': colorIndex } as React.CSSProperties}
      onClick={handleTileClick}
    >
      <div className={styles.semiCircle}></div>
      {book.subscriptionRequired && <span className={styles.badge}>Premium</span>}
      <button
        type="button"
        className={styles.bookmarkButton}
        onClick={handleBookmarkClick}
        aria-label={isBookmarked ? "Remove from library" : "Add to library"}
      >
        <FiBookmark 
          aria-hidden="true" 
          className={isBookmarked ? styles.bookmarkFilled : styles.bookmarkOutline}
        />
      </button>
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
        <button
          type="button"
          className={styles.coverPlayButton}
          onClick={handlePlayClick}
          aria-label={isPlaying ? "Pause sample" : "Play sample"}
        >
          {isPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
        </button>
      </div>
      <h3 className={styles.tileTitle}>{book.title}</h3>
      <p className={styles.tileAuthor}>{book.author}</p>
      {book.subTitle && <p className={styles.tileDescription}>{book.subTitle}</p>}
    </Link>
  );
}

function SuggestedBookTile({ book, duration, isBookmarked, onBookmarkToggle }: { book: Book; duration?: number; isBookmarked: boolean; onBookmarkToggle: () => void }) {
  const [imageSrc, setImageSrc] = useState(book.imageLink || FALLBACK_IMAGE);
  const { playingId, playSample, stopSample } = useAudioSample();
  const isPlaying = playingId === book.id;
  const router = useRouter();

  // Generate a color index based on book ID for consistent semi-circle colors
  const colorIndex = useMemo(() => {
    const colors = ['#dc3545', '#8b6f47', '#d4af37', '#fef3d9', '#ffd700'];
    const hash = book.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, [book.id]);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlaying) {
      stopSample();
    } else {
      playSample(book.id, book);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBookmarkToggle();
  };

  const handleTileClick = (e: React.MouseEvent) => {
    // Only navigate if the click is not on a button (buttons stop propagation)
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      e.preventDefault();
      return; // Let the button handle the click
    }
    // Use router.push to ensure navigation works
    e.preventDefault();
    // Next.js handles URL encoding automatically, but we'll encode to be safe
    const bookPath = `/book/${encodeURIComponent(book.id)}`;
    console.log("Navigating to book page:", bookPath, "Book ID:", book.id);
    router.push(bookPath);
  };

  if (!book.id) {
    return null; // Don't render if book ID is missing
  }

  return (
    <Link 
      href={`/book/${encodeURIComponent(book.id)}`} 
      className={styles.bookTile}
      style={{ '--semi-circle-color': colorIndex } as React.CSSProperties}
      onClick={handleTileClick}
    >
      <div className={styles.semiCircle}></div>
      {book.subscriptionRequired && <span className={styles.badge}>Premium</span>}
      <button
        type="button"
        className={styles.bookmarkButton}
        onClick={handleBookmarkClick}
        aria-label={isBookmarked ? "Remove from library" : "Add to library"}
      >
        <FiBookmark 
          aria-hidden="true" 
          className={isBookmarked ? styles.bookmarkFilled : styles.bookmarkOutline}
        />
      </button>
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
        <button
          type="button"
          className={styles.coverPlayButton}
          onClick={handlePlayClick}
          aria-label={isPlaying ? "Pause sample" : "Play sample"}
        >
          {isPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
        </button>
      </div>
      <h3 className={styles.tileTitle}>{book.title}</h3>
      <p className={styles.tileAuthor}>{book.author}</p>
      {book.subTitle && <p className={styles.tileDescription}>{book.subTitle}</p>}
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
  const router = useRouter();
  const { selectedBook, recommendedBooks, suggestedBooks, searchResults, isLoading, error } = useSelector(
    (state: RootState) => state.books
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const allBooks = [
    ...(selectedBook ? [selectedBook] : []),
    ...recommendedBooks,
    ...suggestedBooks,
    ...searchResults,
  ];
  const durations = useAudioDurations(allBooks);
  const [selectedCover, setSelectedCover] = useState(FALLBACK_IMAGE);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarking, setBookmarking] = useState<Set<string>>(new Set());
  const [selectedAudioPlaying, setSelectedAudioPlaying] = useState(false);
  const selectedAudioRef = useRef<HTMLAudioElement | null>(null);

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

  // Fetch bookmarked books
  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      return;
    }

    const fetchBookmarks = async () => {
      try {
        // Import Firestore functions to query directly and preserve book id
        const { getDbInstance } = await import("@/lib/firebase");
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        
        const db = getDbInstance();
        if (!db) {
          // Firebase not initialized - just return empty set
          setBookmarkedIds(new Set());
          return;
        }
        
        const q = query(
          collection(db, "library"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        // Get the book's original id from document data before it gets overwritten
        const bookmarkedSet = new Set<string>();
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          // The book's original id is stored in the "id" field of the document
          // before getLibraryBooks overwrites it with the Firestore doc id
          if (data.id) {
            bookmarkedSet.add(data.id);
          }
        });
        
        setBookmarkedIds(bookmarkedSet);
      } catch (error) {
        // Silently handle errors - don't log in production
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching bookmarks:", error);
        }
        setBookmarkedIds(new Set());
      }
    };

    fetchBookmarks();
  }, [user]);

  // Handle selected book audio playback
  const handleSelectedPlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedBook) return;
    
    if (!selectedBook.audioLink) {
      // If no audio link, redirect to player page
      window.location.href = `/player/${selectedBook.id}`;
      return;
    }

    const audio = selectedAudioRef.current;
    if (!audio) return;

    if (selectedAudioPlaying) {
      audio.pause();
      setSelectedAudioPlaying(false);
    } else {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        // Fallback to redirect if play fails
        window.location.href = `/player/${selectedBook.id}`;
      });
      setSelectedAudioPlaying(true);
    }
  }, [selectedBook, selectedAudioPlaying]);

  useEffect(() => {
    if (!selectedBook?.audioLink) return;
    
    const audio = selectedAudioRef.current;
    if (!audio) return;

    const handleEnded = () => setSelectedAudioPlaying(false);
    const handlePause = () => setSelectedAudioPlaying(false);
    const handlePlay = () => setSelectedAudioPlaying(true);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [selectedBook?.audioLink]);

  const handleBookmarkToggle = async (book: Book) => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    const isBookmarked = bookmarkedIds.has(book.id);
    setBookmarking((prev) => new Set(prev).add(book.id));

    try {
      if (isBookmarked) {
        await removeFromLibrary(user.uid, book.id);
        setBookmarkedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(book.id);
          return newSet;
        });
      } else {
        await addToLibrary(user.uid, book);
        setBookmarkedIds((prev) => new Set(prev).add(book.id));
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Failed to update bookmark. Please try again.");
    } finally {
      setBookmarking((prev) => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  const selectedDuration = selectedBook ? durations[selectedBook.id] : undefined;
  const selectedDescription = selectedBook ? getDescription(selectedBook) : "";
  const recommendedDisplay = recommendedBooks.slice(0, 6);
  const suggestedDisplay = suggestedBooks.slice(0, 6);
  const showSearchResults = searchResults.length > 0;

  return (
    <AudioSampleProvider>
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
            <Link 
              href={`/book/${encodeURIComponent(selectedBook.id)}`} 
              className={styles.selectedCard}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('button')) {
                  e.preventDefault();
                  return; // Let the button handle the click
                }
                // Use router.push to ensure navigation works
                e.preventDefault();
                const bookPath = `/book/${encodeURIComponent(selectedBook.id)}`;
                console.log("Navigating to selected book page:", bookPath, "Book ID:", selectedBook.id);
                router.push(bookPath);
              }}
            >
              <p className={styles.selectedSummary}>
                {selectedBook.subTitle || selectedBook.bookDescription?.split(". ")[0] || selectedDescription}
              </p>
              <div className={styles.selectedCover}>
                <Image
                  src={selectedCover}
                  alt={selectedBook.title}
                  fill
                  sizes="120px"
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
                  {selectedBook.audioLink && (
                    <audio
                      ref={selectedAudioRef}
                      src={selectedBook.audioLink}
                      preload="metadata"
                      style={{ display: "none" }}
                    />
                  )}
                  <button 
                    type="button" 
                    className={styles.playButton}
                    onClick={handleSelectedPlayClick}
                    aria-label={selectedAudioPlaying ? "Pause summary" : "Play summary"}
                  >
                    {selectedAudioPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
                  </button>
                  {selectedDuration && (
                    <span className={styles.duration}>{formatDuration(selectedDuration)}</span>
                  )}
                </div>
              </div>
            </Link>
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
                <BookTile 
                  key={book.id} 
                  book={book} 
                  duration={durations[book.id]}
                  isBookmarked={bookmarkedIds.has(book.id)}
                  onBookmarkToggle={() => handleBookmarkToggle(book)}
                />
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
                <SuggestedBookTile 
                  key={book.id} 
                  book={book} 
                  duration={durations[book.id]}
                  isBookmarked={bookmarkedIds.has(book.id)}
                  onBookmarkToggle={() => handleBookmarkToggle(book)}
                />
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
                <BookTile 
                  key={book.id} 
                  book={book} 
                  duration={durations[book.id]}
                  isBookmarked={bookmarkedIds.has(book.id)}
                  onBookmarkToggle={() => handleBookmarkToggle(book)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
    </AudioSampleProvider>
  );
}
