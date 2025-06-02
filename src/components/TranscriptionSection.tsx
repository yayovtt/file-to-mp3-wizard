import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileItem } from '@/pages/Index';

interface TranscriptionSectionProps {
  files: FileItem[];
  autoProcessEnabled: boolean;
}

export const TranscriptionSection = ({ files, autoProcessEnabled }: TranscriptionSectionProps) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [transcriptionResults, setTranscriptionResults] = useState<Record<string, any>>({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [processingResults, setProcessingResults] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const completedFiles = files.filter(f => f.status === 'completed');

  const handleFileSelection = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const selectAllFiles = () => {
    setSelectedFiles(completedFiles.map(f => f.id));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  const getFileForTranscription = async (file: FileItem): Promise<File> => {
    if (file.convertedUrl && file.convertedSize) {
      console.log(`Using converted file for transcription. Original size: ${file.file.size} bytes, Converted size: ${file.convertedSize} bytes`);
      
      try {
        const response = await fetch(file.convertedUrl);
        const blob = await response.blob();
        console.log(`Converted file ready for transcription: ${blob.size} bytes`);
        return new File([blob], file.file.name, { type: blob.type });
      } catch (error) {
        console.error('Error fetching converted file:', error);
        console.log(`Falling back to original file: ${file.file.size} bytes`);
        return file.file;
      }
    }
    
    console.log(`Using original file for transcription: ${file.file.size} bytes`);
    return file.file;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const transcribeFile = async (file: FileItem) => {
    const fileForTranscription = await getFileForTranscription(file);
    
    console.log(`Starting transcription for file: ${file.file.name}`);
    console.log(`Original file size: ${file.file.size} bytes`);
    console.log(`File for transcription size: ${fileForTranscription.size} bytes`);
    console.log(`Will be chunked: ${fileForTranscription.size > 25 * 1024 * 1024}`);

    try {
      const { transcribeAudioChunked } = await import('@/services/transcriptionService');
      
      const result = await transcribeAudioChunked(
        fileForTranscription,
        apiKey,
        (progress) => {
          setTranscriptionResults(prev => ({
            ...prev,
            [file.id]: { 
              ...(prev[file.id] || {}), 
              progress 
            }
          }));
        }
      );

      setTranscriptionResults(prev => ({
        ...prev,
        [file.id]: {
          ...result,
          progress: 100,
          status: 'completed',
          fileName: file.file.name
        }
      }));

      if (autoProcessEnabled && result.fullText) {
        await handleProcessText(file.id, result.fullText);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionResults(prev => ({
        ...prev,
        [file.id]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          fileName: file.file.name
        }
      }));
    }
  };

  const handleTranscribeSelected = async () => {
    if (!apiKey.trim()) {
      alert('אנא הכנס API Key');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('אנא בחר לפחות קובץ אחד לתמלול');
      return;
    }

    setIsTranscribing(true);
    
    const filesToTranscribe = completedFiles.filter(f => selectedFiles.includes(f.id));
    
    for (const file of filesToTranscribe) {
      await transcribeFile(file);
    }
    
    setIsTranscribing(false);
  };

  const handleProcessText = async (fileId: string, text: string) => {
    try {
      setProcessingResults(prev => ({
        ...prev,
        [fileId]: { status: 'processing', progress: 0 }
      }));

      const { processText } = await import('@/services/textProcessingService');
      
      const result = await processText(text, 'claude', (progress) => {
        setProcessingResults(prev => ({
          ...prev,
          [fileId]: { 
            ...(prev[fileId] || {}), 
            progress 
          }
        }));
      });

      setProcessingResults(prev => ({
        ...prev,
        [fileId]: {
          ...result,
          status: 'completed',
          progress: 100
        }
      }));
    } catch (error) {
      console.error('Text processing error:', error);
      setProcessingResults(prev => ({
        ...prev,
        [fileId]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }
  };

  return (
    <div className="space-y-8">
      <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">תמלול אודיו לטקסט</h2>
          <p className="text-gray-600">המר דיבור לטקסט באמצעות בינה מלאכותית מתקדמת</p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="api-key" className="text-base font-medium text-gray-700 mb-2 block">
              Groq API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="הכנס את ה-API Key שלך"
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              קבל API Key חינמי מ-{' '}
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Groq Console
              </a>
            </p>
          </div>

          {completedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium text-gray-700">
                  קבצים מוכנים לתמלול ({completedFiles.length})
                </Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllFiles}
                    disabled={selectedFiles.length === completedFiles.length}
                  >
                    בחר הכל
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSelection}
                    disabled={selectedFiles.length === 0}
                  >
                    נקה בחירה
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {completedFiles.map((file) => (
                  <div key={file.id} className="flex items-center space-x-3 rtl:space-x-reverse p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id={`file-${file.id}`}
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={(checked) => handleFileSelection(file.id, !!checked)}
                    />
                    <Label htmlFor={`file-${file.id}`} className="flex-1 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.convertedSize || file.file.size)} • {(file.outputFormat || 'mp3').toUpperCase()}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleTranscribeSelected}
                  disabled={isTranscribing || selectedFiles.length === 0 || !apiKey.trim()}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 text-lg rounded-xl shadow-lg"
                >
                  {isTranscribing ? 'מתמלל...' : `תמלל ${selectedFiles.length} קבצים נבחרים`}
                </Button>
              </div>
            </div>
          )}

          {completedFiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              אין קבצים מוכנים לתמלול. אנא המר קבצים קודם.
            </div>
          )}
        </div>
      </Card>

      {/* Transcription Results */}
      {Object.keys(transcriptionResults).length > 0 && (
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">תוצאות תמלול</h3>
          
          <div className="space-y-6">
            {Object.entries(transcriptionResults).map(([fileId, result]: [string, any]) => (
              <div key={fileId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">{result.fileName}</h4>
                  <Badge variant={result.status === 'completed' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                    {result.status === 'completed' ? 'הושלם' : result.status === 'error' ? 'שגיאה' : 'מעבד'}
                  </Badge>
                </div>

                {result.progress !== undefined && result.progress < 100 && (
                  <div className="mb-4">
                    <Progress value={result.progress} className="h-2" />
                    <p className="text-xs text-center text-gray-500 mt-1">
                      {result.progress}% הושלם
                    </p>
                  </div>
                )}

                {result.status === 'error' && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    שגיאה: {result.error}
                  </div>
                )}

                {result.fullText && (
                  <Tabs defaultValue="full-text" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="full-text">טקסט מלא</TabsTrigger>
                      <TabsTrigger value="chunks">חלקים</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="full-text" className="mt-4">
                      <Textarea
                        value={result.fullText}
                        readOnly
                        className="min-h-[200px] w-full"
                        dir="rtl"
                      />
                    </TabsContent>
                    
                    <TabsContent value="chunks" className="mt-4">
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {result.chunks && result.chunks.map((chunk: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <Badge variant="outline">חלק {chunk.chunkIndex + 1}</Badge>
                              <span className="text-xs text-gray-500">
                                {Math.floor(chunk.startTime / 60)}:{(chunk.startTime % 60).toFixed(0).padStart(2, '0')} - {Math.floor(chunk.endTime / 60)}:{(chunk.endTime % 60).toFixed(0).padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700" dir="rtl">{chunk.text}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Text Processing Results */}
                {processingResults[fileId] && (
                  <div className="mt-6 border-t pt-6">
                    <h5 className="font-medium text-gray-900 mb-4">עיבוד טקסט</h5>
                    
                    {processingResults[fileId].progress !== undefined && processingResults[fileId].progress < 100 && (
                      <div className="mb-4">
                        <Progress value={processingResults[fileId].progress} className="h-2" />
                        <p className="text-xs text-center text-gray-500 mt-1">
                          מעבד טקסט... {processingResults[fileId].progress}%
                        </p>
                      </div>
                    )}

                    {processingResults[fileId].status === 'error' && (
                      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                        שגיאה בעיבוד טקסט: {processingResults[fileId].error}
                      </div>
                    )}

                    {processingResults[fileId].summary && (
                      <div className="space-y-4">
                        <div>
                          <Label className="font-medium text-gray-700">סיכום:</Label>
                          <Textarea
                            value={processingResults[fileId].summary}
                            readOnly
                            className="mt-2 min-h-[100px]"
                            dir="rtl"
                          />
                        </div>

                        {processingResults[fileId].keyPoints && (
                          <div>
                            <Label className="font-medium text-gray-700">נקודות מפתח:</Label>
                            <div className="mt-2 space-y-2">
                              {processingResults[fileId].keyPoints.map((point: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2 rtl:space-x-reverse">
                                  <span className="text-blue-600 font-bold">•</span>
                                  <span className="text-gray-700" dir="rtl">{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
