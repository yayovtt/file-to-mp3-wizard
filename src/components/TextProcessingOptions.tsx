
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MessageSquare, Loader2 } from 'lucide-react';

interface ProcessingOption {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

interface TextProcessingOptionsProps {
  onProcess: (prompts: string[], selectedOptions: string[]) => void;
  isProcessing: boolean;
  hasTranscription: boolean;
}

const PROCESSING_OPTIONS: ProcessingOption[] = [
  {
    id: 'fix-errors',
    label: 'תיקון שגיאות כתיב ועריכה לשונית',
    description: 'תיקון שגיאות דקדוק, כתיב ופיסוק + עריכה לשונית קלה לשיפור הזרימה והבהירות',
    prompt: 'תקן שגיאות כתיב, דקדוק ופיסוק בטקסט הבא ועשה עריכה לשונית קלה לשיפור הזרימה והבהירות, תוך שמירה על הסגנון והכוונה המקוריים. החזר את הטקסט המתוקן והמעורך:'
  },
  {
    id: 'add-sources',
    label: 'הוספת מקורות',
    description: 'הוספת מקורות ורפרנסים רלוונטיים',
    prompt: 'הוסף מקורות ורפרנסים רלוונטיים לטקסט הבא. כלול קישורים ומקורות מהימנים:'
  },
  {
    id: 'edit',
    label: 'עריכה מחדש',
    description: 'עריכה ושיפור הסגנון והזרימה',
    prompt: 'ערוך את הטקסט הבא לשיפור הסגנון, הבהירות והזרימה. שמור על התוכן המקורי:'
  },
  {
    id: 'expand',
    label: 'הרחבת רעיון',
    description: 'הרחבה ופיתוח של הרעיונות המוצגים',
    prompt: 'הרחב ופתח את הרעיונות המוצגים בטקסט הבא. הוסף פרטים, דוגמאות והסברים:'
  },
  {
    id: 'summarize',
    label: 'סיכום',
    description: 'יצירת סיכום קצר וחד של התוכן',
    prompt: 'סכם את הטקסט הבא בצורה קצרה וברורה, תוך שמירה על הנקודות המרכזיות:'
  }
];

export const TextProcessingOptions = ({ onProcess, isProcessing, hasTranscription }: TextProcessingOptionsProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  };

  const handleProcess = () => {
    const selectedPrompts = PROCESSING_OPTIONS
      .filter(option => selectedOptions.includes(option.id))
      .map(option => option.prompt);
    
    const selectedLabels = PROCESSING_OPTIONS
      .filter(option => selectedOptions.includes(option.id))
      .map(option => option.label);

    onProcess(selectedPrompts, selectedLabels);
  };

  if (!hasTranscription) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl ml-3">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-800">עיבוד טקסט חכם</h4>
          <p className="text-sm text-gray-600">בחר אפשרויות לעיבוד הטקסט עם ChatGPT</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {PROCESSING_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-start space-x-3 space-x-reverse p-4 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
            <Checkbox
              id={option.id}
              checked={selectedOptions.includes(option.id)}
              onCheckedChange={(checked) => handleOptionChange(option.id, checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor={option.id} className="text-sm font-semibold text-gray-800 cursor-pointer">
                {option.label}
              </Label>
              <p className="text-xs text-gray-600 mt-1">{option.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleProcess}
        disabled={selectedOptions.length === 0 || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            מעבד טקסט...
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5 ml-2" />
            עבד טקסט ({selectedOptions.length} אפשרויות)
          </>
        )}
      </Button>
    </Card>
  );
};
