
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ConversionStatus } from '@/components/ConversionStatus';
import { DownloadSection } from '@/components/DownloadSection';
import { Music, Video, Download, Sparkles } from 'lucide-react';
import { TranscriptionSection } from '@/components/TranscriptionSection';

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
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6 space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-3xl shadow-lg">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-3xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
            המרת אודיו ווידאו ל-MP3
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
            + תמלול וסיכום בעברית
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            המר בקלות כל קובץ אודיו או וידאו ל-MP3 באיכות גבוהה, תמלל תוכן לטקסט וקבל סיכום אוטומטי בעברית
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-3">{files.length}</div>
            <div className="text-blue-100 text-lg">קבצים בסך הכל</div>
          </Card>
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-3">{pendingFiles.length}</div>
            <div className="text-purple-100 text-lg">ממתינים להמרה</div>
          </Card>
          <Card className="p-8 text-center bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-3">{completedFiles.length}</div>
            <div className="text-green-100 text-lg">הושלמו</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          {/* Upload Section */}
          <div className="space-y-8">
            <Card className="p-8 border-2 border-dashed border-blue-300 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
              <FileUpload onFilesSelected={handleFilesSelected} />
            </Card>

            {files.length > 0 && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">רשימת קבצים</h3>
                  <div className="flex gap-3">
                    {pendingFiles.length > 0 && (
                      <Button
                        onClick={handleConvertAll}
                        disabled={isConverting}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 ml-2" />
                        המר הכל
                      </Button>
                    )}
                    {completedFiles.length > 0 && (
                      <Button variant="outline" onClick={clearCompleted} size="lg" className="px-6 py-3 text-lg rounded-xl">
                        נקה הושלמו
                      </Button>
                    )}
                  </div>
                </div>
                <ConversionStatus files={files} />
              </Card>
            )}

            {/* Supported Formats */}
            <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-xl rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">פורמטים נתמכים</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">אודיו:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA'].map(format => (
                      <Badge key={format} variant="secondary" className="justify-center py-2 text-sm font-medium">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">וידאו:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['MP4', 'AVI', 'MOV', 'MKV', 'WMV', 'WebM'].map(format => (
                      <Badge key={format} variant="secondary" className="justify-center bg-purple-100 text-purple-700 py-2 text-sm font-medium">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Download and Transcription Section */}
          <div className="space-y-8">
            {completedFiles.length > 0 && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl mr-4">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">קבצים מוכנים להורדה</h3>
                    <p className="text-gray-600">הקבצים המומרים שלך מוכנים</p>
                  </div>
                  <Badge variant="secondary" className="mr-4 px-4 py-2 text-lg">
                    {completedFiles.length}
                  </Badge>
                </div>
                <DownloadSection files={completedFiles} />
              </Card>
            )}

            {/* Transcription Section */}
            <TranscriptionSection files={files} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
