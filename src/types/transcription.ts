
export interface TranscriptionFile {
  id: string;
  file: File;
  mp3Blob?: Blob;
  status: 'uploading' | 'transcribing' | 'completed' | 'error';
  transcription?: string;
  processedTexts: Array<{
    type: string;
    content: string;
  }>;
  isProcessing?: boolean;
}
