
export type TranscriptionEngine = 'groq' | 'google' | 'assemblyai' | 'vosk';

interface TranscriptionResponse {
  text: string;
}

// Groq transcription (existing implementation)
const transcribeWithGroq = async (
  audioFile: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const { transcribeAudio } = await import('./transcriptionService');
  return transcribeAudio(audioFile, apiKey, onProgress);
};

// Google Speech-to-Text transcription
const transcribeWithGoogle = async (
  audioFile: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(`Starting Google Speech-to-Text transcription for: ${audioFile.name}`);
  
  if (onProgress) onProgress(10);
  
  // Convert audio to base64
  const base64Audio = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioFile);
  });
  
  if (onProgress) onProgress(30);
  
  const requestBody = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'he-IL',
      enableAutomaticPunctuation: true,
      model: 'latest_long'
    },
    audio: {
      content: base64Audio
    }
  };
  
  if (onProgress) onProgress(50);
  
  const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (onProgress) onProgress(80);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Speech API Error:', errorText);
    throw new Error(`שגיאת Google Speech API (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  
  if (onProgress) onProgress(100);
  
  if (!result.results || result.results.length === 0) {
    throw new Error('לא זוהה טקסט בקובץ האודיו');
  }
  
  const transcription = result.results
    .map((result: any) => result.alternatives[0]?.transcript || '')
    .join(' ');
  
  console.log('Google transcription completed:', transcription);
  return transcription;
};

// AssemblyAI transcription
const transcribeWithAssemblyAI = async (
  audioFile: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(`Starting AssemblyAI transcription for: ${audioFile.name}`);
  
  if (onProgress) onProgress(5);
  
  // Step 1: Upload the file
  const uploadFormData = new FormData();
  uploadFormData.append('audio', audioFile);
  
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
    },
    body: uploadFormData
  });
  
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`שגיאה בהעלאת הקובץ ל-AssemblyAI: ${errorText}`);
  }
  
  const uploadResult = await uploadResponse.json();
  const audioUrl = uploadResult.upload_url;
  
  if (onProgress) onProgress(20);
  
  // Step 2: Request transcription
  const transcriptionRequest = {
    audio_url: audioUrl,
    language_code: 'he',
    punctuate: true,
    format_text: true
  };
  
  const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transcriptionRequest)
  });
  
  if (!transcriptionResponse.ok) {
    const errorText = await transcriptionResponse.text();
    throw new Error(`שגיאה בבקשת התמלול מ-AssemblyAI: ${errorText}`);
  }
  
  const transcriptionResult = await transcriptionResponse.json();
  const transcriptId = transcriptionResult.id;
  
  if (onProgress) onProgress(30);
  
  // Step 3: Poll for completion
  let status = 'processing';
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes timeout
  
  while (status === 'processing' || status === 'queued') {
    if (attempts >= maxAttempts) {
      throw new Error('תמלול AssemblyAI לקח יותר מדי זמן');
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        'Authorization': apiKey,
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error('שגיאה בבדיקת סטטוס התמלול');
    }
    
    const statusResult = await statusResponse.json();
    status = statusResult.status;
    
    if (onProgress) {
      const progress = Math.min(30 + (attempts * 2), 90);
      onProgress(progress);
    }
    
    if (status === 'completed') {
      if (onProgress) onProgress(100);
      console.log('AssemblyAI transcription completed:', statusResult.text);
      return statusResult.text || '';
    }
    
    if (status === 'error') {
      throw new Error(`שגיאה בתמלול AssemblyAI: ${statusResult.error}`);
    }
    
    attempts++;
  }
  
  throw new Error('תמלול AssemblyAI נכשל');
};

// Vosk transcription (mock implementation - requires WebAssembly setup)
const transcribeWithVosk = async (
  audioFile: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(`Starting Vosk transcription for: ${audioFile.name}`);
  
  if (onProgress) onProgress(10);
  
  // This is a simplified mock implementation
  // In a real implementation, you would:
  // 1. Load Vosk WebAssembly module
  // 2. Initialize the recognizer with Hebrew model
  // 3. Process audio chunks
  // 4. Return combined results
  
  // Simulate processing time
  for (let i = 10; i <= 90; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (onProgress) onProgress(i);
  }
  
  if (onProgress) onProgress(100);
  
  // For now, return a placeholder message
  console.log('Vosk transcription completed (mock)');
  return 'תמלול Vosk עדיין לא מוטמע במלואו. זהו הודעת מקום לבדיקה.';
};

export const transcribeWithEngine = async (
  engine: TranscriptionEngine,
  audioFile: File,
  apiKey: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log(`Transcribing with engine: ${engine}`);
  
  switch (engine) {
    case 'groq':
      return transcribeWithGroq(audioFile, apiKey, onProgress);
    
    case 'google':
      return transcribeWithGoogle(audioFile, apiKey, onProgress);
    
    case 'assemblyai':
      return transcribeWithAssemblyAI(audioFile, apiKey, onProgress);
    
    case 'vosk':
      return transcribeWithVosk(audioFile, apiKey, onProgress);
    
    default:
      throw new Error(`מנוע תמלול לא נתמך: ${engine}`);
  }
};
