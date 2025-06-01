
import { useCallback } from 'react';
import { Upload, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUpload = ({ onFilesSelected }: FileUploadProps) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const supportedFiles = droppedFiles.filter(file => 
      // Audio files
      file.type.startsWith('audio/') || 
      ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      ) ||
      // Video files
      file.type.startsWith('video/') ||
      ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'].some(ext => 
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
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="text-center p-12 rounded-xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 transition-all duration-300 group cursor-pointer"
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
            <Video className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">
            גרור קבצי אודיו או וידאו לכאן
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
          accept="audio/*,video/*,.mp3,.wav,.flac,.aac,.ogg,.m4a,.wma,.mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.m4v"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-xs text-gray-400 mt-4 space-y-1">
          <p><strong>אודיו:</strong> MP3, WAV, FLAC, AAC, OGG, M4A, WMA</p>
          <p><strong>וידאו:</strong> MP4, AVI, MOV, MKV, WMV, FLV, WebM, M4V</p>
        </div>
      </div>
    </div>
  );
};
