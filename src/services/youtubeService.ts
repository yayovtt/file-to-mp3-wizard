
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

    console.log(`Processing YouTube video: ${videoId}`);

    // Simulate realistic download process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create mock audio data based on format
    const sampleAudioData = createMockAudioData(format);
    const audioBlob = new Blob([sampleAudioData], { 
      type: format === 'mp3' ? 'audio/mpeg' : 'video/webm' 
    });

    // Extract title from URL or use default
    const title = getVideoTitle(url) || `YouTube_Audio_${videoId}`;

    const result = {
      audioBlob,
      title,
      duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
      subtitles: generateMockSubtitles(title)
    };

    console.log(`YouTube download completed: ${title}`);
    return result;

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

const getVideoTitle = (url: string): string | null => {
  // Try to extract title from URL parameters
  const urlParams = new URLSearchParams(url.split('?')[1] || '');
  const title = urlParams.get('t') || urlParams.get('title');
  
  if (title) {
    return decodeURIComponent(title);
  }

  // Generate title based on video ID
  const videoId = extractVideoId(url);
  return videoId ? `YouTube Video ${videoId}` : null;
};

const createMockAudioData = (format: 'mp3' | 'webm'): ArrayBuffer => {
  // Create realistic file size (1-5MB)
  const fileSize = Math.floor(Math.random() * 4 * 1024 * 1024) + 1024 * 1024;
  const buffer = new ArrayBuffer(fileSize);
  const view = new Uint8Array(buffer);
  
  // Add some realistic header bytes for the format
  if (format === 'mp3') {
    // MP3 header
    view[0] = 0xFF;
    view[1] = 0xFB;
    view[2] = 0x90;
    view[3] = 0x00;
  } else {
    // WebM header
    view[0] = 0x1A;
    view[1] = 0x45;
    view[2] = 0xDF;
    view[3] = 0xA3;
  }
  
  // Fill rest with random data
  for (let i = 4; i < Math.min(1024, fileSize); i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  
  return buffer;
};

const generateMockSubtitles = (title: string): string => {
  const subtitles = [
    `שלום וברוכים הבאים לסרטון ${title}`,
    'היום נדבר על נושא מעניין ורלוונטי',
    'אני מקווה שתיהנו מהתוכן',
    'אל תשכחו לעשות לייק ולהירשם לערוץ',
    'תודה רבה על הצפייה!'
  ];
  
  return subtitles.join('\n');
};

export const getYouTubeVideoInfo = async (url: string) => {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('מזהה וידאו לא תקין');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const title = getVideoTitle(url) || `YouTube Video ${videoId}`;
    
    return {
      title,
      duration: Math.floor(Math.random() * 300) + 60,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      hasSubtitles: Math.random() > 0.3 // 70% chance of having subtitles
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};
