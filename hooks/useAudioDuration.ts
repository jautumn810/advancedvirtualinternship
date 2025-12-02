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
          if (book.audioLink) {
            const duration = await getAudioDuration(book.audioLink);
            return { id: book.id, duration };
          }
          return { id: book.id, duration: 0 };
        } catch (error) {
          console.error(`Error calculating duration for book ${book.id}:`, error);
          return { id: book.id, duration: 0 };
        }
      });

      const results = await Promise.all(durationPromises);
      const durationMap: DurationMap = {};
      results.forEach(({ id, duration }) => {
        durationMap[id] = duration;
      });
      setDurations(durationMap);
    };

    if (books.length > 0) {
      calculateDurations();
    }
  }, [books]);

  return durations;
}

