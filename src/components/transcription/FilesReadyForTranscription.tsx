
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';
import { FileItem } from '@/pages/Index';

interface FilesReadyForTranscriptionProps {
  files: FileItem[];
  transcriptions: Array<{
    fileId: string;
    isTranscribing: boolean;
  }>;
  onTranscribe: (file: FileItem) => void;
}

export const FilesReadyForTranscription = ({ 
  files, 
  transcriptions, 
  onTranscribe 
}: FilesReadyForTranscriptionProps) => {
  const completedFiles = files.filter(f => f.status === 'completed');

  if (completedFiles.length === 0) return null;

  return (
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
        {completedFiles.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-3 rounded-xl">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {file.file.name}
                </p>
                <p className="text-sm text-gray-600">
                  מוכן לתמלול • {(file.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            <Button
              size="lg"
              onClick={() => onTranscribe(file)}
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
        ))}
      </div>
    </Card>
  );
};
