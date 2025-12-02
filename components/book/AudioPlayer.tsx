"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiVolume2 } from "react-icons/fi";

interface AudioPlayerProps {
  audioLink: string;
  onFinish?: () => void;
}

export default function AudioPlayer({ audioLink, onFinish }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying((prev) => {
      const next = !prev;
      if (prev) {
        audio.pause();
      } else {
        void audio.play();
      }
      return next;
    });
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, audio.currentTime + seconds);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onFinish) onFinish();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onFinish]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSkip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSkip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          const newVolumeUp = Math.min(1, volume + 0.1);
          audio.volume = newVolumeUp;
          setVolume(newVolumeUp);
          break;
        case "ArrowDown":
          e.preventDefault();
          const newVolumeDown = Math.max(0, volume - 0.1);
          audio.volume = newVolumeDown;
          setVolume(newVolumeDown);
          break;
        case "KeyM":
          e.preventDefault();
          audio.muted = !audio.muted;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleSkip, togglePlayPause, volume]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newRate = parseFloat(e.target.value);
    audio.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full space-y-4">
      <audio ref={audioRef} src={audioLink} preload="metadata" />

      {/* Progress Bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-900"
          style={{
            background: `linear-gradient(to right, #111827 0%, #111827 ${
              (currentTime / duration) * 100
            }%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`,
          }}
        />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleSkip(-10)}
          className="rounded-full p-2 hover:bg-gray-100"
          aria-label="Skip back 10 seconds"
        >
          <FiSkipBack className="text-xl" />
        </button>

        <button
          onClick={togglePlayPause}
          className="rounded-full bg-gray-900 p-4 text-white hover:bg-gray-800"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <FiPause className="text-2xl" />
          ) : (
            <FiPlay className="ml-1 text-2xl" />
          )}
        </button>

        <button
          onClick={() => handleSkip(10)}
          className="rounded-full p-2 hover:bg-gray-100"
          aria-label="Skip forward 10 seconds"
        >
          <FiSkipForward className="text-xl" />
        </button>

        <div className="ml-4 flex items-center gap-2">
          <FiVolume2 className="text-lg text-gray-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="h-1 w-20 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-gray-900"
          />
        </div>

        <select
          value={playbackRate}
          onChange={handlePlaybackRateChange}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm focus:border-gray-900 focus:outline-none"
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  );
}
