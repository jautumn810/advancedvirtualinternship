import { useState, useEffect } from "react";
import { getAudioDuration } from "@/lib/audio";
import { Book } from "@/types";

interface DurationMap {
  [bookId: string]: number;
}

export function useAudioDurations(books: Book[]): DurationMap {
  const [durations, setDurations] = useState<DurationMap>({});

  useEffect(() => {
    const calculateDurations = async () => {
      const durationPromises = books.map(async (book) => {
        try {
          if (book.audioLink && book.audioLink.trim()) {
            const duration = await getAudioDuration(book.audioLink);
            // Only return duration if it's valid
            if (duration && duration > 0 && isFinite(duration)) {
              return { id: book.id, duration };
            }
          }
          return { id: book.id, duration: 0 };
        } catch (error) {
          // Silently handle errors - don't log in production to avoid console spam
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Could not calculate duration for book ${book.id}:`, error);
          }
          return { id: book.id, duration: 0 };
        }
      });

      try {
        const results = await Promise.all(durationPromises);
        const durationMap: DurationMap = {};
        results.forEach(({ id, duration }) => {
          durationMap[id] = duration;
        });
        setDurations(durationMap);
      } catch (error) {
        // If all promises fail, just set empty durations
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error calculating audio durations:', error);
        }
        setDurations({});
      }
    };

    if (books.length > 0) {
      calculateDurations();
    }
  }, [books]);

  return durations;
}

