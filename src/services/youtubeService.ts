
import { supabase } from '@/integrations/supabase/client';

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

    console.log(`Processing YouTube video: ${url}`);

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('youtube-download', {
      body: { url, format }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`שגיאה בהורדה: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'שגיאה בהורדת הקובץ');
    }

    // Convert base64 audio data to blob
    const audioData = atob(data.audioData);
    const audioArray = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      audioArray[i] = audioData.charCodeAt(i);
    }

    const audioBlob = new Blob([audioArray], { 
      type: format === 'mp3' ? 'audio/mpeg' : 'video/webm' 
    });

    const result = {
      audioBlob,
      title: data.title,
      duration: data.duration,
      subtitles: data.subtitles
    };

    console.log(`YouTube download completed: ${data.title}`);
    return result;

  } catch (error) {
    console.error('Error downloading YouTube audio:', error);
    throw error;
  }
};

export const getYouTubeVideoInfo = async (url: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('youtube-info', {
      body: { url }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`שגיאה בקבלת מידע: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'שגיאה בקבלת מידע על הוידאו');
    }

    return {
      title: data.title,
      duration: data.duration,
      thumbnail: data.thumbnail,
      hasSubtitles: data.hasSubtitles
    };
  } catch (error) {
    console.error('Error getting video info:', error);
    throw error;
  }
};
