interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  chunkIndex: number;
}

export const splitAudioFile = async (file: File, maxSizeBytes: number = 15 * 1024 * 1024): Promise<AudioChunk[]> => {
  // Reduced to 15MB to ensure compatibility with all audio formats and encoding overhead
  
  // If file is smaller than max size, return as single chunk
  if (file.size <= maxSizeBytes) {
    return [{
      blob: file,
      startTime: 0,
      endTime: 0,
      chunkIndex: 0
    }];
  }

  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Calculate number of chunks needed based on file size - use even more chunks for safety
        const numberOfChunks = Math.ceil(file.size / maxSizeBytes) + 2; // Add 2 extra chunks for safety
        const chunkDuration = audioBuffer.duration / numberOfChunks;
        
        console.log(`Splitting into ${numberOfChunks} chunks, each ~${chunkDuration.toFixed(2)} seconds`);
        
        const chunks: AudioChunk[] = [];
        let currentTime = 0;
        let chunkIndex = 0;

        while (currentTime < audioBuffer.duration && chunkIndex < numberOfChunks) {
          const endTime = Math.min(currentTime + chunkDuration, audioBuffer.duration);
          const chunkLength = Math.floor((endTime - currentTime) * audioBuffer.sampleRate);
          
          // Create new audio buffer for this chunk
          const chunkBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            chunkLength,
            audioBuffer.sampleRate
          );

          // Copy audio data for this chunk
          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            const chunkChannelData = chunkBuffer.getChannelData(channel);
            const startSample = Math.floor(currentTime * audioBuffer.sampleRate);
            
            for (let i = 0; i < chunkLength; i++) {
              const sourceIndex = startSample + i;
              chunkChannelData[i] = sourceIndex < channelData.length ? channelData[sourceIndex] : 0;
            }
          }

          // Convert to blob
          const chunkBlob = await audioBufferToBlob(chunkBuffer, 'audio/wav');
          
          console.log(`Chunk ${chunkIndex + 1} created: ${(chunkBlob.size / 1024 / 1024).toFixed(2)}MB`);
          
          // Only add chunks that are not too small (to avoid empty chunks)
          if (chunkBlob.size > 1024) { // At least 1KB
            chunks.push({
              blob: chunkBlob,
              startTime: currentTime,
              endTime: endTime,
              chunkIndex: chunkIndex
            });
          }

          currentTime = endTime;
          chunkIndex++;
        }

        resolve(chunks);
      } catch (error) {
        console.error('Error splitting audio:', error);
        reject(error);
      }
    };

    fileReader.onerror = () => reject(new Error('Failed to read file'));
    fileReader.readAsArrayBuffer(file);
  });
};

const audioBufferToBlob = async (audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> => {
  // Simple WAV conversion for compatibility
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = 2;
  
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
  const view = new DataView(arrayBuffer);
  
  // WAV header
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
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
  view.setUint16(32, numberOfChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * bytesPerSample, true);
  
  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
};
