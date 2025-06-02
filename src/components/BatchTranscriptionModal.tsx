
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileItem } from '@/pages/Index';
import { transcribeAudio } from '@/services/transcriptionService';
import { X, FileAudio, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BatchTranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  apiKey: string;
  onTranscriptionComplete: (transcription: string) => void;
}

export const BatchTranscriptionModal = ({
  isOpen,
  onClose,
  files,
  apiKey,
  onTranscriptionComplete
}: BatchTranscriptionModalProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleBatchTranscribe = async () => {
    if (!apiKey) {
      toast({
        title: "שגיאה",
        description: "נדרש מפתח API של Groq",
        variant: "destructive",
      });
      return;
    }

    setIsTranscribing(true);
    setTranscriptions([]);
    const allTranscriptions: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        setCurrentFileProgress(0);
        
        console.log(`Starting transcription for file ${i + 1}/${files.length}: ${files[i].file.name}`);
        
        const transcription = await transcribeAudio(
          files[i].file,
          apiKey,
          (progress) => {
            setCurrentFileProgress(progress);
            const overallProg = ((i / files.length) * 100) + ((progress / files.length));
            setOverallProgress(Math.min(overallProg, 100));
          }
        );
        
        allTranscriptions.push(`=== ${files[i].file.name} ===\n${transcription}`);
        setTranscriptions([...allTranscriptions]);
      }

      const combinedTranscription = allTranscriptions.join('\n\n');
      onTranscriptionComplete(combinedTranscription);
      
      toast({
        title: "הצלחה!",
        description: `תמלול של ${files.length} קבצים הושלם בהצלחה`,
      });
      
      onClose();
    } catch (error) {
      console.error('Batch transcription error:', error);
      toast({
        title: "שגיאה בתמלול",
        description: error.message || "אירעה שגיאה במהלך התמלול",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
      setOverallProgress(0);
      setCurrentFileProgress(0);
      setCurrentFileIndex(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            תמלול מרוכז - {files.length} קבצים
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Files List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">קבצים לתמלול:</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isTranscribing && index === currentFileIndex
                      ? 'bg-blue-50 border-blue-300'
                      : isTranscribing && index < currentFileIndex
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <FileAudio className="w-5 h-5 text-blue-600" />
                    <span className="font-medium truncate max-w-xs">{file.file.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(file.file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isTranscribing && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>התקדמות כללית</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>קובץ נוכחי: {files[currentFileIndex]?.file.name}</span>
                  <span>{Math.round(currentFileProgress)}%</span>
                </div>
                <Progress value={currentFileProgress} className="h-2" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isTranscribing}
            >
              <X className="w-4 h-4 mr-2" />
              ביטול
            </Button>
            <Button
              onClick={handleBatchTranscribe}
              disabled={isTranscribing || files.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="w-4 h-4 mr-2" />
              {isTranscribing ? 'מתמלל...' : 'התחל תמלול מרוכז'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
