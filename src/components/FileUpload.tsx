
import { useCallback } from 'react';
import { Upload, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUpload = ({ onFilesSelected }: FileUploadProps) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const audioFiles = droppedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
    if (audioFiles.length > 0) {
      onFilesSelected(audioFiles);
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
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="text-center p-12 rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 group cursor-pointer"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
          <Music className="w-8 h-8 text-white" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">
            גרור קבצי אודיו לכאן
          </h3>
          <p className="text-gray-500">
            או לחץ לבחירת קבצים
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => document.getElementById('file-input')?.click()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            בחר קבצים
          </Button>
        </div>

        <input
          id="file-input"
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma"
          onChange={handleFileInput}
          className="hidden"
        />

        <p className="text-xs text-gray-400 mt-4">
          תומך ב: MP3, WAV, FLAC, AAC, OGG, M4A, WMA
        </p>
      </div>
    </div>
  );
};
