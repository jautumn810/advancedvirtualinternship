"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setAuthModalOpen } from "@/store/slices/authSlice";
import { Book } from "@/types";
import { formatDuration } from "@/lib/audio";
import { FiTrash2, FiClock, FiStar, FiBookOpen, FiMic, FiPause } from "react-icons/fi";
import { useLibraryAudio } from "@/hooks/useLibraryAudio";
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
  const audioContext = useLibraryAudio();
  const isPlaying = audioContext?.playingId === book.id;

  useEffect(() => {
    setImageSrc(book.imageLink || FALLBACK_IMAGE);
  }, [book.imageLink]);

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

    if (!audioContext) {
      console.error("Audio context not available");
      return;
    }

    if (isPlaying) {
      audioContext.stopSample();
    } else {
      audioContext.playSample(book.id, book.audioLink);
    }
  };

  return (
    <div className={styles.card}>
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

