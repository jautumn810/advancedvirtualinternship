"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { FiHeadphones, FiClock, FiBookOpen, FiShare2 } from "react-icons/fi";
import { RootState } from "@/store";
import { getBookById } from "@/lib/api";
import { addToFinished } from "@/lib/library";
import { Book } from "@/types";
import Sidebar from "@/components/layout/Sidebar";
import SearchBar from "@/components/layout/SearchBar";
import AudioPlayer from "@/components/book/AudioPlayer";
import { SkeletonText } from "@/components/ui/Skeleton";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import styles from "./page.module.css";

const FALLBACK_IMAGE = "https://via.placeholder.com/600x800?text=No+Image";
const ILLUSTRATION_PLACEHOLDER = "https://via.placeholder.com/440x320?text=Illustration";

export default function PlayerPage() {
  const params = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string>(FALLBACK_IMAGE);
  const [illustrationSrc, setIllustrationSrc] = useState<string>(ILLUSTRATION_PLACEHOLDER);
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

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

  const handleAudioFinish = async () => {
    if (user && book) {
      try {
        await addToFinished(user.uid, book);
      } catch (err) {
        console.error("Error adding to finished:", err);
      }
    }
  };

  const metaItems = useMemo(() => {
    if (!book) return [];
    const items: Array<{ icon: ReactNode; label: string }> = [];

    if (book.audioLength) {
      items.push({
        icon: <FiHeadphones aria-hidden="true" />,
        label: `${book.audioLength} min listen`,
      });
    }

    if (book.summaryLength) {
      items.push({
        icon: <FiClock aria-hidden="true" />,
        label: `${book.summaryLength} min read`,
      });
    }

    if (book.category) {
      items.push({
        icon: <FiBookOpen aria-hidden="true" />,
        label: book.category,
      });
    }

    return items;
  }, [book]);

  const keyIdeas = useMemo(() => {
    if (!book?.keyIdeas) return [];
    return book.keyIdeas.map((idea, index) =>
      typeof idea === "string"
        ? { title: `Key Idea ${index + 1}`, description: idea }
        : idea
    );
  }, [book?.keyIdeas]);

  const summaryParagraphs = useMemo(() => {
    if (!book?.summary) return [];
    return book.summary
      .split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [book?.summary]);

  const pageSubtitle = useMemo(() => {
    if (!book) return "";
    if (book.subTitle) return book.subTitle;
    if (!book.summary) return "";
    const firstSentence = book.summary.split(". ").slice(0, 2).join(". ");
    return firstSentence.endsWith(".") ? firstSentence : `${firstSentence}.`;
  }, [book]);

  if (loading && !book) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.content}>
          <div className={styles.toolbar}>
            <SearchBar />
          </div>
          <div className={styles.loadingCard}>
            <SkeletonText lines={2} />
            <SkeletonText lines={6} />
          </div>
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
          <div className={styles.errorCard}>
            <SkeletonText lines={2} />
            <p>{error || "Book not found."}</p>
          </div>
        </main>
      </div>
    );
  }

  const isAuthenticated = Boolean(user);

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.toolbar}>
          <SearchBar />
        </div>

        <h1 className={styles.title}>{book.title}</h1>
        <hr className={styles.divider} />
        {pageSubtitle && <p className={styles.subtitle}>{pageSubtitle}</p>}

        {!isAuthenticated ? (
          <>
            <section className={styles.gatedCard}>
              <div className={styles.gatedIllustration}>
                <Image
                  src={illustrationSrc}
                  alt="Log in illustration"
                  fill
                  sizes="(max-width: 600px) 80vw, 420px"
                  onError={() => {
                    if (illustrationSrc !== ILLUSTRATION_PLACEHOLDER) {
                      setIllustrationSrc(ILLUSTRATION_PLACEHOLDER);
                    }
                  }}
                />
              </div>
              <div className={styles.gatedMessage}>
                <h2 className={styles.gatedHeadline}>Log in to your account to read and listen to the book</h2>
                <p className={styles.gatedBody}>
                  Access the full audio summary and key insights once you&apos;re signed in.
                </p>
                <button
                  type="button"
                  className={styles.gatedButton}
                  onClick={() => dispatch(setAuthModalOpen(true))}
                >
                  Login
                </button>
              </div>
            </section>

            <section className={styles.playerPanel}>
              <div className={styles.playerHeader}>
                <h2 className={styles.playerTitle}>Audio summary</h2>
              </div>
              <p className={styles.lockedMessage}>
                Sign in to unlock the audio player and track your listening progress.
              </p>
            </section>
          </>
        ) : (
          <>
            <section className={styles.layout}>
              <div className={styles.coverPanel}>
                <Image
                  src={coverSrc}
                  alt={book.title}
                  fill
                  className={styles.coverImage}
                  sizes="(max-width: 768px) 60vw, 320px"
                  priority
                  onError={() => {
                    if (coverSrc !== FALLBACK_IMAGE) {
                      setCoverSrc(FALLBACK_IMAGE);
                    }
                  }}
                />
              </div>

              <div className={styles.detailsPanel}>
                <p className={styles.authorLine}>By {book.author}</p>
                {metaItems.length > 0 && (
                  <div className={styles.metaRow}>
                    {metaItems.map((item, index) => (
                      <span key={index} className={styles.metaPill}>
                        {item.icon}
                        {item.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.ctaRow}>
                  <button
                    type="button"
                    className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
                    onClick={() => {
                      const audio = document.querySelector<HTMLAudioElement>("audio");
                      audio?.play();
                    }}
                  >
                    Start listening
                  </button>
                  {canShare && (
                    <button
                      type="button"
                      className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
                      onClick={() => {
                        void navigator.share({ title: book.title, url: window.location.href });
                      }}
                    >
                      Share
                      <FiShare2 />
                    </button>
                  )}
                </div>
              </div>
            </section>


            {keyIdeas.length > 0 && (
              <section className={styles.playerPanel}>
                <div className={styles.playerHeader}>
                  <h2 className={styles.playerTitle}>Key ideas</h2>
                </div>
                <div className={styles.keyIdeas}>
                  {keyIdeas.map((idea, index) => (
                    <div key={index} className={styles.ideaCard}>
                      <span className={styles.ideaBadge}>{index + 1}</span>
                      <h3 className={styles.ideaTitle}>{idea.title}</h3>
                      <p className={styles.ideaDescription}>{idea.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {book.summary && (
              <section className={styles.summarySection}>
                <h2 className={styles.summaryTitle}>Summary</h2>
                <div className={styles.summaryBody}>
                  <p className={styles.summaryText}>{book.summary}</p>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      
      {/* Persistent Audio Player Bar */}
      {book && book.audioLink && (
        <AudioPlayer 
          audioLink={book.audioLink} 
          bookCover={coverSrc}
          bookTitle={book.title}
          bookAuthor={book.author}
          onFinish={handleAudioFinish}
          isPersistent={true}
        />
      )}
    </div>
  );
}

