
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { ConversionStatus } from '@/components/ConversionStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TranscriptionSection } from '@/components/TranscriptionSection';
import { YouTubeDownload } from '@/components/YouTubeDownload';
import { FileText, FileAudio, Sparkles, Settings } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface NavigationTabsProps {
  files: FileItem[];
  onFilesSelected: (files: File[]) => void;
  onConvertAll: () => void;
  onClearCompleted: () => void;
  onDeleteFile: (fileId: string) => void;
  isConverting: boolean;
  outputFormat: 'mp3' | 'webm';
  onOutputFormatChange: (format: 'mp3' | 'webm') => void;
  autoProcess: boolean;
  onAutoProcessChange: (enabled: boolean) => void;
}

export const NavigationTabs = ({ 
  files, 
  onFilesSelected, 
  onConvertAll, 
  onClearCompleted, 
  onDeleteFile,
  isConverting,
  outputFormat,
  onOutputFormatChange,
  autoProcess,
  onAutoProcessChange
}: NavigationTabsProps) => {
  const completedFiles = files.filter(f => f.status === 'completed');
  const pendingFiles = files.filter(f => f.status === 'pending');

  const handleYouTubeFileDownloaded = (file: File, subtitles?: string) => {
    console.log('YouTube file downloaded:', file.name);
    if (subtitles) {
      console.log('Subtitles available:', subtitles);
    }
    onFilesSelected([file]);
  };

  return (
    <div dir="rtl">
      <Tabs defaultValue="conversion" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow-lg rounded-2xl p-2 h-16">
          <TabsTrigger 
            value="conversion" 
            className="flex items-center justify-center space-x-3 space-x-reverse text-lg font-semibold py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            <FileAudio className="w-6 h-6" />
            <span>המרת קבצים</span>
          </TabsTrigger>
          <TabsTrigger 
            value="transcription"
            className="flex items-center justify-center space-x-3 space-x-reverse text-lg font-semibold py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
          >
            <FileText className="w-6 h-6" />
            <span>תמלול</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversion" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-1 gap-12">
            {/* Upload Section */}
            <div className="space-y-8">
              {/* Format and Auto-Processing Settings */}
              <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-3 rounded-xl ml-4">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">הגדרות המרה</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Output Format Selection */}
                  <div>
                    <Label className="text-base font-medium text-gray-700 mb-3 block">פורמט יעד:</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={outputFormat === 'mp3' ? 'default' : 'outline'}
                        onClick={() => onOutputFormatChange('mp3')}
                        className="flex-1"
                      >
                        MP3
                      </Button>
                      <Button
                        variant={outputFormat === 'webm' ? 'default' : 'outline'}
                        onClick={() => onOutputFormatChange('webm')}
                        className="flex-1"
                      >
                        WebM
                      </Button>
                    </div>
                  </div>

                  {/* Auto-Processing Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-process" className="text-base font-medium text-gray-700">
                        עיבוד אוטומטי
                      </Label>
                      <p className="text-sm text-gray-600">
                        התחל תמלול ועיבוד טקסט אוטומטית לאחר המרה
                      </p>
                    </div>
                    <Switch
                      id="auto-process"
                      checked={autoProcess}
                      onCheckedChange={onAutoProcessChange}
                    />
                  </div>
                </div>
              </Card>

              {/* YouTube Download */}
              <YouTubeDownload 
                onFileDownloaded={handleYouTubeFileDownloaded}
                outputFormat={outputFormat}
              />

              <Card className="p-8 border-2 border-dashed border-blue-300 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
                <FileUpload onFilesSelected={onFilesSelected} />
              </Card>

              {files.length > 0 && (
                <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">רשימת קבצים</h3>
                    <div className="flex gap-3 space-x-reverse">
                      {pendingFiles.length > 0 && (
                        <Button
                          onClick={onConvertAll}
                          disabled={isConverting}
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl shadow-lg"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          המר הכל ל-{outputFormat.toUpperCase()}
                        </Button>
                      )}
                      {completedFiles.length > 0 && (
                        <Button variant="outline" onClick={onClearCompleted} size="lg" className="px-6 py-3 text-lg rounded-xl">
                          נקה הושלמו
                        </Button>
                      )}
                    </div>
                  </div>
                  <ConversionStatus files={files} onDeleteFile={onDeleteFile} />
                </Card>
              )}

              {/* Supported Formats */}
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-lg rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-gray-800">פורמטים נתמכים</h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">אודיו:</span> MP3, WAV, FLAC, AAC, OGG<br/>
                  <span className="font-medium">וידאו:</span> MP4, AVI, MOV, MKV, WebM<br/>
                  <span className="font-medium">יוטיוב:</span> כל קישור יוטיוב רגיל או Shorts<br/>
                  <span className="font-medium">יעד:</span> MP3, WebM (16 kbps)
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcription">
          <TranscriptionSection files={files} autoProcessEnabled={autoProcess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
