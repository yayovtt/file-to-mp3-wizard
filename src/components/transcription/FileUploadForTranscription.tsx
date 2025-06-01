
import { useCallback } from 'react';
import { Upload, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadForTranscriptionProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUploadForTranscription = ({ onFilesSelected }: FileUploadForTranscriptionProps) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const supportedFiles = droppedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      file.type.startsWith('video/') ||
      ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
    if (supportedFiles.length > 0) {
      onFilesSelected(supportedFiles);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <Card
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="text-center p-12 rounded-xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 group cursor-pointer"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="bg-gradient-to-r from-pink-500 to-red-500 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">
            העלה קובץ אודיו או וידאו לתמלול
          </h3>
          <p className="text-gray-500">
            גרור קבצים לכאן או לחץ לבחירה
          </p>
        </div>

        <Button
          onClick={() => document.getElementById('transcription-file-input')?.click()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2"
        >
          <Upload className="w-4 h-4 mr-2" />
          בחר קבצים
        </Button>

        <input
          id="transcription-file-input"
          type="file"
          multiple
          accept="audio/*,video/*,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma,.mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.m4v"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-xs text-gray-400 mt-4 space-y-1">
          <p><strong>אודיו:</strong> MP3, WAV, FLAC, AAC, OGG, M4A, WMA</p>
          <p><strong>וידאו:</strong> MP4, AVI, MOV, MKV, WMV, FLV, WebM, M4V</p>
        </div>
      </div>
    </Card>
  );
};
