
interface TranscriptionResponse {
  text: string;
}

interface GroqTranscriptionResponse {
  text: string;
}

export const transcribeAudio = async (audioFile: File, apiKey: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', audioFile);
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
    throw new Error(`Transcription failed: ${response.statusText}`);
  }

  const result: GroqTranscriptionResponse = await response.json();
  return result.text;
};
