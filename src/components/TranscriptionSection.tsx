import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { FileText, Loader2, Download, MessageSquare, Info, Video, Music } from 'lucide-react';
import { FileItem } from '@/pages/Index';
import { transcribeAudio } from '@/services/transcriptionService';
import { processText } from '@/services/textProcessingService';
import { extractAudioFromVideo, isVideoFile, getMediaInfo } from '@/services/audioExtractionService';
import { useToast } from '@/hooks/use-toast';
import { FontControls } from '@/components/FontControls';
import { TextProcessingOptions } from '@/components/TextProcessingOptions';

interface TranscriptionResult {
  fileId: string;
  fileName: string;
  transcription: string;
  processedText?: string;
  processedOptions?: string[];
  isTranscribing: boolean;
  isProcessing: boolean;
  isExtracting: boolean;
  transcriptionProgress: number;
  processingProgress: number;
  extractionProgress: number;
  fileSize: number;
  wasChunked?: boolean;
  wasExtracted?: boolean;
  extractedSize?: number;
  mediaType?: string;
}

interface TranscriptionSectionProps {
  files: FileItem[];
}

export const TranscriptionSection = ({ files }: TranscriptionSectionProps) => {
  const groqApiKey = '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';
  const chatgptApiKey = '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';
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const { toast } = useToast();

  const handleTranscribe = async (file: FileItem) => {
    const existingIndex = transcriptions.findIndex(t => t.fileId === file.id);
    const mediaInfo = getMediaInfo(file.file);
    
    console.log('Starting transcription for:', file.file.name);
    console.log('Original file size:', (file.file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('Media info:', mediaInfo);
    
    if (existingIndex >= 0) {
      setTranscriptions(prev => prev.map((t, i) => 
        i === existingIndex ? { 
          ...t, 
          isTranscribing: true,
          isExtracting: mediaInfo.isVideo,
          transcriptionProgress: 0,
          extractionProgress: 0,
          mediaType: mediaInfo.type
        } : t
      ));
    } else {
      setTranscriptions(prev => [...prev, {
        fileId: file.id,
        fileName: file.file.name,
        transcription: '',
        isTranscribing: true,
        isProcessing: false,
        isExtracting: mediaInfo.isVideo,
        transcriptionProgress: 0,
        processingProgress: 0,
        extractionProgress: 0,
        fileSize: file.file.size,
        mediaType: mediaInfo.type
      }]);
    }

    try {
      let audioFile = file.file;
      
      // Extract audio from video if needed
      if (mediaInfo.isVideo) {
        console.log('Video file detected, extracting audio...');
        
        toast({
          title: 'מחלץ אודיו מהוידאו',
          description: `מחלץ אודיו מהקובץ ${file.file.name} (${mediaInfo.sizeInMB}MB)...`,
        });
        
        // Simulate extraction progress
        const extractionInterval = setInterval(() => {
          setTranscriptions(prev => prev.map(t => 
            t.fileId === file.id && t.isExtracting
              ? { ...t, extractionProgress: Math.min(t.extractionProgress + 20, 90) }
              : t
          ));
        }, 500);
        
        const extractionResult = await extractAudioFromVideo(file.file);
        clearInterval(extractionInterval);
        
        console.log('Audio extraction completed!');
        console.log('Original size:', (extractionResult.originalSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('Extracted size:', (extractionResult.extractedSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('Compression ratio:', ((extractionResult.originalSize - extractionResult.extractedSize) / extractionResult.originalSize * 100).toFixed(1), '%');
        
        // Create audio file from extracted blob
        audioFile = new File([extractionResult.audioBlob], `${file.file.name}_audio.wav`, {
          type: 'audio/wav'
        });
        
        setTranscriptions(prev => prev.map(t => 
          t.fileId === file.id 
            ? { 
                ...t, 
                isExtracting: false, 
                extractionProgress: 100,
                wasExtracted: true,
                extractedSize: extractionResult.extractedSize
              }
            : t
        ));
        
        const compressionRatio = ((file.file.size - extractionResult.extractedSize) / file.file.size * 100).toFixed(1);
        
        toast({
          title: 'חילוץ אודיו הושלם',
          description: `האודיו חולץ בהצלחה! גודל קטן יותר ב-${compressionRatio}% (${(extractionResult.extractedSize / 1024 / 1024).toFixed(1)}MB)`,
        });
      }
      
      // Now check if the audio file needs chunking
      const finalFileSize = audioFile.size;
      const isLargeFile = finalFileSize > 2 * 1024 * 1024;
      
      console.log('Final audio file size:', (finalFileSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('Needs chunking:', isLargeFile);
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, wasChunked: isLargeFile }
          : t
      ));
      
      if (isLargeFile) {
        const estimatedChunks = Math.ceil(finalFileSize / (2 * 1024 * 1024)) * 3;
        toast({
          title: 'קובץ אודיו גדול זוהה',
          description: `האודיו (${(finalFileSize / 1024 / 1024).toFixed(1)}MB) יפוצל ל-${estimatedChunks} חלקים לתמלול`,
        });
      }
      
      // Transcribe the audio file
      const transcription = await transcribeAudio(
        audioFile, 
        groqApiKey,
        (progress) => {
          setTranscriptions(prev => prev.map(t => 
            t.fileId === file.id 
              ? { ...t, transcriptionProgress: progress }
              : t
          ));
        }
      );
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, transcription, isTranscribing: false, transcriptionProgress: 100 }
          : t
      ));

      const successMessage = mediaInfo.isVideo 
        ? `התמלול של ${file.file.name} הושלם בהצלחה (אודיו חולץ מהוידאו)`
        : `התמלול של ${file.file.name} הושלם בהצלחה`;

      toast({
        title: 'תמלול הושלם',
        description: successMessage,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { 
              ...t, 
              isTranscribing: false, 
              isExtracting: false,
              transcriptionProgress: 0,
              extractionProgress: 0
            }
          : t
      ));
      
      toast({
        title: 'שגיאה בתמלול',
        description: `אירעה שגיאה במהלך התמלול: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleProcessText = async (transcriptionResult: TranscriptionResult, prompts: string[], selectedOptions: string[]) => {
    if (!transcriptionResult.transcription.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אין טקסט לעיבוד. בצע תמלול תחילה.',
        variant: 'destructive',
      });
      return;
    }

    setTranscriptions(prev => prev.map(t => 
      t.fileId === transcriptionResult.fileId 
        ? { ...t, isProcessing: true, processingProgress: 0 }
        : t
    ));

    try {
      // Simple progress tracking for text processing
      const progressInterval = setInterval(() => {
        setTranscriptions(prev => prev.map(t => 
          t.fileId === transcriptionResult.fileId && t.isProcessing
            ? { ...t, processingProgress: Math.min(t.processingProgress + 25, 90) }
            : t
        ));
      }, 1000);
      
      // Start actual processing
      const processedText = await processText(transcriptionResult.transcription, prompts, selectedOptions, chatgptApiKey);
      
      // Clear interval and complete progress
      clearInterval(progressInterval);
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === transcriptionResult.fileId 
          ? { ...t, processedText, processedOptions: selectedOptions, isProcessing: false, processingProgress: 100 }
          : t
      ));

      toast({
        title: 'עיבוד טקסט הושלם',
        description: `העיבוד של ${transcriptionResult.fileName} הושלם בהצלחה`,
      });
    } catch (error) {
      console.error('Text processing error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === transcriptionResult.fileId 
          ? { ...t, isProcessing: false, processingProgress: 0 }
          : t
      ));
      
      toast({
        title: 'שגיאה בעיבוד טקסט',
        description: 'אירעה שגיאה במהלך עיבוד הטקסט. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const downloadTranscription = (transcriptionResult: TranscriptionResult) => {
    const content = `תמלול: ${transcriptionResult.fileName}\n\n${transcriptionResult.transcription}${
      transcriptionResult.processedText ? `\n\nטקסט מעובד (${transcriptionResult.processedOptions?.join(', ')}):\n${transcriptionResult.processedText}` : ''
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
      .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
      .join('\n\n---\n\n');
    
    const whatsappText = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
    const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmail = () => {
    const transcriptionsText = transcriptions
      .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
      .join('\n\n---\n\n');
    
    const subject = encodeURIComponent('תמלולים');
    const body = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleCopy = async () => {
    const transcriptionsText = transcriptions
      .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
      .join('\n\n---\n\n');
    
    try {
      await navigator.clipboard.writeText(transcriptionsText);
      toast({
        title: 'הועתק בהצלחה',
        description: 'הטקסט הועתק ללוח העריכה',
      });
    } catch (error) {
      toast({
        title: 'שגיאה בהעתקה',
        description: 'לא ניתן להעתיק את הטקסט',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAll = () => {
    transcriptions.forEach(result => {
      if (result.transcription) {
        setTimeout(() => downloadTranscription(result), 100);
      }
    });
  };

  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <div className="space-y-8" dir="rtl">
      {/* Font Controls */}
      {transcriptions.length > 0 && (
        <FontControls
          fontSize={fontSize}
          fontFamily={fontFamily}
          onFontSizeChange={setFontSize}
          onFontFamilyChange={setFontFamily}
          onPrint={() => window.print()}
          onShare={() => {
            const transcriptionsText = transcriptions
              .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
              .join('\n\n---\n\n');
            
            const whatsappText = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
            const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
            window.open(whatsappUrl, '_blank');
          }}
          onDownload={() => {
            transcriptions.forEach(result => {
              if (result.transcription) {
                setTimeout(() => downloadTranscription(result), 100);
              }
            });
          }}
          onEmail={() => {
            const transcriptionsText = transcriptions
              .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
              .join('\n\n---\n\n');
            
            const subject = encodeURIComponent('תמלולים');
            const body = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
            const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
            window.open(mailtoUrl, '_blank');
          }}
          onCopy={async () => {
            const transcriptionsText = transcriptions
              .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
              .join('\n\n---\n\n');
            
            try {
              await navigator.clipboard.writeText(transcriptionsText);
              toast({
                title: 'הועתק בהצלחה',
                description: 'הטקסט הועתק ללוח העריכה',
              });
            } catch (error) {
              toast({
                title: 'שגיאה בהעתקה',
                description: 'לא ניתן להעתיק את הטקסט',
                variant: 'destructive',
              });
            }
          }}
        />
      )}

      {/* Files Ready for Transcription */}
      {completedFiles.length > 0 && (
        <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm shadow-lg border-2 border-purple-200 rounded-xl">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl ml-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">קבצים מוכנים לתמלול</h3>
              <p className="text-gray-600 text-sm">המר את הקבצים שלך לטקסט באמצעות AI מתקדם</p>
            </div>
            <Badge variant="secondary" className="ml-4 px-4 py-2 text-lg">
              {completedFiles.length}
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {completedFiles.map((file) => {
              const mediaInfo = getMediaInfo(file.file);
              const isLargeFile = file.file.size > 2 * 1024 * 1024;
              
              return (
                <div key={file.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-xl">
                      {mediaInfo.isVideo ? (
                        <Video className="w-5 h-5 text-purple-600" />
                      ) : mediaInfo.isAudio ? (
                        <Music className="w-5 h-5 text-purple-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {file.file.name}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>מוכן לתמלול • {mediaInfo.sizeInMB} MB • {mediaInfo.type}</p>
                        {mediaInfo.isVideo && (
                          <div className="flex items-center text-blue-600">
                            <Info className="w-4 h-4 ml-1" />
                            <span>יחולץ אודיו מהוידאו לפני התמלול</span>
                          </div>
                        )}
                        {isLargeFile && !mediaInfo.isVideo && (
                          <div className="flex items-center text-orange-600">
                            <Info className="w-4 h-4 ml-1" />
                            <span>יפוצל לחלקים קטנים לתמלול</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="lg"
                    onClick={() => handleTranscribe(file)}
                    disabled={transcriptions.find(t => t.fileId === file.id)?.isTranscribing}
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl shadow-lg"
                  >
                    {transcriptions.find(t => t.fileId === file.id)?.isTranscribing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        {transcriptions.find(t => t.fileId === file.id)?.isExtracting ? 'מחלץ אודיו...' : 'מתמלל...'}
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 ml-2" />
                        תמלל עכשיו
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Transcription Results */}
      {transcriptions.length > 0 && (
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-lg border-0 rounded-xl">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl ml-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">תוצאות תמלול וסיכום</h3>
              <p className="text-gray-600 text-sm">הטקסטים המתמללים והסיכומים שלהם</p>
            </div>
          </div>
          
          <div className="space-y-8">
            {transcriptions.map((result) => (
              <div key={result.fileId} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-blue-50 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg ml-3">
                      {result.mediaType === 'video' ? (
                        <Video className="w-5 h-5 text-blue-600" />
                      ) : result.mediaType === 'audio' ? (
                        <Music className="w-5 h-5 text-blue-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{result.fileName}</h4>
                      <div className="text-sm text-gray-600">
                        <p>תמלול ועיבוד אוטומטי • {(result.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        {result.wasExtracted && (
                          <p className="text-green-600">אודיו חולץ מהוידאו • {(result.extractedSize! / 1024 / 1024).toFixed(1)}MB</p>
                        )}
                        {result.wasChunked && (
                          <p className="text-blue-600">נתמלל מחלקים קטנים</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 space-x-reverse">
                    {result.transcription && (
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => downloadTranscription(result)}
                        className="px-6 py-2 rounded-lg border-2 hover:bg-gray-50"
                      >
                        <Download className="w-4 h-4 ml-2" />
                        הורד קובץ
                      </Button>
                    )}
                  </div>
                </div>
                
                {result.isExtracting && (
                  <div className="space-y-4 py-6">
                    <div className="flex items-center justify-center text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin ml-3" />
                      <span className="text-lg font-medium">מחלץ אודיו מהוידאו...</span>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>התקדמות חילוץ</span>
                        <span>{Math.round(result.extractionProgress)}%</span>
                      </div>
                      <Progress value={result.extractionProgress} className="h-3" />
                    </div>
                  </div>
                )}
                
                {result.isTranscribing && !result.isExtracting && (
                  <div className="space-y-4 py-6">
                    <div className="flex items-center justify-center text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin ml-3" />
                      <span className="text-lg font-medium">
                        {result.wasChunked ? 'מתמלל מחלקים קטנים...' : 'מתמלל את הקובץ...'}
                      </span>
                    </div>
                    <div className="w-full">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>התקדמות תמלול</span>
                        <span>{Math.round(result.transcriptionProgress)}%</span>
                      </div>
                      <Progress value={result.transcriptionProgress} className="h-3" />
                    </div>
                  </div>
                )}
                
                {result.transcription && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-lg font-bold text-gray-700 mb-3">
                        תמלול מלא:
                      </label>
                      <Textarea
                        value={result.transcription}
                        readOnly
                        style={{ fontSize: `${fontSize}px`, fontFamily, textAlign: 'right' }}
                        className="min-h-[150px] resize-none leading-relaxed p-4 bg-white border-2 border-gray-200 rounded-lg"
                        dir="rtl"
                      />
                    </div>

                    {/* Text Processing Options */}
                    <TextProcessingOptions
                      onProcess={(prompts, selectedOptions) => handleProcessText(result, prompts, selectedOptions)}
                      isProcessing={result.isProcessing}
                      hasTranscription={!!result.transcription}
                    />
                    
                    {result.isProcessing && (
                      <div className="space-y-4 py-6">
                        <div className="flex items-center justify-center text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          <span className="text-lg font-medium">מעבד טקסט עם ChatGPT...</span>
                        </div>
                        <div className="w-full">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>התקדמות עיבוד</span>
                            <span>{Math.round(result.processingProgress)}%</span>
                          </div>
                          <Progress value={result.processingProgress} className="h-3" />
                        </div>
                      </div>
                    )}
                    
                    {result.processedText && (
                      <div>
                        <label className="block text-lg font-bold text-gray-700 mb-3">
                          טקסט מעובד ({result.processedOptions?.join(', ')}):
                        </label>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                          <div 
                            style={{ 
                              fontSize: `${fontSize}px`, 
                              fontFamily, 
                              textAlign: 'right',
                              lineHeight: '1.8',
                              whiteSpace: 'pre-wrap'
                            }}
                            className="text-gray-800"
                            dir="rtl"
                          >
                            {result.processedText}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
