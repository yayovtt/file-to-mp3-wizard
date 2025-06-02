
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TranscriptionResultProps {
  transcription: string;
  fileName: string;
  onEdit?: (newText: string) => void;
}

export const TranscriptionResult = ({ 
  transcription, 
  fileName, 
  onEdit 
}: TranscriptionResultProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(transcription);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      toast({
        title: "הועתק!",
        description: "הטקסט הועתק ללוח",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק את הטקסט",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([transcription], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_transcription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "הורד!",
      description: "הקובץ נשמר בהצלחה",
    });
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(editValue);
    }
    setIsEditing(false);
    toast({
      title: "נשמר!",
      description: "השינויים נשמרו בהצלחה",
    });
  };

  const handleCancel = () => {
    setEditValue(transcription);
    setIsEditing(false);
  };

  return (
    <Card className="p-6 bg-green-50 border-green-200">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold text-green-800">תוצאת התמלול</h4>
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              עריכה
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            העתק
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="text-purple-600 border-purple-300 hover:bg-purple-50"
          >
            <Download className="w-4 h-4 mr-2" />
            הורד
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-32 bg-yellow-50 border-yellow-300"
            placeholder="ערוך את הטקסט כאן..."
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              שמור
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              ביטול
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg border border-green-200 max-h-64 overflow-y-auto">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {transcription}
          </p>
        </div>
      )}
    </Card>
  );
};
