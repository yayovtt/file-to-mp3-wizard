
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileItem } from '@/pages/Index';
import { transcribeAudio } from '@/services/transcriptionService';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionResult } from '@/components/TranscriptionResult';
import { BatchTranscriptionModal } from '@/components/BatchTranscriptionModal';
import { 
  FileText, 
  Key, 
  Play, 
  Loader2, 
  Download,
  Edit2,
  Save,
  X,
  Users,
  FileAudio
} from 'lucide-react';

interface TranscriptionSectionProps {
  files: FileItem[];
}

export const TranscriptionSection = ({ files }: TranscriptionSectionProps) => {
  const [apiKey, setApiKey] = useState('');
  const [transcribingFileId, setTranscribingFileId] = useState<string | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptions, setTranscriptions] = useState<Record<string, string>>({});
  const [editingTranscription, setEditingTranscription] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const { toast } = useToast();

  async function handleTranscribe(file: FileItem) {
    if (!apiKey) {
      toast({
        title: "שגיאה",
        description: "נדרש מפתח API של Groq",
        variant: "destructive",
      });
      return;
    }

    setTranscribingFileId(file.id);
    setTranscriptionProgress(0);

    try {
      console.log(`Starting transcription for file: ${file.file.name}`);
      
      const transcription = await transcribeAudio(
        file.file,
        apiKey,
        (progress) => {
          setTranscriptionProgress(progress);
        }
      );

      setTranscriptions(prev => ({
        ...prev,
        [file.id]: transcription
      }));

      toast({
        title: "הצלחה!",
        description: "התמלול הושלם בהצלחה",
      });

    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "שגיאה בתמלול",
        description: error.message || "אירעה שגיאה במהלך התמלול",
        variant: "destructive",
      });
    } finally {
      setTranscribingFileId(null);
      setTranscriptionProgress(0);
    }
  }

  function handleEdit(fileId: string, newText: string) {
    setTranscriptions(prev => ({
      ...prev,
      [fileId]: newText
    }));
  }

  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <div className="space-y-8" dir="rtl">
      {/* API Key Section */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-xl rounded-2xl">
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl ml-4">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">הגדרת מפתח API</h3>
            <p className="text-gray-600">הכנס מפתח Groq API לתמלול הקבצים</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="הכנס מפתח Groq API"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="text-lg py-3"
          />
          <p className="text-sm text-gray-500">
            ניתן לקבל מפתח חינמי מ-{' '}
            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline font-medium"
            >
              Groq Console
            </a>
          </p>
        </div>
      </Card>

      {/* Batch Transcription Section */}
      {completedFiles.length > 1 && (
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-xl ml-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">תמלול מרוכז</h3>
                <p className="text-gray-600">תמלל מספר קבצים יחד בפעולה אחת</p>
              </div>
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-lg">
              {completedFiles.length} קבצים זמינים
            </Badge>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setShowBatchModal(true)}
              disabled={!apiKey || completedFiles.length === 0 || transcribingFileId !== null}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 text-lg rounded-xl shadow-lg"
            >
              <FileAudio className="w-5 h-5 mr-2" />
              תמלל {completedFiles.length} קבצים יחד
            </Button>
          </div>
        </Card>
      )}

      {/* Individual Files Section */}
      {completedFiles.length > 0 && (
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl ml-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">תמלול קבצים</h3>
              <p className="text-gray-600">בחר קבצים לתמלול</p>
            </div>
            <Badge variant="secondary" className="ml-4 px-4 py-2 text-lg">
              {completedFiles.length}
            </Badge>
          </div>

          <div className="space-y-6">
            {completedFiles.map((file) => (
              <div key={file.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-800 mb-1">{file.file.name}</h4>
                    <p className="text-gray-500">
                      גודל: {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleTranscribe(file)}
                      disabled={!apiKey || transcribingFileId === file.id}
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 px-6 py-2"
                    >
                      {transcribingFileId === file.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          מתמלל...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          תמלל עכשיו
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {transcribingFileId === file.id && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>התקדמות התמלול</span>
                      <span>{transcriptionProgress}%</span>
                    </div>
                    <Progress value={transcriptionProgress} className="h-3" />
                  </div>
                )}

                {transcriptions[file.id] && (
                  <div className="mt-4">
                    <TranscriptionResult
                      transcription={transcriptions[file.id]}
                      fileName={file.file.name}
                      onEdit={(newText) => handleEdit(file.id, newText)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {completedFiles.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200 shadow-xl rounded-2xl">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">אין קבצים מוכנים לתמלול</h3>
          <p className="text-gray-500">
            קודם המר קבצי אודיו או וידאו ואז תוכל לתמלל אותם
          </p>
        </Card>
      )}

      {/* Batch Transcription Modal */}
      <BatchTranscriptionModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        files={completedFiles}
        apiKey={apiKey}
        onTranscriptionComplete={(transcription) => {
          // Create a combined transcription entry
          const combinedId = 'batch_' + Date.now();
          setTranscriptions(prev => ({
            ...prev,
            [combinedId]: transcription
          }));
        }}
      />
    </div>
  );
};
