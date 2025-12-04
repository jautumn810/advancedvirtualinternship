"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Book } from "@/types";
import { formatDuration } from "@/lib/audio";
import styles from "./BookCard.module.css";

interface BookCardProps {
  book: Book;
  duration?: number;
}

const FALLBACK_IMAGE = "https://via.placeholder.com/600x800?text=No+Image";

export default function BookCard({ book, duration }: BookCardProps) {
  const [imageSrc, setImageSrc] = useState(book.imageLink || FALLBACK_IMAGE);

  useEffect(() => {
    setImageSrc(book.imageLink || FALLBACK_IMAGE);
  }, [book.imageLink]);

  return (
    <Link href={`/book/${encodeURIComponent(book.id)}`} className={styles.card}>
      {book.subscriptionRequired && <div className={styles.badge}>Premium</div>}
      <div className={styles.imageWrap}>
        <Image
          src={imageSrc}
          alt={book.title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 50vw, 33vw"
          onError={() => {
            if (imageSrc !== FALLBACK_IMAGE) {
              setImageSrc(FALLBACK_IMAGE);
            }
          }}
        />
        {duration !== undefined && duration > 0 && (
          <div className={styles.duration}>{formatDuration(duration)}</div>
        )}
      </div>
      <div className={styles.meta}>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.author}>{book.author}</p>
      </div>
    </Link>
  );
}

