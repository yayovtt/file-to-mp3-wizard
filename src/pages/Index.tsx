
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { NavigationTabs } from '@/components/NavigationTabs';
import { Music, Video } from 'lucide-react';

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  convertedUrl?: string;
  outputFormat?: 'mp3' | 'webm';
  autoProcess?: boolean;
}

const Index = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'mp3' | 'webm'>('mp3');
  const [autoProcess, setAutoProcess] = useState(false);

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles: FileItem[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      progress: 0,
      outputFormat,
      autoProcess,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6 space-x-4 space-x-reverse">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-3xl shadow-lg">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-3xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
            המרת אודיו ווידאו ל-MP3/WebM
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
            + תמלול וסיכום בעברית
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            המר בקלות כל קובץ אודיו או וידאו ל-MP3 או WebM באיכות גבוהה, תמלל תוכן לטקסט וקבל סיכום אוטומטי בעברית
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">המרת קבצים</h3>
            <p className="text-blue-100 text-lg">המר קבצי אודיו ווידאו ל-MP3/WebM</p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center mb-4">
              <Video className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">תמלול</h3>
            <p className="text-purple-100 text-lg">תמלול וסיכום אוטומטי בעברית</p>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-3">{files.length}</div>
            <div className="text-green-100 text-lg">קבצים בסך הכל</div>
          </Card>
          <Card className="p-8 text-center bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-3">{pendingFiles.length}</div>
            <div className="text-orange-100 text-lg">ממתינים להמרה</div>
          </Card>
          <Card className="p-8 text-center bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="text-4xl font-bold mb-3">{completedFiles.length}</div>
            <div className="text-emerald-100 text-lg">הושלמו</div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <NavigationTabs
          files={files}
          onFilesSelected={handleFilesSelected}
          onConvertAll={handleConvertAll}
          onClearCompleted={clearCompleted}
          isConverting={isConverting}
          outputFormat={outputFormat}
          onOutputFormatChange={setOutputFormat}
          autoProcess={autoProcess}
          onAutoProcessChange={setAutoProcess}
        />
      </div>
    </div>
  );
};

export default Index;
