/**
 * Calculate the duration of an audio file in seconds
 * @param audioUrl - URL of the audio file
 * @returns Promise that resolves to duration in seconds
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!audioUrl || audioUrl.trim() === '') {
      reject(new Error('Invalid audio URL'));
      return;
    }

    const audio = new Audio(audioUrl);
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      // Remove event listeners and clean up
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      // Stop loading and remove source
      audio.pause();
      audio.src = '';
      audio.load();
    };
    
    const handleLoadedMetadata = () => {
      if (isResolved) return;
      isResolved = true;
      const duration = audio.duration;
      cleanup();
      if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
        reject(new Error('Invalid audio duration'));
      } else {
        resolve(duration);
      }
    };
    
    const handleCanPlayThrough = () => {
      if (isResolved) return;
      // If metadata wasn't loaded but we can play, try to get duration
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        handleLoadedMetadata();
      }
    };
    
    const handleError = (error: Event) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      const audioError = error.target as HTMLAudioElement;
      let errorMessage = 'Failed to load audio';
      
      if (audioError.error) {
        switch (audioError.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decoding error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported';
            break;
        }
      }
      
      reject(new Error(errorMessage));
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    
    // Set preload to metadata to start loading
    audio.preload = 'metadata';
    
    // Timeout after 10 seconds
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(new Error('Audio loading timeout'));
      }
    }, 10000);
  });
}

/**
 * Format duration in seconds to readable string (e.g., "4:52")
 * @param seconds - Duration in seconds
 * @returns Formatted string like "4:52" or "1:23:45"
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

