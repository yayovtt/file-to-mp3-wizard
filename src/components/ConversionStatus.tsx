
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileAudio, FileVideo, CheckCircle, AlertCircle, Loader2, Download, X } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface ConversionStatusProps {
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
}

export const ConversionStatus = ({ files, onRemoveFile }: ConversionStatusProps) => {
  const getStatusIcon = (status: FileItem['status'], isVideo: boolean) => {
    const iconProps = "w-4 h-4";
    const BaseIcon = isVideo ? FileVideo : FileAudio;
    
    switch (status) {
      case 'pending':
        return <BaseIcon className={`${iconProps} text-gray-500`} />;
      case 'converting':
        return <Loader2 className={`${iconProps} text-blue-500 animate-spin`} />;
      case 'completed':
        return <CheckCircle className={`${iconProps} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconProps} text-red-500`} />;
    }
  };

  const getStatusBadge = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            ממתין
          </Badge>
        );
      case 'converting':
        return (
          <Badge variant="default">
            מתמיר
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
            הושלם
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            שגיאה
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideoFile = (filename: string) => {
    return ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'].some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
  };

  const handleDownload = (file: FileItem) => {
    if (file.convertedUrl) {
      const link = document.createElement('a');
      link.href = file.convertedUrl;
      link.download = `${file.file.name.replace(/\.[^/.]+$/, '')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div key={file.id} className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
              {getStatusIcon(file.status, isVideoFile(file.file.name))}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file.size)} • {isVideoFile(file.file.name) ? 'וידאו → MP3' : 'אודיו → MP3'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {file.status === 'completed' && file.convertedUrl && (
                <Button
                  size="sm"
                  onClick={() => handleDownload(file)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              {getStatusBadge(file.status)}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveFile(file.id)}
                className="text-gray-500 hover:text-red-500 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {file.status === 'converting' && (
            <div className="space-y-2">
              <Progress value={file.progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                המרה: {file.progress}% הושלם
              </p>
            </div>
          )}

          {file.isTranscribing && (
            <div className="space-y-2 mt-3">
              <Progress value={file.transcriptionProgress || 0} className="h-2 bg-purple-100" />
              <p className="text-xs text-center text-purple-600">
                תמלול: {Math.round(file.transcriptionProgress || 0)}% הושלם
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
