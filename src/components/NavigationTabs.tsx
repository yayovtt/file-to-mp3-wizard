
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { ConversionStatus } from '@/components/ConversionStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TranscriptionSection } from '@/components/TranscriptionSection';
import { FileText, FileAudio, Sparkles } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface NavigationTabsProps {
  files: FileItem[];
  onFilesSelected: (files: File[]) => void;
  onConvertAll: () => void;
  onClearCompleted: () => void;
  onRemoveFile: (fileId: string) => void;
  isConverting: boolean;
}

export const NavigationTabs = ({ 
  files, 
  onFilesSelected, 
  onConvertAll, 
  onClearCompleted, 
  onRemoveFile,
  isConverting 
}: NavigationTabsProps) => {
  const completedFiles = files.filter(f => f.status === 'completed');
  const pendingFiles = files.filter(f => f.status === 'pending');

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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            {/* Upload Section */}
            <div className="space-y-8">
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
                          המר הכל
                        </Button>
                      )}
                      {completedFiles.length > 0 && (
                        <Button variant="outline" onClick={onClearCompleted} size="lg" className="px-6 py-3 text-lg rounded-xl">
                          נקה הושלמו
                        </Button>
                      )}
                    </div>
                  </div>
                  <ConversionStatus files={files} onRemoveFile={onRemoveFile} />
                </Card>
              )}

              {/* Supported Formats */}
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-lg rounded-xl">
                <h3 className="text-lg font-bold mb-3 text-gray-800">פורמטים נתמכים</h3>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">אודיו:</span> MP3, WAV, FLAC, AAC, OGG<br/>
                  <span className="font-medium">וידאו:</span> MP4, AVI, MOV, MKV, WebM
                </div>
              </Card>
            </div>

            {/* Info Section */}
            <div className="space-y-8">
              <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-lg rounded-xl">
                <h3 className="text-xl font-bold mb-4 text-gray-800">תהליך אוטומטי</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-3"></div>
                    <span>המרה ל-MP3 באיכות גבוהה</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full ml-3"></div>
                    <span>תמלול אוטומטי בעברית</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full ml-3"></div>
                    <span>הורדה מיידית של התוצאות</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcription">
          <TranscriptionSection files={files} onRemoveFile={onRemoveFile} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
