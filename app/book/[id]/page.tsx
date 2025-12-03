"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { getBookById } from "@/lib/api";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { Book } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import { SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { formatDuration } from "@/lib/audio";
import { FiStar, FiClock, FiBookOpen } from "react-icons/fi";
import styles from "./page.module.css";

const FALLBACK_IMAGE = "https://via.placeholder.com/600x800?text=No+Image";

const getExcerpt = (book: Book): string => {
  const source = book.bookDescription || book.summary || "";
  if (!source) return "";
  const sentences = source.split(". ");
  const firstTwo = sentences.slice(0, 2).join(". ");
  return firstTwo.endsWith(".") ? firstTwo : `${firstTwo}.`;
};

const getFormatLabel = (type: Book["type"]) => {
  switch (type) {
    case "audio":
      return "Audio";
    case "text":
      return "Text";
    default:
      return "Audio & Text";
  }
};

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const { subscription } = useSelector((s: RootState) => s.subscription);

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string>(FALLBACK_IMAGE);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!params.id || typeof params.id !== "string") return;

      setLoading(true);
      setError(null);
      setBook(null);
      setCoverSrc(FALLBACK_IMAGE);

      try {
        const bookData = await getBookById(params.id);
        setBook(bookData);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load book");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.id]);

  useEffect(() => {
    if (book?.imageLink) {
      setCoverSrc(book.imageLink);
    } else {
      setCoverSrc(FALLBACK_IMAGE);
    }
  }, [book?.imageLink]);

  const handleReadListen = (action: "read" | "listen") => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (!book) return;

    if (book.subscriptionRequired) {
      const hasActiveSubscription =
        subscription?.status === "active" &&
        (subscription.type === "premium" || subscription.type === "premium-plus");

      if (!hasActiveSubscription) {
        router.push("/choose-plan");
        return;
      }
    }

    router.push(`/player/${book.id}`);
  };

  const handleAddToLibrary = async () => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (!book) return;

    try {
      setIsAdding(true);
      const { addToLibrary } = await import("@/lib/library");
      await addToLibrary(user.uid, book);
      alert("Book added to library!");
    } catch (error) {
      console.error("Error adding to library:", error);
      alert("Failed to add book to library. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRetry = () => {
    if (!params.id || typeof params.id !== "string") return;
    setError(null);
    setLoading(true);
    setBook(null);
    setCoverSrc(FALLBACK_IMAGE);
    getBookById(params.id)
      .then((bookData) => {
        setBook(bookData);
        setError(null);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load book");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading && !book) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
          <div className={styles.toolbar}>
            <SearchBar />
          </div>
          <section className={styles.loadingWrapper}>
            <div className={styles.skeletonRow}>
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
            <div style={{ marginTop: 32 }}>
              <SkeletonText lines={6} />
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
          <div className={styles.toolbar}>
            <SearchBar />
          </div>
          <div className={styles.errorWrapper}>
            <ErrorMessage message={error || "Book not found"} onRetry={handleRetry} />
          </div>
        </main>
      </div>
    );
  }

  const ratingDisplay =
    book.averageRating && !Number.isNaN(book.averageRating)
      ? `${book.averageRating.toFixed(1)} (${book.totalRating ?? 0} ratings)`
      : null;

  const durationDisplay = book.audioLink ? formatDuration(book.audioLength ?? 0) : null;
  const keyIdeasCount = Array.isArray(book.keyIdeas) ? book.keyIdeas.length : 0;
  const formatLabel = getFormatLabel(book.type);
  const excerpt = getExcerpt(book);

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <SearchBar />
        </div>

        <section className={styles.hero}>
          <div className={styles.headingGroup}>
            <h1 className={styles.title}>{book.title}</h1>
            <p className={styles.author}>{book.author}</p>
            {book.subTitle && <p className={styles.subtitle}>{book.subTitle}</p>}

            <div className={styles.metrics}>
              {ratingDisplay && (
                <span className={styles.metric}>
                  <FiStar aria-hidden="true" />
                  {ratingDisplay}
                </span>
              )}
              {durationDisplay && (
                <span className={styles.metric}>
                  <FiClock aria-hidden="true" />
                  {durationDisplay}
                </span>
              )}
              <span className={styles.metric}>
                <FiBookOpen aria-hidden="true" />
                {formatLabel}
              </span>
              {keyIdeasCount > 0 && (
                <span className={styles.metric}>{keyIdeasCount} Key ideas</span>
              )}
            </div>

            <div className={styles.ctaRow}>
              <button
                onClick={() => handleReadListen("read")}
                className={styles.primaryButton}
                type="button"
              >
                Read
              </button>
              <button
                onClick={() => handleReadListen("listen")}
                className={styles.secondaryButton}
                type="button"
              >
                Listen
              </button>
            </div>
            <button
              onClick={handleAddToLibrary}
              className={styles.libraryLink}
              type="button"
              disabled={isAdding}
            >
              Add title to My Library
            </button>
          </div>

          <div className={styles.coverWrap}>
            <Image
              src={coverSrc}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 60vw, 260px"
              onError={() => {
                if (coverSrc !== FALLBACK_IMAGE) {
                  setCoverSrc(FALLBACK_IMAGE);
                }
              }}
            />
          </div>
        </section>

        {book.tags && book.tags.length > 0 && (
          <div className={styles.tags}>
            {book.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Summary</h2>
          <div className={styles.sectionBody}>
            {book.summary ? (
              <div className={styles.summaryContent}>
                {book.summary.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index}>{paragraph.trim()}</p>
                  )
                ))}
              </div>
            ) : book.bookDescription ? (
              <div className={styles.summaryContent}>
                {book.bookDescription.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index}>{paragraph.trim()}</p>
                  )
                ))}
              </div>
            ) : (
              <p>No summary available for this book.</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About the Author</h2>
          <div className={styles.sectionBody}>
            <div className={styles.authorInfo}>
              <h3 className={styles.authorName}>{book.author}</h3>
              {book.authorDescription ? (
                <div className={styles.authorDescription}>
                  {book.authorDescription.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index}>{paragraph.trim()}</p>
                    )
                  ))}
                </div>
              ) : (
                <p>No author information available.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

