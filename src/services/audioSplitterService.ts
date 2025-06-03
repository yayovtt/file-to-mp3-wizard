
interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  chunkIndex: number;
}

export const splitAudioFile = async (file: File, maxSizeBytes: number = 49 * 1024 * 1024): Promise<AudioChunk[]> => {
  console.log(`Starting audio file processing: ${file.name}, size: ${file.size} bytes`);
  
  // If file is smaller than max size, return as single chunk WITH ORIGINAL FORMAT
  if (file.size <= maxSizeBytes) {
    console.log('File is small enough, returning original file as single chunk');
    return [{
      blob: file, // Keep original file and format
      startTime: 0,
      endTime: 0,
      chunkIndex: 0
    }];
  }

  console.log('File is large, splitting into chunks and converting to WAV');
  
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          console.log('File read successfully, decoding audio...');
          
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          console.log(`Audio decoded: duration=${audioBuffer.duration}s, channels=${audioBuffer.numberOfChannels}, sampleRate=${audioBuffer.sampleRate}`);
          
          // Calculate chunk duration based on file size ratio
          const totalDuration = audioBuffer.duration;
          const sizeRatio = maxSizeBytes / file.size;
          const chunkDuration = totalDuration * sizeRatio * 0.9; // 90% to be safe
          
          console.log(`Calculated chunk duration: ${chunkDuration}s`);
          
          const chunks: AudioChunk[] = [];
          let currentTime = 0;
          let chunkIndex = 0;

          while (currentTime < totalDuration) {
            const endTime = Math.min(currentTime + chunkDuration, totalDuration);
            const chunkLength = (endTime - currentTime) * audioBuffer.sampleRate;
            
            console.log(`Creating chunk ${chunkIndex}: ${currentTime}s - ${endTime}s`);
            
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
              
              for (let i = 0; i < chunkLength; i++) {
                const sourceIndex = Math.floor(currentTime * audioBuffer.sampleRate) + i;
                chunkChannelData[i] = sourceIndex < channelData.length ? channelData[sourceIndex] : 0;
              }
            }

            // Convert to blob only for large files that need splitting
            const chunkBlob = await audioBufferToBlob(chunkBuffer, 'audio/wav');
            console.log(`Chunk ${chunkIndex} created, size: ${chunkBlob.size} bytes`);
            
            chunks.push({
              blob: chunkBlob,
              startTime: currentTime,
              endTime: endTime,
              chunkIndex: chunkIndex
            });

            currentTime = endTime;
            chunkIndex++;
          }

          console.log(`Audio splitting completed: ${chunks.length} chunks created`);
          resolve(chunks);
        } catch (error) {
          console.error('Error processing audio data:', error);
          reject(new Error(`שגיאה בעיבוד נתוני האודיו: ${error.message}`));
        }
      };

      fileReader.onerror = () => {
        console.error('Error reading file');
        reject(new Error('שגיאה בקריאת הקובץ'));
      };
      
      console.log('Starting to read file...');
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error initializing audio processing:', error);
      reject(new Error(`שגיאה באתחול עיבוד האודיו: ${error.message}`));
    }
  });
};

const audioBufferToBlob = async (audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> => {
  try {
    console.log('Converting audio buffer to blob...');
    
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
    
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    console.log(`Audio buffer converted to blob: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error('Error converting audio buffer to blob:', error);
    throw new Error(`שגיאה בהמרת האודיו: ${error.message}`);
  }
};
