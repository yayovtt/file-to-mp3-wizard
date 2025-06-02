import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { FileText, Loader2, Download, MessageSquare, Info, Save, Edit3, Sparkles } from 'lucide-react';
import { FileItem } from '@/pages/Index';
import { transcribeAudio } from '@/services/transcriptionService';
import { processText, AIProvider } from '@/services/textProcessingService';
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
  transcriptionProgress: number;
  processingProgress: number;
  fileSize: number;
  wasChunked?: boolean;
  isEditingTranscription?: boolean;
  isEditingProcessed?: boolean;
}

interface TranscriptionSectionProps {
  files: FileItem[];
  autoProcessEnabled?: boolean;
}

export const TranscriptionSection = ({ files, autoProcessEnabled = false }: TranscriptionSectionProps) => {
  const groqApiKey = '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';
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const { toast } = useToast();

  // Auto-process files when they complete conversion
  useEffect(() => {
    if (!autoProcessEnabled) return;

    const autoProcessFiles = files.filter(file => 
      file.status === 'completed' && 
      file.autoProcess && 
      !transcriptions.find(t => t.fileId === file.id)
    );

    autoProcessFiles.forEach(file => {
      // Start transcription automatically
      handleTranscribe(file);
    });
  }, [files, autoProcessEnabled, transcriptions]);

  // Progress simulation helper function
  const simulateProgress = (fileId: string, type: 'processing', duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const updateProgress = () => {
        currentStep++;
        const progress = (currentStep / steps) * 100;
        
        setTranscriptions(prev => prev.map(t => 
          t.fileId === fileId 
            ? { ...t, processingProgress: Math.min(progress, 100) }
            : t
        ));

        if (currentStep < steps) {
          setTimeout(updateProgress, stepDuration);
        } else {
          resolve();
        }
      };

      updateProgress();
    });
  };

  const getFileForTranscription = async (file: FileItem): Promise<File> => {
    // If the file has been converted and has a URL, use the converted file
    if (file.convertedUrl) {
      console.log(`Using converted file for transcription. Original size: ${file.file.size} bytes, Converted size: ${file.convertedSize} bytes`);
      
      try {
        // Fetch the converted file blob from the URL
        const response = await fetch(file.convertedUrl);
        const blob = await response.blob();
        
        // Create a new File object from the blob
        const convertedFile = new File([blob], file.file.name, { type: blob.type });
        console.log(`Converted file ready for transcription: ${convertedFile.size} bytes`);
        
        return convertedFile;
      } catch (error) {
        console.error('Error fetching converted file, falling back to original:', error);
        return file.file;
      }
    }
    
    // Fallback to original file
    console.log(`Using original file for transcription: ${file.file.size} bytes`);
    return file.file;
  };

  const handleTranscribe = async (file: FileItem) => {
    const existingIndex = transcriptions.findIndex(t => t.fileId === file.id);
    
    // Get the correct file for transcription (converted if available)
    const fileForTranscription = await getFileForTranscription(file);
    const isLargeFile = fileForTranscription.size > 49 * 1024 * 1024; // 49MB
    
    console.log(`Starting transcription for file: ${file.file.name}`);
    console.log(`Original file size: ${file.file.size} bytes`);
    console.log(`File for transcription size: ${fileForTranscription.size} bytes`);
    console.log(`Will be chunked: ${isLargeFile}`);
    
    if (existingIndex >= 0) {
      setTranscriptions(prev => prev.map((t, i) => 
        i === existingIndex ? { 
          ...t, 
          isTranscribing: true, 
          transcriptionProgress: 0,
          wasChunked: isLargeFile,
          fileSize: fileForTranscription.size
        } : t
      ));
    } else {
      setTranscriptions(prev => [...prev, {
        fileId: file.id,
        fileName: file.file.name,
        transcription: '',
        isTranscribing: true,
        isProcessing: false,
        transcriptionProgress: 0,
        processingProgress: 0,
        fileSize: fileForTranscription.size,
        wasChunked: isLargeFile
      }]);
    }

    try {
      if (isLargeFile) {
        toast({
          title: 'קובץ גדול זוהה',
          description: `הקובץ (${(fileForTranscription.size / 1024 / 1024).toFixed(1)}MB) יפוצל אוטומטית לחלקים קטנים יותר לתמלול`,
        });
      }
      
      // Use the converted file for transcription
      const transcription = await transcribeAudio(
        fileForTranscription, 
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

      const successMessage = isLargeFile 
        ? `התמלול של ${file.file.name} הושלם בהצלחה (פוצל ל-${Math.ceil(fileForTranscription.size / (49 * 1024 * 1024))} חלקים)`
        : `התמלול של ${file.file.name} הושלם בהצלחה`;

      toast({
        title: 'תמלול הושלם',
        description: successMessage,
      });

      // Auto-process text if enabled
      if (file.autoProcess && transcription.trim()) {
        const transcriptionResult = transcriptions.find(t => t.fileId === file.id) || {
          fileId: file.id,
          fileName: file.file.name,
          transcription,
          isTranscribing: false,
          isProcessing: false,
          transcriptionProgress: 100,
          processingProgress: 0,
          fileSize: fileForTranscription.size
        };
        
        // Start auto text processing with default options
        setTimeout(() => {
          handleProcessText(
            transcriptionResult, 
            ['סכם את הטקסט הבא בצורה קצרה וברורה'], 
            ['סיכום'], 
            false, 
            'chatgpt'
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, isTranscribing: false, transcriptionProgress: 0 }
          : t
      ));
      
      toast({
        title: 'שגיאה בתמלול',
        description: `אירעה שגיאה במהלך התמלול: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleProcessText = async (transcriptionResult: TranscriptionResult, prompts: string[], selectedOptions: string[], separateMode: boolean, provider: AIProvider) => {
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
      // Start progress simulation
      const progressPromise = simulateProgress(transcriptionResult.fileId, 'processing', 4000);
      
      // Use the Edge Function for processing (no API key needed)
      const processingPromise = processText(transcriptionResult.transcription, prompts, selectedOptions, '', separateMode, provider);
      
      // Wait for both to complete
      const [processedText] = await Promise.all([processingPromise, progressPromise]);
      
      const providerName = provider === 'chatgpt' ? 'ChatGPT' : 'Claude';
      const optionsLabel = separateMode ? `${selectedOptions.join(', ')} (נפרד - ${providerName})` : `${selectedOptions.join(', ')} (משולב - ${providerName})`;
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === transcriptionResult.fileId 
          ? { ...t, processedText, processedOptions: [optionsLabel], isProcessing: false, processingProgress: 100 }
          : t
      ));

      toast({
        title: 'עיבוד טקסט הושלם',
        description: `העיבוד של ${transcriptionResult.fileName} הושלם בהצלחה עם ${providerName}`,
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
        description: `אירעה שגיאה במהלך עיבוד הטקסט: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleEditTranscription = (fileId: string) => {
    setTranscriptions(prev => prev.map(t => 
      t.fileId === fileId 
        ? { ...t, isEditingTranscription: !t.isEditingTranscription }
        : t
    ));
  };

  const handleEditProcessed = (fileId: string) => {
    setTranscriptions(prev => prev.map(t => 
      t.fileId === fileId 
        ? { ...t, isEditingProcessed: !t.isEditingProcessed }
        : t
    ));
  };

  const handleTranscriptionChange = (fileId: string, newText: string) => {
    setTranscriptions(prev => prev.map(t => 
      t.fileId === fileId 
        ? { ...t, transcription: newText }
        : t
    ));
  };

  const handleProcessedTextChange = (fileId: string, newText: string) => {
    setTranscriptions(prev => prev.map(t => 
      t.fileId === fileId 
        ? { ...t, processedText: newText }
        : t
    ));
  };

  const handleSaveText = (fileId: string, type: 'transcription' | 'processed') => {
    setTranscriptions(prev => prev.map(t => 
      t.fileId === fileId 
        ? { 
            ...t, 
            isEditingTranscription: type === 'transcription' ? false : t.isEditingTranscription,
            isEditingProcessed: type === 'processed' ? false : t.isEditingProcessed
          }
        : t
    ));
    
    toast({
      title: 'נשמר בהצלחה',
      description: `השינויים ב${type === 'transcription' ? 'תמלול' : 'טקסט המעובד'} נשמרו`,
    });
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
      {/* Auto-processing info */}
      {autoProcessEnabled && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg rounded-xl">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-xl ml-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">עיבוד אוטומטי פעיל</h3>
              <p className="text-gray-600 text-sm">קבצים שהומרו יתחילו תמלול ועיבוד טקסט אוטומטי</p>
            </div>
          </div>
        </Card>
      )}

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
          onEmail={handleEmail}
          onCopy={handleCopy}
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
              const displaySize = file.convertedSize || file.file.size;
              const isLargeFile = displaySize > 49 * 1024 * 1024;
              const estimatedChunks = Math.ceil(displaySize / (49 * 1024 * 1024));
              const outputFormat = file.outputFormat || 'mp3';
              
              return (
                <div key={file.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-xl">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {file.file.name}
                      </p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>מוכן לתמלול • {(displaySize / 1024 / 1024).toFixed(2)} MB • {outputFormat.toUpperCase()}</p>
                        {file.convertedSize && (
                          <p className="text-blue-600">דחוס מ-{(file.file.size / 1024 / 1024).toFixed(2)}MB</p>
                        )}
                        {file.autoProcess && <p className="text-green-600 font-medium">עיבוד אוטומטי מופעל</p>}
                        {isLargeFile && <p className="text-orange-600">יפוצל ל-{estimatedChunks} חלקים</p>}
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
                        מתמלל...
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
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{result.fileName}</h4>
                      <div className="text-sm text-gray-600">
                        <p>תמלול ועיבוד אוטומטי • {(result.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        {result.wasChunked && <p className="text-orange-600">פוצל לחלקים קטנים</p>}
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
                
                {/* Transcribing progress */}
                {result.isTranscribing && (
                  <div className="space-y-4 py-6">
                    <div className="flex items-center justify-center text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin ml-3" />
                      <span className="text-lg font-medium">מתמלל את הקובץ...</span>
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
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-lg font-bold text-gray-700">
                          תמלול מלא:
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => result.isEditingTranscription ? handleSaveText(result.fileId, 'transcription') : handleEditTranscription(result.fileId)}
                          className="flex items-center gap-2"
                        >
                          {result.isEditingTranscription ? (
                            <>
                              <Save className="w-4 h-4" />
                              שמור
                            </>
                          ) : (
                            <>
                              <Edit3 className="w-4 h-4" />
                              ערוך
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        value={result.transcription}
                        onChange={(e) => handleTranscriptionChange(result.fileId, e.target.value)}
                        readOnly={!result.isEditingTranscription}
                        style={{ fontSize: `${fontSize}px`, fontFamily, textAlign: 'right' }}
                        className={`min-h-[150px] resize-none leading-relaxed p-4 border-2 rounded-lg ${
                          result.isEditingTranscription 
                            ? 'bg-yellow-50 border-yellow-300 focus:border-yellow-500' 
                            : 'bg-white border-gray-200'
                        }`}
                        dir="rtl"
                      />
                    </div>

                    {/* Text Processing Options */}
                    <TextProcessingOptions
                      onProcess={(prompts, selectedOptions, separateMode, provider) => handleProcessText(result, prompts, selectedOptions, separateMode, provider)}
                      isProcessing={result.isProcessing}
                      hasTranscription={!!result.transcription}
                    />
                    
                    {/* Processing progress */}
                    {result.isProcessing && (
                      <div className="space-y-4 py-6">
                        <div className="flex items-center justify-center text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          <span className="text-lg font-medium">מעבד טקסט עם AI...</span>
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
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-lg font-bold text-gray-700">
                            טקסט מעובד ({result.processedOptions?.join(', ')}):
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => result.isEditingProcessed ? handleSaveText(result.fileId, 'processed') : handleEditProcessed(result.fileId)}
                            className="flex items-center gap-2"
                          >
                            {result.isEditingProcessed ? (
                              <>
                                <Save className="w-4 h-4" />
                                שמור
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-4 h-4" />
                                ערוך
                              </>
                            )}
                          </Button>
                        </div>
                        <div className={`border-2 rounded-lg p-4 ${
                          result.isEditingProcessed 
                            ? 'bg-yellow-50 border-yellow-300' 
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        }`}>
                          {result.isEditingProcessed ? (
                            <Textarea
                              value={result.processedText}
                              onChange={(e) => handleProcessedTextChange(result.fileId, e.target.value)}
                              style={{ 
                                fontSize: `${fontSize}px`, 
                                fontFamily, 
                                textAlign: 'right',
                                lineHeight: '1.8'
                              }}
                              className="min-h-[200px] resize-none bg-transparent border-0 focus:ring-0 p-0"
                              dir="rtl"
                            />
                          ) : (
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
                          )}
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
