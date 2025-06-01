
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ConversionStatus } from '@/components/ConversionStatus';
import { DownloadSection } from '@/components/DownloadSection';
import { Music, Download, Sparkles } from 'lucide-react';

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  convertedUrl?: string;
}

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles: FileItem[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const simulateConversion = async (fileId: string) => {
    const updateProgress = (progress: number) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress, status: progress === 100 ? 'completed' : 'converting' }
          : f
      ));
    };

    // Simulate conversion progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(i);
    }

    // Create a mock converted URL (in real app, this would be the actual converted file)
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, convertedUrl: URL.createObjectURL(f.file) }
        : f
    ));
  };

  const handleConvertAll = async () => {
    setIsConverting(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await simulateConversion(file.id);
    }
    
    setIsConverting(false);
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  const pendingFiles = files.filter(f => f.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl">
              <Music className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            המרת קבצים ל-MP3
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            המר בקלות כל קובץ אודיו ל-MP3 באיכות גבוהה. תומך בכל הפורמטים הפופולריים
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <div className="text-3xl font-bold mb-2">{files.length}</div>
            <div className="text-blue-100">קבצים בסך הכל</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <div className="text-3xl font-bold mb-2">{pendingFiles.length}</div>
            <div className="text-purple-100">ממתינים להמרה</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <div className="text-3xl font-bold mb-2">{completedFiles.length}</div>
            <div className="text-green-100">הושלמו</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="p-6 border-2 border-dashed border-blue-200 bg-white/80 backdrop-blur-sm">
              <FileUpload onFilesSelected={handleFilesSelected} />
            </Card>

            {files.length > 0 && (
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">רשימת קבצים</h3>
                  <div className="flex gap-2">
                    {pendingFiles.length > 0 && (
                      <Button
                        onClick={handleConvertAll}
                        disabled={isConverting}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        המר הכל
                      </Button>
                    )}
                    {completedFiles.length > 0 && (
                      <Button variant="outline" onClick={clearCompleted}>
                        נקה הושלמו
                      </Button>
                    )}
                  </div>
                </div>
                <ConversionStatus files={files} />
              </Card>
            )}
          </div>

          {/* Download Section */}
          <div className="space-y-6">
            {completedFiles.length > 0 && (
              <Card className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <Download className="w-5 h-5 mr-2 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">קבצים מוכנים להורדה</h3>
                  <Badge variant="secondary" className="mr-2">
                    {completedFiles.length}
                  </Badge>
                </div>
                <DownloadSection files={completedFiles} />
              </Card>
            )}

            {/* Supported Formats */}
            <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">פורמטים נתמכים</h3>
              <div className="grid grid-cols-2 gap-2">
                {['WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA'].map(format => (
                  <Badge key={format} variant="secondary" className="justify-center">
                    {format}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
