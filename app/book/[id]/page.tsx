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
import { FiStar, FiClock, FiBookOpen, FiBookmark, FiShare2, FiCopy, FiTwitter, FiFacebook, FiLinkedin, FiMic, FiZap } from "react-icons/fi";
import { addToLibrary, removeFromLibrary, getLibraryBooks } from "@/lib/library";
import { getDbInstance } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCheckingBookmark, setIsCheckingBookmark] = useState(true);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      // Handle params.id which can be string or string[] in Next.js
      const bookId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      if (!bookId || typeof bookId !== "string") {
        setError("Invalid book ID");
        setLoading(false);
        return;
      }

      // Next.js already decodes URL params, but handle edge cases
      // Try using the ID as-is first, then decode if needed
      let decodedId: string = bookId;
      try {
        // Only decode if it looks like it might be encoded
        if (bookId.includes('%')) {
          decodedId = decodeURIComponent(bookId);
        }
      } catch {
        // If decoding fails, use the original ID
        decodedId = bookId;
      }

      setLoading(true);
      setError(null);
      setBook(null);
      setCoverSrc(FALLBACK_IMAGE);

      try {
        // Use the API endpoint from the virtual internship file
        const bookData = await getBookById(decodedId);
        
        if (!bookData) {
          throw new Error("No book data received from API");
        }
        
        // Validate required fields
        if (!bookData.id && !bookData.title) {
          throw new Error("Invalid book data: missing required fields");
        }
        
        // Ensure all required fields have defaults
        // Handle keyIdeas which can be a number or array
        let normalizedKeyIdeas: Book['keyIdeas'];
        if (Array.isArray(bookData.keyIdeas)) {
          normalizedKeyIdeas = bookData.keyIdeas;
        } else if (typeof bookData.keyIdeas === 'number') {
          // If it's a number, create an empty array (we'll use the number for display)
          normalizedKeyIdeas = [];
        } else {
          normalizedKeyIdeas = [];
        }
        
        const normalizedBook: Book = {
          id: bookData.id || decodedId,
          title: bookData.title || "Untitled Book",
          author: bookData.author || "Unknown Author",
          subTitle: bookData.subTitle || "",
          imageLink: bookData.imageLink || FALLBACK_IMAGE,
          audioLink: bookData.audioLink || "",
          audioLength: bookData.audioLength || 0,
          totalRating: bookData.totalRating || 0,
          averageRating: bookData.averageRating || 0,
          keyIdeas: normalizedKeyIdeas,
          type: bookData.type || "text",
          status: bookData.status || "suggested",
          subscriptionRequired: bookData.subscriptionRequired || false,
          summary: bookData.summary || bookData.bookDescription || "",
          tags: bookData.tags || [],
          bookDescription: bookData.bookDescription || bookData.summary || "",
          authorDescription: bookData.authorDescription || "",
        };
        
        // Store the original keyIdeas value if it was a number
        if (typeof bookData.keyIdeas === 'number') {
          (normalizedBook as any).keyIdeasCount = bookData.keyIdeas;
        }
        
        setBook(normalizedBook);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.message || "Failed to load book. Please check your connection and try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBook();
    }
  }, [params.id]);

  useEffect(() => {
    if (book?.imageLink) {
      setCoverSrc(book.imageLink);
    } else {
      setCoverSrc(FALLBACK_IMAGE);
    }
  }, [book?.imageLink]);

  // Check if book is bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (!user || !book?.id) {
        setIsBookmarked(false);
        setIsCheckingBookmark(false);
        return;
      }

      try {
        const db = getDbInstance();
        if (!db) {
          setIsBookmarked(false);
          setIsCheckingBookmark(false);
          return;
        }

        const q = query(
          collection(db, "library"),
          where("userId", "==", user.uid),
          where("id", "==", book.id)
        );
        const querySnapshot = await getDocs(q);
        setIsBookmarked(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking bookmark:", error);
        setIsBookmarked(false);
      } finally {
        setIsCheckingBookmark(false);
      }
    };

    checkBookmark();
  }, [user, book?.id]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (shareMenuOpen && !target.closest(`.${styles.shareContainer}`)) {
        setShareMenuOpen(false);
      }
    };

    if (shareMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [shareMenuOpen]);

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

  const handleToggleBookmark = async () => {
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (!book) return;

    try {
      setIsAdding(true);
      
      if (isBookmarked) {
        await removeFromLibrary(user.uid, book.id);
        setIsBookmarked(false);
      } else {
        await addToLibrary(user.uid, book);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      alert("Failed to update bookmark. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleShare = (platform?: string) => {
    if (!book) return;

    const bookUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/book/${encodeURIComponent(book.id)}`
      : '';
    const shareText = `Check out "${book.title}" by ${book.author} on Summarist!`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(bookUrl).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        setShareMenuOpen(false);
      });
      return;
    }

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(bookUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(bookUrl)}`;
        break;
      default:
        // Native share API if available
        if (navigator.share) {
          navigator.share({
            title: book.title,
            text: shareText,
            url: bookUrl,
          }).catch(() => {});
          setShareMenuOpen(false);
          return;
        }
        // Fallback to copy
        navigator.clipboard.writeText(bookUrl).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        });
        setShareMenuOpen(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShareMenuOpen(false);
    }
  };

  const handleRetry = () => {
    const bookId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!bookId || typeof bookId !== "string") {
      setError("Invalid book ID");
      return;
    }
    const decodedId = decodeURIComponent(bookId);
    setError(null);
    setLoading(true);
    setBook(null);
    setCoverSrc(FALLBACK_IMAGE);
    getBookById(decodedId)
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

  if (error || (!book && !loading)) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
          <div className={styles.toolbar}>
            <SearchBar />
          </div>
          <div className={styles.errorWrapper}>
            <ErrorMessage 
              message={error || "Book not found. Please check the book ID and try again."} 
              onRetry={handleRetry} 
            />
            {params.id && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: '#63748a' }}>
                Book ID: {Array.isArray(params.id) ? params.id[0] : params.id}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Safety check - ensure book exists before rendering
  if (!book) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
          <div className={styles.toolbar}>
            <SearchBar />
          </div>
          <div className={styles.errorWrapper}>
            <ErrorMessage 
              message="Book data is missing. Please try again." 
              onRetry={handleRetry} 
            />
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
  // Handle keyIdeas - can be array or number from API
  const keyIdeasCount = (book as any).keyIdeasCount 
    ? (book as any).keyIdeasCount 
    : (Array.isArray(book.keyIdeas) ? book.keyIdeas.length : 0);
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
            <h1 className={styles.title}>{book.title || "Untitled Book"}</h1>
            <p className={styles.author}>{book.author || "Unknown Author"}</p>
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
                <FiMic aria-hidden="true" />
                {formatLabel}
              </span>
              {keyIdeasCount > 0 && (
                <span className={styles.metric}>
                  <FiZap aria-hidden="true" />
                  {keyIdeasCount} Key ideas
                </span>
              )}
            </div>

            <div className={styles.ctaRow}>
              <button
                onClick={() => handleReadListen("read")}
                className={styles.primaryButton}
                type="button"
              >
                <FiBookOpen aria-hidden="true" />
                Read
              </button>
              <button
                onClick={() => handleReadListen("listen")}
                className={styles.primaryButton}
                type="button"
              >
                <FiMic aria-hidden="true" />
                Listen
              </button>
            </div>
            <div className={styles.actionRow}>
              <button
                onClick={handleToggleBookmark}
                className={styles.libraryLink}
                type="button"
                disabled={isAdding || isCheckingBookmark}
                aria-label={isBookmarked ? "Remove from library" : "Add to library"}
              >
                <FiBookmark aria-hidden="true" />
                {isBookmarked ? "Remove from My Library" : "Add title to My Library"}
              </button>
              <div className={styles.shareContainer}>
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className={styles.actionButton}
                  type="button"
                  aria-label="Share book"
                >
                  <FiShare2 aria-hidden="true" />
                  Share
                </button>
                {shareMenuOpen && (
                  <div className={styles.shareMenu}>
                    <button
                      onClick={() => handleShare('twitter')}
                      className={styles.shareOption}
                      type="button"
                    >
                      <FiTwitter aria-hidden="true" />
                      Twitter
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className={styles.shareOption}
                      type="button"
                    >
                      <FiFacebook aria-hidden="true" />
                      Facebook
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className={styles.shareOption}
                      type="button"
                    >
                      <FiLinkedin aria-hidden="true" />
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className={styles.shareOption}
                      type="button"
                    >
                      <FiCopy aria-hidden="true" />
                      {copySuccess ? "Copied!" : "Copy Link"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.coverWrap}>
            {book.subscriptionRequired && (
              <span className={styles.premiumBadge}>Premium</span>
            )}
            <div className={styles.coverImage}>
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
          </div>
        </section>

        {book.summary || book.bookDescription ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What&apos;s it about?</h2>
            {book.tags && book.tags.length > 0 && (
              <div className={styles.tags}>
                {book.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.sectionBody}>
              <p className={styles.descriptionText}>
                {excerpt || book.bookDescription || book.summary || "No description available."}
              </p>
            </div>
          </section>
        ) : null}

        {book.keyIdeas && Array.isArray(book.keyIdeas) && book.keyIdeas.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Key Ideas</h2>
            <div className={styles.sectionBody}>
              <ul className={styles.keyIdeasList}>
                {book.keyIdeas.map((idea, index) => {
                  if (typeof idea === 'string') {
                    return (
                      <li key={index} className={styles.keyIdeaItem}>
                        {idea}
                      </li>
                    );
                  } else {
                    return (
                      <li key={index} className={styles.keyIdeaItem}>
                        <strong>{idea.title}:</strong> {idea.description}
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          </section>
        )}

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

