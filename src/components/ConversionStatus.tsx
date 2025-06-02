
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileAudio, FileVideo, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface ConversionStatusProps {
  files: FileItem[];
}

export const ConversionStatus = ({ files }: ConversionStatusProps) => {
  const handleDownload = (file: FileItem) => {
    if (file.convertedUrl) {
      const link = document.createElement('a');
      link.href = file.convertedUrl;
      const extension = file.outputFormat || 'mp3';
      link.download = file.file.name.replace(/\.[^/.]+$/, `.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

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

  const getCompressionInfo = (file: FileItem) => {
    const originalSize = file.file.size;
    const compressedSize = file.convertedSize || originalSize;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    return {
      originalSize,
      compressedSize,
      compressionRatio: parseFloat(compressionRatio)
    };
  };

  return (
    <div className="space-y-4">
      {files.map((file) => {
        const compressionInfo = getCompressionInfo(file);
        
        return (
          <div key={file.id} className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                {getStatusIcon(file.status, isVideoFile(file.file.name))}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(compressionInfo.originalSize)}
                    {file.status === 'completed' && file.convertedSize && (
                      <span>
                        {' → '}{formatFileSize(compressionInfo.compressedSize)}
                        {compressionInfo.compressionRatio > 0 && (
                          <span className="text-green-600 font-medium"> • חסכון של {compressionInfo.compressionRatio}%</span>
                        )}
                      </span>
                    )}
                    {' • '}{isVideoFile(file.file.name) ? 'וידאו' : 'אודיו'} → {(file.outputFormat || 'mp3').toUpperCase()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {file.status === 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => handleDownload(file)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                {getStatusBadge(file.status)}
              </div>
            </div>
            
            {file.status === 'converting' && (
              <div className="space-y-2">
                <Progress value={file.progress} className="h-2" />
                <p className="text-xs text-center text-gray-500">
                  {file.progress}% הושלם
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
