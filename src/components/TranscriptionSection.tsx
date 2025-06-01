
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileText, MessageSquare, Loader2, Download } from 'lucide-react';
import { FileItem } from '@/pages/Index';
import { transcribeAudio } from '@/services/transcriptionService';
import { summarizeText } from '@/services/summarizationService';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionSectionProps {
  files: FileItem[];
}

interface TranscriptionResult {
  fileId: string;
  fileName: string;
  transcription: string;
  summary?: string;
  isTranscribing: boolean;
  isSummarizing: boolean;
}

export const TranscriptionSection = ({ files }: TranscriptionSectionProps) => {
  const [groqApiKey, setGroqApiKey] = useState('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');
  const [chatgptApiKey, setChatgptApiKey] = useState('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');
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const { toast } = useToast();

  const handleTranscribe = async (file: FileItem) => {
    if (!groqApiKey.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין מפתח API של Groq',
        variant: 'destructive',
      });
      return;
    }

    const existingIndex = transcriptions.findIndex(t => t.fileId === file.id);
    
    if (existingIndex >= 0) {
      setTranscriptions(prev => prev.map((t, i) => 
        i === existingIndex ? { ...t, isTranscribing: true } : t
      ));
    } else {
      setTranscriptions(prev => [...prev, {
        fileId: file.id,
        fileName: file.file.name,
        transcription: '',
        isTranscribing: true,
        isSummarizing: false,
      }]);
    }

    try {
      const transcription = await transcribeAudio(file.file, groqApiKey);
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, transcription, isTranscribing: false }
          : t
      ));

      toast({
        title: 'תמלול הושלם',
        description: `התמלול של ${file.file.name} הושלם בהצלחה`,
      });
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === file.id 
          ? { ...t, isTranscribing: false }
          : t
      ));
      
      toast({
        title: 'שגיאה בתמלול',
        description: 'אירעה שגיאה במהלך התמלול. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const handleSummarize = async (transcriptionResult: TranscriptionResult) => {
    if (!chatgptApiKey.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין מפתח API של ChatGPT',
        variant: 'destructive',
      });
      return;
    }

    if (!transcriptionResult.transcription.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אין טקסט לסיכום. בצע תמלול תחילה.',
        variant: 'destructive',
      });
      return;
    }

    setTranscriptions(prev => prev.map(t => 
      t.fileId === transcriptionResult.fileId 
        ? { ...t, isSummarizing: true }
        : t
    ));

    try {
      const summary = await summarizeText(transcriptionResult.transcription, chatgptApiKey);
      
      setTranscriptions(prev => prev.map(t => 
        t.fileId === transcriptionResult.fileId 
          ? { ...t, summary, isSummarizing: false }
          : t
      ));

      toast({
        title: 'סיכום הושלם',
        description: `הסיכום של ${transcriptionResult.fileName} הושלם בהצלחה`,
      });
    } catch (error) {
      console.error('Summarization error:', error);
      setTranscriptions(prev => prev.map(t => 
        t.fileId === transcriptionResult.fileId 
          ? { ...t, isSummarizing: false }
          : t
      ));
      
      toast({
        title: 'שגיאה בסיכום',
        description: 'אירעה שגיאה במהלך הסיכום. נסה שוב.',
        variant: 'destructive',
      });
    }
  };

  const downloadTranscription = (transcriptionResult: TranscriptionResult) => {
    const content = `תמלול: ${transcriptionResult.fileName}\n\n${transcriptionResult.transcription}${
      transcriptionResult.summary ? `\n\nסיכום:\n${transcriptionResult.summary}` : ''
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

  const completedFiles = files.filter(f => f.status === 'completed');

  return (
    <div className="space-y-6">
      {/* API Keys Section */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">מפתחות API</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="groq-api" className="block text-sm font-medium text-gray-700 mb-2">
              Groq API Key (לתמלול)
            </label>
            <Input
              id="groq-api"
              type="password"
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
              placeholder="הזן מפתח API של Groq"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="chatgpt-api" className="block text-sm font-medium text-gray-700 mb-2">
              ChatGPT API Key (לסיכום)
            </label>
            <Input
              id="chatgpt-api"
              type="password"
              value={chatgptApiKey}
              onChange={(e) => setChatgptApiKey(e.target.value)}
              placeholder="הזן מפתח API של ChatGPT"
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Files Ready for Transcription */}
      {completedFiles.length > 0 && (
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 mr-2 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">קבצים מוכנים לתמלול</h3>
            <Badge variant="secondary" className="mr-2">
              {completedFiles.length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {completedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      מוכן לתמלול
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleTranscribe(file)}
                  disabled={transcriptions.find(t => t.fileId === file.id)?.isTranscribing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {transcriptions.find(t => t.fileId === file.id)?.isTranscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  תמלל
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Transcription Results */}
      {transcriptions.length > 0 && (
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">תוצאות תמלול</h3>
          </div>
          
          <div className="space-y-6">
            {transcriptions.map((result) => (
              <div key={result.fileId} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{result.fileName}</h4>
                  <div className="flex gap-2">
                    {result.transcription && !result.summary && (
                      <Button
                        size="sm"
                        onClick={() => handleSummarize(result)}
                        disabled={result.isSummarizing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {result.isSummarizing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-1" />
                        )}
                        סכם
                      </Button>
                    )}
                    {result.transcription && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadTranscription(result)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        הורד
                      </Button>
                    )}
                  </div>
                </div>
                
                {result.isTranscribing && (
                  <div className="flex items-center text-blue-600 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    מתמלל...
                  </div>
                )}
                
                {result.transcription && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        תמלול:
                      </label>
                      <Textarea
                        value={result.transcription}
                        readOnly
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                    
                    {result.isSummarizing && (
                      <div className="flex items-center text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        מסכם...
                      </div>
                    )}
                    
                    {result.summary && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          סיכום:
                        </label>
                        <Textarea
                          value={result.summary}
                          readOnly
                          className="min-h-[80px] resize-none bg-green-50 border-green-200"
                        />
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
