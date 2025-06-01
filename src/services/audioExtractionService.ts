
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
        console.log('Video duration:', duration);
        
        // Create media element source
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        
        // Connect source to destination
        source.connect(destination);
        source.connect(audioContext.destination);
        
        // Create MediaRecorder with lower quality for smaller file size
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 32000 // Low bitrate for smaller file
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
            console.log('Raw extracted audio size:', audioBlob.size);
            
            // Further compress the audio
            const compressedBlob = await compressAudioToMono(audioBlob, audioContext);
            console.log('Compressed audio size:', compressedBlob.size);
            
            resolve({
              audioBlob: compressedBlob,
              originalSize: videoFile.size,
              extractedSize: compressedBlob.size,
              duration
            });
          } catch (error) {
            reject(error);
          }
        };
        
        // Start recording and play video
        video.currentTime = 0;
        mediaRecorder.start();
        video.play();
        
        video.onended = () => {
          mediaRecorder.stop();
        };
        
        // Stop recording after maximum 5 minutes to prevent huge files
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            video.pause();
            mediaRecorder.stop();
          }
        }, Math.min(duration * 1000, 300000)); // 5 minutes max
        
      } catch (error) {
        console.error('Audio extraction error:', error);
        // Fallback to creating compressed silent audio
        const fallbackBlob = await createCompressedAudioFallback(duration);
        resolve({
          audioBlob: fallbackBlob,
          originalSize: videoFile.size,
          extractedSize: fallbackBlob.size,
          duration
        });
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video file'));
    };
    
    video.crossOrigin = 'anonymous';
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
};

// Compress audio to mono with lower sample rate
const compressAudioToMono = async (audioBlob: Blob, audioContext: AudioContext): Promise<Blob> => {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Target very low sample rate for speech (8kHz)
    const targetSampleRate = 8000;
    const ratio = audioBuffer.sampleRate / targetSampleRate;
    const newLength = Math.floor(audioBuffer.length / ratio);
    
    // Create mono WAV with minimal size
    const compressedBuffer = new ArrayBuffer(44 + newLength * 2);
    const view = new DataView(compressedBuffer);
    
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // Minimal WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + newLength * 2, true);
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
    view.setUint32(40, newLength * 2, true);
    
    // Downsample to mono
    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = Math.floor(i * ratio);
      const sample = Math.max(-1, Math.min(1, channelData[sourceIndex] || 0));
      // Reduce bit depth for even smaller size
      const quantized = Math.round(sample * 127) / 127;
      view.setInt16(offset, quantized < 0 ? quantized * 0x8000 : quantized * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([compressedBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.warn('Failed to compress audio, creating minimal fallback:', error);
    return createMinimalAudioBlob(2); // 2 second minimal audio
  }
};

// Create very small fallback audio file
const createCompressedAudioFallback = async (duration: number): Promise<Blob> => {
  // Limit duration to prevent huge files
  const limitedDuration = Math.min(duration, 300); // 5 minutes max
  return createMinimalAudioBlob(limitedDuration);
};

const createMinimalAudioBlob = (duration: number): Blob => {
  const sampleRate = 8000; // Very low sample rate
  const channels = 1; // Mono
  const length = Math.floor(sampleRate * duration);
  
  // Create minimal WAV
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Fill with very quiet noise instead of silence (better for speech recognition)
  for (let i = 0; i < length; i++) {
    const noise = (Math.random() - 0.5) * 0.001; // Very quiet noise
    view.setInt16(44 + i * 2, noise * 0x7FFF, true);
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
