
import { Button } from '@/components/ui/button';
import { Download, FileAudio, FileVideo } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface DownloadSectionProps {
  files: FileItem[];
}

export const DownloadSection = ({ files }: DownloadSectionProps) => {
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

  const handleDownloadAll = () => {
    files.forEach(file => {
      if (file.convertedUrl) {
        setTimeout(() => handleDownload(file), 100);
      }
    });
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
      <div className="flex justify-end">
        <Button
          onClick={handleDownloadAll}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          הורד הכל
        </Button>
      </div>

      <div className="space-y-3">
        {files.map((file) => {
          const outputFormat = file.outputFormat || 'mp3';
          const isVideo = outputFormat === 'webm';
          
          return (
            <div key={file.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="bg-green-100 p-2 rounded-full">
                  {isVideo ? (
                    <FileVideo className="w-4 h-4 text-green-600" />
                  ) : (
                    <FileAudio className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.file.name.replace(/\.[^/.]+$/, `.${outputFormat}`)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.file.size)} • {outputFormat.toUpperCase()}
                    {file.autoProcess && <span className="text-blue-600"> • עיבוד אוטומטי</span>}
                  </p>
                </div>
              </div>
              
              <Button
                size="sm"
                onClick={() => handleDownload(file)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
