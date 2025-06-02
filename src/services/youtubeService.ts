
interface YouTubeDownloadOptions {
  url: string;
  format: 'mp3' | 'webm';
  quality?: 'highest' | 'lowest';
}

interface YouTubeDownloadResult {
  audioBlob: Blob;
  title: string;
  duration: number;
  subtitles?: string;
}

export const downloadYouTubeAudio = async (
  url: string,
  format: 'mp3' | 'webm' = 'mp3'
): Promise<YouTubeDownloadResult> => {
  try {
    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
    if (!youtubeRegex.test(url)) {
      throw new Error('כתובת URL לא תקינה של יוטיוב');
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('לא ניתן לחלץ מזהה וידאו');
    }

    // Download audio using a proxy service (since ytdl-core doesn't work in browser)
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`);
    
    if (!response.ok) {
      throw new Error('שגיאה בהורדת הוידאו מיוטיוב');
    }

    // For now, we'll create a mock implementation
    // In a real implementation, you'd need a backend service to handle YouTube downloads
    const mockAudioData = new ArrayBuffer(1024 * 1024); // 1MB mock audio
    const audioBlob = new Blob([mockAudioData], { type: format === 'mp3' ? 'audio/mpeg' : 'video/webm' });

    return {
      audioBlob,
      title: 'YouTube Audio',
      duration: 180, // 3 minutes mock
      subtitles: 'כתוביות לדוגמה מהוידאו...'
    };

  } catch (error) {
    console.error('Error downloading YouTube audio:', error);
    throw error;
  }
};

const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const getYouTubeVideoInfo = async (url: string) => {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('מזהה וידאו לא תקין');
    }

    // Mock video info - in real implementation, use YouTube API
    return {
      title: 'YouTube Video Title',
      duration: 180,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      hasSubtitles: true
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};
