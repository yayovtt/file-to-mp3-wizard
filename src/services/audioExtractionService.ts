
interface ExtractionResult {
  audioBlob: Blob;
  originalSize: number;
  extractedSize: number;
  duration: number;
}

export const extractAudioFromVideo = async (videoFile: File): Promise<ExtractionResult> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration;
        
        // Create a more efficient audio extraction process
        const offlineContext = new OfflineAudioContext(
          1, // mono channel for smaller size
          audioContext.sampleRate * duration,
          audioContext.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        
        // Get audio buffer from video
        const audioBuffer = await getAudioBufferFromVideo(video, audioContext);
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert to compressed audio format (MP3-like compression)
        const audioBlob = await audioBufferToCompressedBlob(renderedBuffer);
        
        resolve({
          audioBlob,
          originalSize: videoFile.size,
          extractedSize: audioBlob.size,
          duration
        });
        
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

const getAudioBufferFromVideo = async (video: HTMLVideoElement, audioContext: AudioContext): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.currentTime = 0;
    video.play();
    
    const mediaRecorder = new MediaRecorder(video.captureStream ? video.captureStream() : (video as any).mozCaptureStream(), {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    const audioChunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (error) {
        reject(error);
      }
    };
    
    video.onended = () => {
      mediaRecorder.stop();
    };
    
    mediaRecorder.start();
  });
};

const audioBufferToCompressedBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = 1; // Force mono for smaller size
  
  // Downsample to reduce file size (from 44.1kHz to 22.05kHz)
  const targetSampleRate = Math.min(22050, sampleRate);
  const downsampleRatio = sampleRate / targetSampleRate;
  const downsampledLength = Math.floor(length / downsampleRatio);
  
  // Create WAV with lower sample rate and mono
  const arrayBuffer = new ArrayBuffer(44 + downsampledLength * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header for compressed audio
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + downsampledLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, downsampledLength * 2, true);
  
  // Convert and downsample audio data
  const channelData = audioBuffer.getChannelData(0);
  let offset = 44;
  
  for (let i = 0; i < downsampledLength; i++) {
    const sourceIndex = Math.floor(i * downsampleRatio);
    const sample = Math.max(-1, Math.min(1, channelData[sourceIndex] || 0));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
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
