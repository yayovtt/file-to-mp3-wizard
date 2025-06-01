
export interface TranscriptionFile {
  id: string;
  file: File;
  mp3Blob?: Blob;
  status: 'uploading' | 'converting' | 'transcribing' | 'completed' | 'error';
  transcription?: string;
  processedTexts: Array<{
    type: string;
    content: string;
  }>;
  isProcessing?: boolean;
}
