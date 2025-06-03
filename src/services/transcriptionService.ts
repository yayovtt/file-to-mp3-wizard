
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
  
  // Validate API key
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח API חסר או לא תקין');
  }
  
  // Split file if necessary
  let chunks;
  try {
    chunks = await splitAudioFile(audioFile);
    console.log(`File split into ${chunks.length} chunks`);
  } catch (error) {
    console.error('Error splitting audio file:', error);
    throw new Error(`שגיאה בחלוקת הקובץ: ${error.message}`);
  }
  
  if (onProgress) onProgress(10);
  
  const transcriptionResults = [];
  const progressPerChunk = 80 / chunks.length; // Reserve 10% for splitting and 10% for combining
  
  // Transcribe each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Transcribing chunk ${i + 1}/${chunks.length}, size: ${chunk.blob.size} bytes`);
    
    try {
      const formData = new FormData();
      formData.append('file', chunk.blob, `chunk_${i}.wav`);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'he'); // Hebrew language
      formData.append('response_format', 'json');

      console.log('Sending request to Groq API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`API Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error(`שגיאת API (${response.status}): ${errorText}`);
      }

      const result: GroqTranscriptionResponse = await response.json();
      console.log(`Chunk ${i + 1} transcription result:`, result.text);
      
      transcriptionResults.push({
        text: result.text,
        startTime: chunk.startTime,
        endTime: chunk.endTime,
        chunkIndex: chunk.chunkIndex
      });
      
      console.log(`Chunk ${i + 1} transcribed successfully`);
      
      if (onProgress) {
        onProgress(10 + (i + 1) * progressPerChunk);
      }
      
    } catch (error) {
      console.error(`Error transcribing chunk ${i}:`, error);
      
      if (error.name === 'AbortError') {
        throw new Error(`תמלול החלק ${i + 1} הופסק בגלל זמן קצוב`);
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error(`בעיית חיבור לשרת התמלול בחלק ${i + 1}. בדוק את החיבור לאינטרנט`);
      }
      
      throw new Error(`שגיאה בתמלול החלק ${i + 1}: ${error.message}`);
    }
  }
  
  // Combine all transcriptions
  const fullText = transcriptionResults
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map(result => result.text)
    .join(' ');
  
  console.log('Transcription completed successfully');
  console.log('Final transcription length:', fullText.length);
  
  if (onProgress) onProgress(100);
  
  return {
    fullText,
    chunks: transcriptionResults
  };
};
