
interface AudioChunk {
  blob: Blob;
  startTime: number;
  endTime: number;
  chunkIndex: number;
}

export const splitAudioFile = async (file: File, maxSizeBytes?: number): Promise<AudioChunk[]> => {
  console.log(`Processing audio file: ${file.name}, size: ${file.size} bytes`);
  
  // Always return the original file as a single chunk - no splitting or conversion
  console.log('Returning original file as single chunk without any processing');
  return [{
    blob: file, // Keep original file and format exactly as is
    startTime: 0,
    endTime: 0,
    chunkIndex: 0
  }];
};
