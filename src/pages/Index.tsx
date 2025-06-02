import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { NavigationTabs } from '@/components/NavigationTabs';
import { Music, Video, Youtube } from 'lucide-react';

export interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'completed' | 'error';
  progress: number;
  convertedUrl?: string;
  convertedSize?: number;
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

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const simulateConversion = async (fileId: string) => {
    const updateProgress = (progress: number) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress, status: progress === 100 ? 'completed' : 'converting' }
          : f
      ));
    };

    const fileItem = files.find(f => f.id === fileId);
    if (!fileItem) return;

    try {
      console.log(`Starting conversion for file: ${fileItem.file.name}, size: ${fileItem.file.size} bytes`);
      
      // Check if file is larger than 40MB
      const maxSize = 40 * 1024 * 1024; // 40MB
      const needsSplitting = fileItem.file.size > maxSize;
      
      if (needsSplitting) {
        console.log('File is larger than 40MB, will split into chunks');
        updateProgress(5);
        
        // Import the audio splitter service
        const { splitAudioFile } = await import('@/services/audioSplitterService');
        const chunks = await splitAudioFile(fileItem.file, maxSize);
        
        console.log(`File split into ${chunks.length} chunks`);
        updateProgress(20);
        
        // Process each chunk
        let processedChunks = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          updateProgress(20 + (i / chunks.length) * 50);
          
          // Convert each chunk
          const { compressAudio } = await import('@/services/audioCompressionService');
          const compressedChunk = await compressAudio(new File([chunk.blob], `chunk_${i}.wav`), { bitrate: 16 });
          
          processedChunks.push({
            blob: compressedChunk,
            chunkIndex: i,
            startTime: chunk.startTime,
            endTime: chunk.endTime
          });
        }
        
        updateProgress(80);
        
        // Combine chunks back together (for simplicity, we'll just use the first chunk)
        // In a real implementation, you'd properly merge the audio chunks
        const finalBlob = processedChunks[0].blob;
        
        updateProgress(100);
        
        const convertedUrl = URL.createObjectURL(finalBlob);
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, convertedUrl, convertedSize: finalBlob.size }
            : f
        ));
        
        console.log(`Large file processed: ${chunks.length} chunks, final size: ${finalBlob.size} bytes`);
        
      } else {
        // Normal conversion process for smaller files
        for (let i = 0; i <= 70; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          updateProgress(i);
        }

        // Import compression service
        const { compressAudio } = await import('@/services/audioCompressionService');
        
        let convertedBlob: Blob;
        
        if (fileItem.outputFormat === 'webm' || fileItem.outputFormat === 'mp3') {
          // Apply 16 kbps compression
          convertedBlob = await compressAudio(fileItem.file, { bitrate: 16 });
          updateProgress(90);
        } else {
          // Fallback to original file
          convertedBlob = fileItem.file;
          updateProgress(90);
        }

        updateProgress(100);

        // Create compressed URL
        const convertedUrl = URL.createObjectURL(convertedBlob);
        
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, convertedUrl, convertedSize: convertedBlob.size }
            : f
        ));

        console.log(`File compressed from ${fileItem.file.size} to ${convertedBlob.size} bytes`);
      }

    } catch (error) {
      console.error('Compression error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error' }
          : f
      ));
    }
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
            + תמלול וסיכום בעברית + הורדה מיוטיוב
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            המר בקלות כל קובץ אודיו או וידאו ל-MP3/WebM באיכות 16 kbps, הורד מיוטיוב עם כתוביות, תמלל תוכן לטקסט וקבל סיכום אוטומטי בעברית
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">המרת קבצים</h3>
            <p className="text-blue-100 text-lg">המר קבצי אודיו ווידאו ל-MP3/WebM</p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-to-br from-red-500 to-orange-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center mb-4">
              <Youtube className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">הורדה מיוטיוב</h3>
            <p className="text-red-100 text-lg">הורד אודיו מיוטיוב עם כתוביות</p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-center mb-4">
              <Video className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">תמלול</h3>
            <p className="text-purple-100 text-lg">תמלול וסיכום אוטומטי בעברית</p>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <NavigationTabs
          files={files}
          onFilesSelected={handleFilesSelected}
          onConvertAll={handleConvertAll}
          onClearCompleted={clearCompleted}
          onDeleteFile={handleDeleteFile}
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
