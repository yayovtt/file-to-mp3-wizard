
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { ConversionStatus } from '@/components/ConversionStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TranscriptionSection } from '@/components/TranscriptionSection';
import { DownloadSection } from '@/components/DownloadSection';
import { FileText, FileAudio, Download, Sparkles } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface NavigationTabsProps {
  files: FileItem[];
  onFilesSelected: (files: File[]) => void;
  onConvertAll: () => void;
  onClearCompleted: () => void;
  isConverting: boolean;
}

export const NavigationTabs = ({ 
  files, 
  onFilesSelected, 
  onConvertAll, 
  onClearCompleted, 
  isConverting 
}: NavigationTabsProps) => {
  const completedFiles = files.filter(f => f.status === 'completed');
  const pendingFiles = files.filter(f => f.status === 'pending');

  return (
    <Tabs defaultValue="conversion" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8 bg-white shadow-lg rounded-2xl p-2 h-16">
        <TabsTrigger 
          value="conversion" 
          className="flex items-center justify-center space-x-3 rtl:space-x-reverse text-lg font-semibold py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
        >
          <FileAudio className="w-6 h-6" />
          <span>המרת קבצים</span>
        </TabsTrigger>
        <TabsTrigger 
          value="transcription"
          className="flex items-center justify-center space-x-3 rtl:space-x-reverse text-lg font-semibold py-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
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
                  <div className="flex gap-3">
                    {pendingFiles.length > 0 && (
                      <Button
                        onClick={onConvertAll}
                        disabled={isConverting}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 text-lg rounded-xl shadow-lg"
                      >
                        <Sparkles className="w-5 h-5 ml-2" />
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
                <ConversionStatus files={files} />
              </Card>
            )}

            {/* Supported Formats */}
            <Card className="p-8 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-300 shadow-xl rounded-2xl">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">פורמטים נתמכים</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">אודיו:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['WAV', 'FLAC', 'AAC', 'OGG', 'M4A', 'WMA'].map(format => (
                      <Badge key={format} variant="secondary" className="justify-center py-2 text-sm font-medium">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">וידאו:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['MP4', 'AVI', 'MOV', 'MKV', 'WMV', 'WebM'].map(format => (
                      <Badge key={format} variant="secondary" className="justify-center bg-purple-100 text-purple-700 py-2 text-sm font-medium">
                        {format}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Download Section */}
          <div className="space-y-8">
            {completedFiles.length > 0 && (
              <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl mr-4">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">קבצים מוכנים להורדה</h3>
                    <p className="text-gray-600">הקבצים המומרים שלך מוכנים</p>
                  </div>
                  <Badge variant="secondary" className="mr-4 px-4 py-2 text-lg">
                    {completedFiles.length}
                  </Badge>
                </div>
                <DownloadSection files={completedFiles} />
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="transcription">
        <TranscriptionSection files={files} />
      </TabsContent>
    </Tabs>
  );
};
