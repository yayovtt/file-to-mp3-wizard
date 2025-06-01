
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { FileItem } from '@/pages/Index';
import { transcribeAudio } from '@/services/transcriptionService';
import { processTextWithAI } from '@/services/summarizationService';
import { compressAudio } from '@/services/audioCompressionService';
import { useToast } from '@/hooks/use-toast';
import { FontControls } from '@/components/FontControls';
import { FilesReadyForTranscription } from '@/components/transcription/FilesReadyForTranscription';
import { TranscriptionResult } from '@/components/transcription/TranscriptionResult';

interface TranscriptionSectionProps {
  files: FileItem[];
}

interface TranscriptionResultType {
  fileId: string;
  fileName: string;
  transcription: string;
  processedText?: string;
  processingType?: string;
  isTranscribing: boolean;
  isProcessing: boolean;
}

export const TranscriptionSection = ({ files }: TranscriptionSectionProps) => {
  const groqApiKey = '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';
  const chatgptApiKey = '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';
  const [transcriptions, setTranscriptions] = useState<TranscriptionResultType[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [processingOptions, setProcessingOptions] = useState<{[key: string]: string[]}>({});
  const { toast } = useToast();

  const handleTranscribe = async (file: FileItem) => {
    const existingIndex = transcriptions.findIndex(t => t.fileId === file.id);
    
    if (existingIndex >= 0) {
      setTranscriptions(prev => prev.map((t, i) => 
        i === existingIndex ? { ...t, isTranscribing: true } : t
      ));
    } else {
      setTranscriptions(prev => [...prev, {
        fileId: file.id,
        fileName: file.file.name,
        transcription: '',
        isTranscribing: true,
        isProcessing: false,
      }]);
    }

    try {
      // Compress audio before transcription
      const compressedFile = await compressAudio(file.file);
      console.log(`Original size: ${(file.file.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
      
      const transcription = await transcribeAudio(compressedFile, groqApiKey);
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, transcription, isTranscribing: false }
          : t
      ));

      toast({
        title: 'תמלול הושלם',
        description: `התמלול של ${file.file.name} הושלם בהצלחה`,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, isTranscribing: false }
          : t
      ));
      
      toast({
        title: 'שגיאה בתמלול',
        description: 'אירעה שגיאה במהלך התמלול. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const handleProcessText = async (fileId: string, selectedOptions: string[]) => {
    const transcriptionResult = transcriptions.find(t => t.fileId === fileId);
    
    if (!transcriptionResult?.transcription.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אין טקסט לעיבוד. בצע תמלול תחילה.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedOptions.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'בחר לפחות אפשרות עיבוד אחת.',
        variant: 'destructive',
      });
      return;
    }

    setTranscriptions(prev => prev.map(t => 
      t.fileId === fileId 
        ? { ...t, isProcessing: true }
        : t
    ));

    try {
      const processedText = await processTextWithAI(transcriptionResult.transcription, selectedOptions, chatgptApiKey);
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === fileId 
          ? { ...t, processedText, processingType: selectedOptions.join(' + '), isProcessing: false }
          : t
      ));

      toast({
        title: 'עיבוד הושלם',
        description: `העיבוד של ${transcriptionResult.fileName} הושלם בהצלחה`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === fileId 
          ? { ...t, isProcessing: false }
          : t
      ));
      
      toast({
        title: 'שגיאה בעיבוד',
        description: 'אירעה שגיאה במהלך העיבוד. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const updateProcessingOptions = (fileId: string, option: string, checked: boolean) => {
    setProcessingOptions(prev => {
      const current = prev[fileId] || [];
      if (checked) {
        return { ...prev, [fileId]: [...current, option] };
      } else {
        return { ...prev, [fileId]: current.filter(opt => opt !== option) };
      }
    });
  };

  const downloadTranscription = (transcriptionResult: TranscriptionResultType) => {
    const content = `תמלול: ${transcriptionResult.fileName}\n\n${transcriptionResult.transcription}${
      transcriptionResult.processedText ? `\n\n${transcriptionResult.processingType}:\n${transcriptionResult.processedText}` : ''
    }`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${transcriptionResult.fileName.replace(/\.[^/.]+$/, '')}_transcription.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const transcriptionsText = transcriptions
      .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\n${result.processingType}: ${result.processedText}` : ''}`)
      .join('\n\n---\n\n');
    
    const whatsappText = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDownloadAll = () => {
    transcriptions.forEach(result => {
      if (result.transcription) {
        setTimeout(() => downloadTranscription(result), 100);
      }
    });
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Font Controls */}
      {transcriptions.length > 0 && (
        <FontControls
          fontSize={fontSize}
          fontFamily={fontFamily}
          onFontSizeChange={setFontSize}
          onFontFamilyChange={setFontFamily}
          onPrint={handlePrint}
          onShare={handleShare}
          onDownload={handleDownloadAll}
        />
      )}

      {/* Files Ready for Transcription */}
      <FilesReadyForTranscription
        files={files}
        transcriptions={transcriptions}
        onTranscribe={handleTranscribe}
      />

      {/* Transcription Results */}
      {transcriptions.length > 0 && (
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl ml-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">תוצאות תמלול ועיבוד</h3>
              <p className="text-gray-600 text-sm">הטקסטים המתמללים והעיבוד שלהם</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {transcriptions.map((result) => (
              <TranscriptionResult
                key={result.fileId}
                result={result}
                fontSize={fontSize}
                fontFamily={fontFamily}
                processingOptions={processingOptions}
                onUpdateOptions={updateProcessingOptions}
                onProcessText={handleProcessText}
                onDownload={() => downloadTranscription(result)}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
