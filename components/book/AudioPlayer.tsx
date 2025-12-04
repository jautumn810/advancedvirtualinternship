"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { FiPlay, FiPause, FiSkipBack, FiSkipForward } from "react-icons/fi";
import { formatDuration } from "@/lib/audio";
import styles from "./AudioPlayer.module.css";

interface AudioPlayerProps {
  audioLink: string;
  bookCover?: string;
  bookTitle?: string;
  bookAuthor?: string;
  onFinish?: () => void;
  isPersistent?: boolean;
}

export default function AudioPlayer({ 
  audioLink, 
  bookCover, 
  bookTitle, 
  bookAuthor, 
  onFinish,
  isPersistent = false 
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  }, [isPlaying]);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onFinish) onFinish();
    };

    const handleLoadedMetadata = () => {
      updateDuration();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", updateDuration);
    audio.addEventListener("canplay", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Try to get duration if already loaded
    if (audio.readyState >= 2) {
      updateDuration();
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", updateDuration);
      audio.removeEventListener("canplay", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onFinish, audioLink]);

  // Update duration when audio link changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    
    // If metadata is already loaded
    if (audio.readyState >= 2 && audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioLink]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`${styles.player} ${isPersistent ? styles.persistent : ''}`}>
      <audio ref={audioRef} src={audioLink} preload="metadata" />
      
      {isPersistent && bookCover && (
        <div className={styles.bookInfo}>
          <div className={styles.coverThumbnail}>
            <Image
              src={bookCover}
              alt={bookTitle || "Book cover"}
              fill
              sizes="56px"
              className={styles.coverImage}
            />
          </div>
          <div className={styles.bookDetails}>
            <h3 className={styles.bookTitle}>{bookTitle}</h3>
            <p className={styles.bookAuthor}>{bookAuthor}</p>
          </div>
        </div>
      )}

      {/* Progress Bar with Current Time and Duration */}
      <div className={styles.progressContainer}>
        <span className={styles.currentTime}>{formatDuration(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className={styles.progressBar}
          style={{
            background: `linear-gradient(to right, #032b41 0%, #032b41 ${progressPercentage}%, #e5e7eb ${progressPercentage}%, #e5e7eb 100%)`,
          }}
          aria-label="Audio progress"
        />
        <span className={styles.duration}>{formatDuration(duration)}</span>
      </div>

      {/* Controls - Play/Stop/Skip buttons in the middle */}
      <div className={styles.controls}>
        <button
          onClick={() => handleSkip(-10)}
          className={styles.skipButton}
          aria-label="Skip back 10 seconds"
          type="button"
        >
          <span className={styles.skipLabel}>10</span>
          <FiSkipBack />
        </button>

        <button
          onClick={togglePlayPause}
          className={styles.playButton}
          aria-label={isPlaying ? "Pause" : "Play"}
          type="button"
        >
          {isPlaying ? <FiPause /> : <FiPlay style={{ marginLeft: '2px' }} />}
        </button>

        <button
          onClick={() => handleSkip(10)}
          className={styles.skipButton}
          aria-label="Skip forward 10 seconds"
          type="button"
        >
          <span className={styles.skipLabel}>10</span>
          <FiSkipForward />
        </button>
      </div>
    </div>
  );
}
