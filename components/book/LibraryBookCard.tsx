"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { Book } from "@/types";
import { formatDuration } from "@/lib/audio";
import { FiTrash2, FiClock, FiStar, FiBookOpen, FiMic, FiPlay, FiPause } from "react-icons/fi";
import styles from "./LibraryBookCard.module.css";

interface LibraryBookCardProps {
  book: Book;
  duration?: number;
  onRemove?: () => void;
  isRemoving?: boolean;
}

const FALLBACK_IMAGE = "https://via.placeholder.com/600x800?text=No+Image";

export default function LibraryBookCard({
  book,
  duration,
  onRemove,
  isRemoving,
}: LibraryBookCardProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [imageSrc, setImageSrc] = useState(book.imageLink || FALLBACK_IMAGE);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setImageSrc(book.imageLink || FALLBACK_IMAGE);
  }, [book.imageLink]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [book.audioLink]);

  const ratingDisplay = book.averageRating && !Number.isNaN(book.averageRating)
    ? book.averageRating.toFixed(1)
    : null;

  const durationDisplay = duration !== undefined && duration > 0
    ? formatDuration(duration)
    : null;

  const handleRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/book/${encodeURIComponent(book.id)}`);
  };

  const handleListen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (!book.audioLink) {
      // If no audio link, navigate to player page
      router.push(`/player/${book.id}`);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Stop any other playing audio
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audio && !a.paused) {
          a.pause();
        }
      });
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      setIsPlaying(true);
    }
  };

  return (
    <div className={styles.card}>
      {book.audioLink && (
        <audio
          ref={audioRef}
          src={book.audioLink}
          preload="metadata"
          style={{ display: "none" }}
        />
      )}
      <Link href={`/book/${encodeURIComponent(book.id)}`} className={styles.cardLink}>
        <div className={styles.imageWrap}>
          <Image
            src={imageSrc}
            alt={book.title}
            fill
            className={styles.image}
            sizes="120px"
            onError={() => {
              if (imageSrc !== FALLBACK_IMAGE) {
                setImageSrc(FALLBACK_IMAGE);
              }
            }}
          />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{book.title}</h3>
          <p className={styles.author}>{book.author}</p>
          {book.subTitle && (
            <p className={styles.subtitle}>{book.subTitle}</p>
          )}
          <div className={styles.metrics}>
            {durationDisplay && (
              <span className={styles.metric}>
                <FiClock aria-hidden="true" /> {durationDisplay}
              </span>
            )}
            {ratingDisplay && (
              <span className={styles.metric}>
                <FiStar aria-hidden="true" /> {ratingDisplay}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleRead}
          className={styles.actionButton}
          aria-label="Read book"
        >
          <FiBookOpen aria-hidden="true" />
          Read
        </button>
        {book.audioLink && (
          <button
            type="button"
            onClick={handleListen}
            className={styles.actionButton}
            aria-label={isPlaying ? "Pause audio" : "Listen to audio"}
          >
            {isPlaying ? <FiPause aria-hidden="true" /> : <FiMic aria-hidden="true" />}
            Listen
          </button>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          aria-label="Remove from library"
          className={styles.removeButton}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          disabled={isRemoving}
        >
          <FiTrash2 className={isRemoving ? styles.spinner : undefined} />
        </button>
      )}
    </div>
  );
}

