import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { FileUploadForTranscription } from './transcription/FileUploadForTranscription';
import { ProcessingSteps } from './transcription/ProcessingSteps';
import { TranscriptionResult } from './transcription/TranscriptionResult';
import { FontControls } from './FontControls';
import { transcribeAudio } from '@/services/transcriptionService';
import { processTextWithAI } from '@/services/summarizationService';
import { convertToMp3 } from '@/services/conversionService';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionFile } from '@/types/transcription';

export const TranscriptionSection = () => {
  const groqApiKey = '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';
  const chatgptApiKey = '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';
  
  const [files, setFiles] = useState<TranscriptionFile[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const { toast } = useToast();

  const handleFilesSelected = async (selectedFiles: File[]) => {
    const newFiles: TranscriptionFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading' as const,
      processedTexts: [],
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (const fileData of newFiles) {
      await processFile(fileData.id);
    }
  };

  const processFile = async (fileId: string) => {
    try {
      const fileData = files.find(f => f.id === fileId);
      if (!fileData) return;

      // Step 1: Convert to MP3 (hidden from user)
      const mp3Blob = await convertToMp3(fileData.file);
      
      // Step 2: Start transcription (show to user)
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, mp3Blob, status: 'transcribing' } : f
      ));

      const mp3File = new File([mp3Blob], fileData.file.name.replace(/\.[^/.]+$/, '.mp3'), {
        type: 'audio/mp3'
      });

      const transcription = await transcribeAudio(mp3File, groqApiKey);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, transcription, status: 'completed' } : f
      ));

      toast({
        title: 'תמלול הושלם',
        description: `התמלול של ${fileData.file.name} הושלם בהצלחה`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error' } : f
      ));
      
      toast({
        title: 'שגיאה בעיבוד',
        description: 'אירעה שגיאה במהלך העיבוד. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const handleProcessText = async (fileId: string, selectedOptions: string[]) => {
    const fileData = files.find(f => f.id === fileId);
    if (!fileData?.transcription) return;

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, isProcessing: true } : f
    ));

    try {
      const processedText = await processTextWithAI(fileData.transcription, selectedOptions, chatgptApiKey);
      const processType = selectedOptions.join(' + ');
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          processedTexts: [...f.processedTexts, { type: processType, content: processedText }],
          isProcessing: false 
        } : f
      ));

      toast({
        title: 'עיבוד הושלם',
        description: `העיבוד הושלם בהצלחה`,
      });
    } catch (error) {
      console.error('Processing error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, isProcessing: false } : f
      ));
      
      toast({
        title: 'שגיאה בעיבוד',
        description: 'אירעה שגיאה במהלך העיבוד. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const downloadTranscription = (fileData: TranscriptionFile) => {
    const content = `תמלול: ${fileData.file.name}\n\n${fileData.transcription}${
      fileData.processedTexts.length > 0 
        ? '\n\n' + fileData.processedTexts.map(p => `${p.type}:\n${p.content}`).join('\n\n')
        : ''
    }`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileData.file.name.replace(/\.[^/.]+$/, '')}_transcription.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();
  const handleShare = () => {
    const transcriptionsText = files
      .filter(f => f.transcription)
      .map(f => `${f.file.name}:\n${f.transcription}${f.processedTexts.length > 0 ? '\n\n' + f.processedTexts.map(p => `${p.type}: ${p.content}`).join('\n\n') : ''}`)
      .join('\n\n---\n\n');
    
    const whatsappText = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
    window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
  };

  const handleDownloadAll = () => {
    files.filter(f => f.transcription).forEach(f => downloadTranscription(f));
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Font Controls */}
      {files.some(f => f.transcription) && (
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

      {/* File Upload */}
      <FileUploadForTranscription onFilesSelected={handleFilesSelected} />

      {/* Processing Status */}
      {files.filter(f => f.status !== 'completed').length > 0 && (
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">מתמלל קבצים...</h3>
          <div className="space-y-4">
            {files.filter(f => f.status !== 'completed').map((file) => (
              <ProcessingSteps
                key={file.id}
                currentStep={file.status === 'transcribing' ? 'transcription' : 'transcription'}
                fileName={file.file.name}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Transcription Results */}
      {files.filter(f => f.transcription).length > 0 && (
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-6">תוצאות תמלול</h3>
          <div className="space-y-8">
            {files.filter(f => f.transcription).map((file) => (
              <TranscriptionResult
                key={file.id}
                fileName={file.file.name}
                transcription={file.transcription!}
                processedTexts={file.processedTexts}
                fontSize={fontSize}
                fontFamily={fontFamily}
                onProcessText={(options) => handleProcessText(file.id, options)}
                onDownload={() => downloadTranscription(file)}
                isProcessing={file.isProcessing || false}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
