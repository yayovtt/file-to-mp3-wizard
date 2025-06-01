
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileAudio, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface ConversionStatusProps {
  files: FileItem[];
}

export const ConversionStatus = ({ files }: ConversionStatusProps) => {
  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <FileAudio className="w-4 h-4 text-gray-500" />;
      case 'converting':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: FileItem['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'ממתין' },
      converting: { variant: 'default' as const, text: 'מתמיר' },
      completed: { variant: 'default' as const, text: 'הושלם', className: 'bg-green-500 hover:bg-green-600' },
      error: { variant: 'destructive' as const, text: 'שגיאה' },
    };
    
    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div key={file.id} className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {getStatusIcon(file.status)}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.file.size)}
                </p>
              </div>
            </div>
            {getStatusBadge(file.status)}
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
      ))}
    </div>
  );
};
