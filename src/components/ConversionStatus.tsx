import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { FileItem } from '@/types/fileItem';

interface ConversionStatusProps {
  files: FileItem[];
}

export const ConversionStatus = ({ files }: ConversionStatusProps) => {
  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
          <div className="flex items-center space-x-4 space-x-reverse">
            {file.status === 'pending' && (
              <Clock className="w-6 h-6 text-gray-400" />
            )}
            {file.status === 'converting' && (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            )}
            {file.status === 'completed' && (
              <CheckCircle className="w-6 h-6 text-green-500" />
            )}
            {file.status === 'error' && (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
            <div className="text-gray-700 font-medium">{file.file.name}</div>
          </div>
          {file.status === 'converting' && (
            <Progress value={50} className="w-32" />
          )}
        </div>
      ))}
    </div>
  );
};
