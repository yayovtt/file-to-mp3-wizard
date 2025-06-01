
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, MessageSquare, Video, Music, X } from 'lucide-react';
import { FileItem } from '@/pages/Index';
import { processText } from '@/services/textProcessingService';
import { getMediaInfo } from '@/services/audioExtractionService';
import { useToast } from '@/hooks/use-toast';
import { FontControls } from '@/components/FontControls';
import { TextProcessingOptions } from '@/components/TextProcessingOptions';

interface TranscriptionResult {
  fileId: string;
  fileName: string;
  transcription: string;
  processedText?: string;
  processedOptions?: string[];
  isProcessing: boolean;
  processingProgress: number;
  fileSize: number;
  mediaType?: string;
}

interface TranscriptionSectionProps {
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
}

export const TranscriptionSection = ({ files, onRemoveFile }: TranscriptionSectionProps) => {
  const chatgptApiKey = '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';
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const { toast } = useToast();

  // Convert completed files with transcriptions to transcription results
  const transcribedFiles = files.filter(f => f.transcription).map(file => {
    const existing = transcriptions.find(t => t.fileId === file.id);
    if (existing) return existing;
    
    const mediaInfo = getMediaInfo(file.file);
    return {
      fileId: file.id,
      fileName: file.file.name,
      transcription: file.transcription!,
      isProcessing: false,
      processingProgress: 0,
      fileSize: file.file.size,
      mediaType: mediaInfo.type
    };
  });

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

  return (
    <div className="space-y-8" dir="rtl">
      {/* Font Controls */}
      {transcribedFiles.length > 0 && (
        <FontControls
          fontSize={fontSize}
          fontFamily={fontFamily}
          onFontSizeChange={setFontSize}
          onFontFamilyChange={setFontFamily}
          onPrint={() => window.print()}
          onShare={() => {
            const transcriptionsText = transcribedFiles
              .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
              .join('\n\n---\n\n');
            
            const whatsappText = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
            const whatsappUrl = `https://wa.me/?text=${whatsappText}`;
            window.open(whatsappUrl, '_blank');
          }}
          onDownload={() => {
            transcribedFiles.forEach(result => {
              if (result.transcription) {
                setTimeout(() => downloadTranscription(result), 100);
              }
            });
          }}
          onEmail={() => {
            const transcriptionsText = transcribedFiles
              .map(result => `${result.fileName}:\n${result.transcription}${result.processedText ? `\n\nטקסט מעובד: ${result.processedText}` : ''}`)
              .join('\n\n---\n\n');
            
            const subject = encodeURIComponent('תמלולים');
            const body = encodeURIComponent(`תמלולים:\n\n${transcriptionsText}`);
            const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
            window.open(mailtoUrl, '_blank');
          }}
          onCopy={async () => {
            const transcriptionsText = transcribedFiles
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

      {/* Transcription Results */}
      {transcribedFiles.length > 0 && (
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
            {transcribedFiles.map((result) => (
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveFile(result.fileId)}
                      className="text-gray-500 hover:text-red-500 px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
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
