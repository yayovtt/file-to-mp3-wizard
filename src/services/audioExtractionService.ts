
export interface AudioExtractionResult {
  audioBlob: Blob;
  duration: number;
  sampleRate: number;
}

export interface MediaInfo {
  type: 'audio' | 'video' | 'unknown';
  isVideo: boolean;
  isAudio: boolean;
}

export const getMediaInfo = (file: File): MediaInfo => {
  const fileName = file.name.toLowerCase();
  const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv'];
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'];
  
  const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
  const isAudio = audioExtensions.some(ext => fileName.endsWith(ext));
  
  return {
    type: isVideo ? 'video' : isAudio ? 'audio' : 'unknown',
    isVideo,
    isAudio
  };
};

export const isVideoFile = (filename: string): boolean => {
  return getMediaInfo({ name: filename } as File).isVideo;
};

export const extractAudioFromVideo = async (videoFile: File): Promise<AudioExtractionResult> => {
  return new Promise((resolve, reject) => {
    console.log(`Starting audio extraction from video: ${videoFile.name}`);
    
    // Create video element
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      const duration = video.duration;
      console.log(`Video duration: ${duration} seconds`);
      console.log(`Original video size: ${(videoFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Set up audio context for extraction
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const mediaElementSource = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      
      // Connect the video audio to the destination
      mediaElementSource.connect(destination);
      mediaElementSource.connect(audioContext.destination);
      
      // Create MediaRecorder to capture the audio
      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000 // Lower bitrate for smaller files
      });
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        console.log(`Extracted audio size: ${(audioBlob.size / 1024).toFixed(2)} KB`);
        console.log(`Compression achieved: ${(100 - (audioBlob.size / videoFile.size) * 100).toFixed(1)} %`);
        
        resolve({
          audioBlob,
          duration,
          sampleRate: 16000
        });
      };
      
      mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        reject(new Error('Failed to record audio'));
      };
      
      // Start recording and play the video
      mediaRecorder.start();
      video.currentTime = 0;
      video.play().then(() => {
        // Fast forward through the video to capture all audio
        video.playbackRate = 16; // Speed up playback
        video.onended = () => {
          mediaRecorder.stop();
          audioContext.close();
        };
      }).catch(error => {
        console.error('Video play error:', error);
        reject(new Error('Failed to play video for audio extraction'));
      });
    };
    
    video.onerror = (error) => {
      console.error('Video load error:', error);
      reject(new Error('Failed to load video file'));
    };
    
    // Load the video
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.load();
  });
};
