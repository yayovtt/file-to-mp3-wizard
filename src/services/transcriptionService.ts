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
  
  // Check if file is video and needs to be converted to audio
  const isVideoFile = audioFile.type.startsWith('video/') || 
    ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'].some(ext => 
      audioFile.name.toLowerCase().endsWith(ext)
    );
  
  let fileToTranscribe = audioFile;
  
  if (isVideoFile) {
    console.log('Video file detected, extracting audio...');
    if (onProgress) onProgress(5);
    
    try {
      // Extract audio from video using Web API
      const audioBlob = await extractAudioFromVideo(audioFile);
      fileToTranscribe = new File([audioBlob], audioFile.name.replace(/\.[^/.]+$/, '.wav'), {
        type: 'audio/wav'
      });
      console.log(`Audio extracted, new size: ${fileToTranscribe.size} bytes`);
    } catch (error) {
      console.error('Error extracting audio from video:', error);
      throw new Error('שגיאה בחילוץ אודיו מקובץ הווידאו. נסה להמיר את הקובץ לפורמט אודיו תחילה.');
    }
  }
  
  // Split file if necessary
  let chunks;
  try {
    chunks = await splitAudioFile(fileToTranscribe);
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
      
      // Ensure we're sending the correct file format
      let chunkBlob = chunk.blob;
      let fileName = `chunk_${i}.wav`;
      
      // If original chunk is still a video file or unsupported format, skip it
      if (chunkBlob.type.startsWith('video/') || 
          (!chunkBlob.type.startsWith('audio/') && chunkBlob.type !== '')) {
        console.warn(`Skipping chunk ${i} - unsupported format: ${chunkBlob.type}`);
        continue;
      }
      
      // For supported audio formats, keep original extension
      if (chunkBlob.type.includes('mp3')) fileName = `chunk_${i}.mp3`;
      else if (chunkBlob.type.includes('m4a')) fileName = `chunk_${i}.m4a`;
      else if (chunkBlob.type.includes('opus')) fileName = `chunk_${i}.opus`;
      else if (chunkBlob.type.includes('flac')) fileName = `chunk_${i}.flac`;
      
      formData.append('file', chunkBlob, fileName);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'he'); // Hebrew language
      formData.append('response_format', 'json');

      console.log(`Sending request to Groq API for ${fileName}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

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
        
        // Handle specific error cases
        if (response.status === 400 && errorText.includes('could not process file')) {
          throw new Error(`הקובץ אינו תקין לתמלול או בפורמט לא נתמך. נסה להמיר אותו לפורמט MP3 או WAV`);
        }
        
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
        throw new Error(`תמלול החלק ${i + 1} הופסק בגלל זמן קצוב (3 דקות)`);
      }
      
      if (error.message.includes('Failed to fetch')) {
        throw new Error(`בעיית חיבור לשרת התמלול בחלק ${i + 1}. הקובץ יכול להיות גדול מדי או שיש בעיית רשת`);
      }
      
      throw new Error(`שגיאה בתמלול החלק ${i + 1}: ${error.message}`);
    }
  }
  
  // Check if we got any results
  if (transcriptionResults.length === 0) {
    throw new Error('לא ניתן היה לתמלל אף חלק מהקובץ. בדוק שהקובץ מכיל אודיו ושהוא בפורמט נתמך (MP3, WAV, M4A, OPUS, FLAC)');
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

// Helper function to extract audio from video
const extractAudioFromVideo = async (videoFile: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.onloadedmetadata = () => {
      try {
        // This is a simplified approach - in a real implementation,
        // you would need a more sophisticated video-to-audio conversion
        // For now, we'll try to pass the original file and let Groq handle it
        // or suggest the user to convert the file manually
        
        reject(new Error('המערכת אינה יכולה לחלץ אודיו מווידאו אוטומטית. אנא המר את קובץ הווידאו לפורמט אודיו (MP3/WAV) תחילה או השתמש בקובץ אודיו'));
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => {
      reject(new Error('שגיאה בטעינת קובץ הווידאו'));
    };
    
    video.src = URL.createObjectURL(videoFile);
  });
};
