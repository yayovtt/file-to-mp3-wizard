
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Loader2, Settings, Brain } from 'lucide-react';
import { AIProvider } from '@/services/textProcessingService';

interface ProcessingOption {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

interface TextProcessingOptionsProps {
  onProcess: (prompts: string[], selectedOptions: string[], separateMode: boolean, provider: AIProvider) => void;
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
    id: 'punctuation-edit',
    label: 'פיסוק ועריכה',
    description: 'הוספת פיסוק נכון ועריכה בסיסית של הטקסט',
    prompt: 'הוסף פיסוק נכון ועשה עריכה בסיסית לטקסט הבא. שמור על התוכן המקורי והוסף סימני פיסוק, פסקות והחלקות קלות:'
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
  const [separateMode, setSeparateMode] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('chatgpt');

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

    onProcess(selectedPrompts, selectedLabels, separateMode, provider);
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
          <p className="text-sm text-gray-600">בחר אפשרויות לעיבוד הטקסט עם AI</p>
        </div>
      </div>

      {/* AI Provider Selection */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-blue-600 ml-2" />
          <Label className="text-sm font-semibold text-gray-800">בחר ספק AI:</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div 
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
              provider === 'chatgpt' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setProvider('chatgpt')}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-3 h-3 rounded-full ${provider === 'chatgpt' ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-800">ChatGPT</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">מהיר וחכם</p>
          </div>
          
          <div 
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
              provider === 'claude' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => setProvider('claude')}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className={`w-3 h-3 rounded-full ${provider === 'claude' ? 'bg-purple-500' : 'bg-gray-300'}`} />
              <span className="font-medium text-gray-800">Claude</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">מדויק ומפורט</p>
          </div>
        </div>
      </div>

      {/* Processing Mode Toggle */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <Label htmlFor="processing-mode" className="text-sm font-semibold text-gray-800">
                מצב עיבוד נפרד
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                {separateMode 
                  ? 'כל אפשרות תעובד בנפרד עם כותרת משלה' 
                  : 'כל האפשרויות יעובדו יחד לטקסט אחד משולב'
                }
              </p>
            </div>
          </div>
          <Switch
            id="processing-mode"
            checked={separateMode}
            onCheckedChange={setSeparateMode}
            className="data-[state=checked]:bg-blue-600"
          />
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
        className={`w-full ${
          provider === 'chatgpt' 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
        } text-white py-3 rounded-lg font-semibold`}
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
            עבד טקסט עם {provider === 'chatgpt' ? 'ChatGPT' : 'Claude'} ({selectedOptions.length} אפשרויות - {separateMode ? 'נפרד' : 'משולב'})
          </>
        )}
      </Button>
    </Card>
  );
};
