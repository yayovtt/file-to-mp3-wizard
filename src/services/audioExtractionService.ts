
interface ExtractionResult {
  audioBlob: Blob;
  originalSize: number;
  extractedSize: number;
  duration: number;
}

export const extractAudioFromVideo = async (videoFile: File): Promise<ExtractionResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        
        // Create audio buffer from video
        const source = audioContext.createMediaElementSource(video);
        const processor = audioContext.createScriptProcessor(4096, 2, 2);
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(processor);
        processor.connect(destination);
        
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const audioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          resolve({
            audioBlob,
            originalSize: videoFile.size,
            extractedSize: audioBlob.size,
            duration
          });
        };
        
        mediaRecorder.start();
        video.play();
        
        video.onended = () => {
          mediaRecorder.stop();
          source.disconnect();
          processor.disconnect();
        };
        
      } catch (error) {
        reject(new Error(`Failed to extract audio: ${error.message}`));
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video file'));
    };
    
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const isAudioFile = (file: File): boolean => {
  return file.type.startsWith('audio/');
};

export const getMediaInfo = (file: File) => {
  const isVideo = isVideoFile(file);
  const isAudio = isAudioFile(file);
  
  return {
    isVideo,
    isAudio,
    isMedia: isVideo || isAudio,
    type: isVideo ? 'video' : isAudio ? 'audio' : 'unknown',
    sizeInMB: (file.size / 1024 / 1024).toFixed(2)
  };
};
