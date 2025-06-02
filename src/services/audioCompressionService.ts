
export interface CompressionOptions {
  bitrate: number; // kbps
  sampleRate?: number;
  channels?: number;
}

export const compressAudio = async (
  file: File, 
  options: CompressionOptions = { bitrate: 16 }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Set target parameters for compression
        const targetSampleRate = options.sampleRate || 22050; // Lower sample rate for compression
        const targetChannels = options.channels || 1; // Mono for better compression
        
        // Create new buffer with compressed parameters
        const compressedBuffer = audioContext.createBuffer(
          targetChannels,
          Math.floor(audioBuffer.duration * targetSampleRate),
          targetSampleRate
        );

        // Downsample and convert to mono if needed
        const sourceChannelData = audioBuffer.getChannelData(0);
        const targetChannelData = compressedBuffer.getChannelData(0);
        
        // Simple downsampling
        const ratio = audioBuffer.sampleRate / targetSampleRate;
        for (let i = 0; i < targetChannelData.length; i++) {
          const sourceIndex = Math.floor(i * ratio);
          targetChannelData[i] = sourceChannelData[sourceIndex] || 0;
        }

        // Convert to compressed blob
        const compressedBlob = await audioBufferToCompressedBlob(compressedBuffer, options.bitrate);
        resolve(compressedBlob);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => reject(new Error('Failed to read file'));
    fileReader.readAsArrayBuffer(file);
  });
};

const audioBufferToCompressedBlob = async (
  audioBuffer: AudioBuffer, 
  targetBitrate: number
): Promise<Blob> => {
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  
  // Calculate bytes per sample based on target bitrate
  const bytesPerSecond = (targetBitrate * 1000) / 8;
  const bytesPerSample = Math.max(1, Math.floor(bytesPerSecond / sampleRate / numberOfChannels));
  
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
  const view = new DataView(arrayBuffer);
  
  // WAV header with compression settings
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, bytesPerSecond, true);
  view.setUint16(32, numberOfChannels * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * bytesPerSample, true);
  
  // Convert audio data with compression
  let offset = 44;
  const compressionFactor = bytesPerSample === 1 ? 128 : (bytesPerSample === 2 ? 32768 : 1);
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      
      if (bytesPerSample === 1) {
        // 8-bit compression
        view.setUint8(offset, Math.floor((sample + 1) * 127.5));
        offset += 1;
      } else {
        // 16-bit with reduced precision
        const compressedSample = Math.floor(sample * compressionFactor) / compressionFactor;
        view.setInt16(offset, compressedSample < 0 ? compressedSample * 0x8000 : compressedSample * 0x7FFF, true);
        offset += 2;
      }
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};

export const getCompressedFileSize = (originalSize: number, targetBitrate: number): number => {
  // Estimate compressed size based on bitrate
  // This is a rough estimation - actual compression may vary
  const compressionRatio = Math.min(1, targetBitrate / 128); // Assuming original is ~128kbps
  return Math.floor(originalSize * compressionRatio);
};
