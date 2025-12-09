"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from "react";

// Audio Sample Context for Library page
interface AudioSampleContextType {
  playingId: string | null;
  playSample: (bookId: string, audioLink: string) => void;
  stopSample: () => void;
}

const AudioSampleContext = createContext<AudioSampleContextType | null>(null);

export function AudioSampleProvider({ children }: { children: ReactNode }) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSample = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playSample = useCallback((bookId: string, audioLink: string) => {
    // Stop any currently playing audio
    stopSample();

    if (!audioLink || !audioLink.trim()) {
      return;
    }

    try {
      const audio = new Audio(audioLink);
      audioRef.current = audio;
      
      audio.preload = 'auto';
      audio.volume = 1.0;

      audio.onended = () => {
        stopSample();
      };

      audio.onerror = (error) => {
        console.error("Audio playback error:", error);
        stopSample();
      };

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingId(bookId);
          })
          .catch((error) => {
            console.error("Error playing audio:", error);
            audio.oncanplay = () => {
              audio.play()
                .then(() => {
                  setPlayingId(bookId);
                })
                .catch((err) => {
                  console.error("Error playing audio after canplay:", err);
                  stopSample();
                });
            };
            audio.load();
          });
      } else {
        audio.oncanplay = () => {
          audio.play().catch((error) => {
            console.error("Error playing audio:", error);
            stopSample();
          });
        };
        audio.load();
        setPlayingId(bookId);
      }
    } catch (error) {
      console.error("Error creating audio element:", error);
    }
  }, [stopSample]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSample();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [stopSample]);

  return (
    <AudioSampleContext.Provider value={{ playingId, playSample, stopSample }}>
      {children}
    </AudioSampleContext.Provider>
  );
}

export function useLibraryAudio() {
  const context = useContext(AudioSampleContext);
  return context; // Returns null if not within provider, which is fine
}

