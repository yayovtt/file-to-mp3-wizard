
import { splitAudioFile } from './audioSplitterService';

interface TranscriptionResponse {
  text: string;
}

interface GroqTranscriptionResponse {
  text: string;
}

interface ChunkedTranscriptionResult {
  fullText: string;
  chunks: Array<{
    text: string;
    startTime: number;
    endTime: number;
    chunkIndex: number;
  }>;
}

export const transcribeAudio = async (
  audioFile: File, 
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const result = await transcribeAudioChunked(audioFile, apiKey, onProgress);
  return result.fullText;
};

export const transcribeAudioChunked = async (
  audioFile: File, 
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<ChunkedTranscriptionResult> => {
  console.log(`Starting transcription for file: ${audioFile.name}, size: ${audioFile.size} bytes`);
  
  // Split file if necessary (using 10MB limit for maximum compatibility)
  const chunks = await splitAudioFile(audioFile, 10 * 1024 * 1024);
  console.log(`File split into ${chunks.length} chunks`);
  
  if (onProgress) onProgress(10);
  
  const transcriptionResults = [];
  const progressPerChunk = 80 / chunks.length; // Reserve 10% for splitting and 10% for combining
  
  // Transcribe each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Transcribing chunk ${i + 1}/${chunks.length}, size: ${(chunk.blob.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Verify chunk size before sending - strict limit for compatibility
    if (chunk.blob.size > 15 * 1024 * 1024) { // 15MB as absolute max
      throw new Error(`Chunk ${i + 1} is still too large: ${(chunk.blob.size / 1024 / 1024).toFixed(2)}MB`);
    }
    
    try {
      const formData = new FormData();
      formData.append('file', chunk.blob, `chunk_${i}.wav`);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'he'); // Hebrew language
      formData.append('response_format', 'json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Transcription API error for chunk ${i}:`, response.status, errorText);
        throw new Error(`Transcription failed for chunk ${i + 1}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: GroqTranscriptionResponse = await response.json();
      
      transcriptionResults.push({
        text: result.text,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        chunkIndex: chunk.chunkIndex
      });
      
      console.log(`Chunk ${i + 1} transcribed successfully: "${result.text.substring(0, 50)}..."`);
      
      if (onProgress) {
        onProgress(10 + (i + 1) * progressPerChunk);
      }
      
    } catch (error) {
      console.error(`Error transcribing chunk ${i}:`, error);
      throw new Error(`Failed to transcribe chunk ${i + 1}: ${error.message}`);
    }
  }
  
  // Combine all transcriptions
  const fullText = transcriptionResults
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map(result => result.text)
    .join(' ');
  
  console.log('Transcription completed successfully');
  console.log(`Full transcription: "${fullText.substring(0, 100)}..."`);
  
  if (onProgress) onProgress(100);
  
  return {
    fullText,
    chunks: transcriptionResults
  };
};
