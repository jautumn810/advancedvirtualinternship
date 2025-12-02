/**
 * Calculate the duration of an audio file in seconds
 * @param audioUrl - URL of the audio file
 * @returns Promise that resolves to duration in seconds
 */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', (error) => {
      reject(new Error('Failed to load audio: ' + error));
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Audio loading timeout'));
    }, 10000);
  });
}

/**
 * Format duration in seconds to readable string (e.g., "4:52")
 * @param seconds - Duration in seconds
 * @returns Formatted string like "4:52" or "1:23:45"
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

