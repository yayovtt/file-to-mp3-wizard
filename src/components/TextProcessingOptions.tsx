
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Loader2, Settings, Bot, CheckCircle, XCircle } from 'lucide-react';
import { AIProvider, checkAPIStatus } from '@/services/textProcessingService';

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
  const [apiStatus, setApiStatus] = useState<{ [key in AIProvider]?: { isValid: boolean; error?: string; checked: boolean } }>({});
  const [isCheckingAPI, setIsCheckingAPI] = useState(false);

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (checked) {
      setSelectedOptions(prev => [...prev, optionId]);
    } else {
      setSelectedOptions(prev => prev.filter(id => id !== optionId));
    }
  };

  const handleCheckAPI = async () => {
    setIsCheckingAPI(true);
    try {
      const chatgptKey = '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';
      const claudeKey = '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';
      
      const [chatgptStatus, claudeStatus] = await Promise.allSettled([
        checkAPIStatus('chatgpt', chatgptKey),
        checkAPIStatus('claude', claudeKey)
      ]);

      setApiStatus({
        chatgpt: {
          isValid: chatgptStatus.status === 'fulfilled' ? chatgptStatus.value.isValid : false,
          error: chatgptStatus.status === 'fulfilled' ? chatgptStatus.value.error : 'שגיאה בבדיקה',
          checked: true
        },
        claude: {
          isValid: claudeStatus.status === 'fulfilled' ? claudeStatus.value.isValid : false,
          error: claudeStatus.status === 'fulfilled' ? claudeStatus.value.error : 'שגיאה בבדיקה',
          checked: true
        }
      });
    } catch (error) {
      console.error('Error checking API status:', error);
    } finally {
      setIsCheckingAPI(false);
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

      {/* API Status Check */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Bot className="w-5 h-5 text-blue-600" />
            <div>
              <Label className="text-sm font-semibold text-gray-800">
                סטטוס API
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                בדוק אם ה-APIs זמינים
              </p>
            </div>
          </div>
          <Button
            onClick={handleCheckAPI}
            disabled={isCheckingAPI}
            variant="outline"
            size="sm"
            className="px-4 py-2"
          >
            {isCheckingAPI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
                בודק...
              </>
            ) : (
              'בדוק API'
            )}
          </Button>
        </div>
        
        {Object.keys(apiStatus).length > 0 && (
          <div className="space-y-2">
            {Object.entries(apiStatus).map(([providerName, status]) => (
              <div key={providerName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">
                  {providerName === 'chatgpt' ? 'ChatGPT' : 'Claude'}
                </span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {status.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs ${status.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {status.isValid ? 'זמין' : 'לא זמין'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Provider Selection */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Bot className="w-5 h-5 text-blue-600" />
            <div>
              <Label htmlFor="ai-provider" className="text-sm font-semibold text-gray-800">
                מודל AI
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                בחר את מודל ה-AI לעיבוד הטקסט
              </p>
            </div>
          </div>
          <Select value={provider} onValueChange={(value: AIProvider) => setProvider(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chatgpt">ChatGPT</SelectItem>
              <SelectItem value="claude">Claude</SelectItem>
            </SelectContent>
          </Select>
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
            עבד טקסט עם {provider === 'chatgpt' ? 'ChatGPT' : 'Claude'} ({selectedOptions.length} אפשרויות - {separateMode ? 'נפרד' : 'משולב'})
          </>
        )}
      </Button>
    </Card>
  );
};
