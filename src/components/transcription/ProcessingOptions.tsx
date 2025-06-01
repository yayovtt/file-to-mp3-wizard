
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface ProcessingOptionsProps {
  fileId: string;
  processingOptions: {[key: string]: string[]};
  isProcessing: boolean;
  onUpdateOptions: (fileId: string, option: string, checked: boolean) => void;
  onProcessText: (fileId: string, options: string[]) => void;
}

export const ProcessingOptions = ({ 
  fileId, 
  processingOptions, 
  isProcessing, 
  onUpdateOptions, 
  onProcessText 
}: ProcessingOptionsProps) => {
  const options = [
    { id: 'correct', label: 'תיקון שגיאות והבאת מקורות' },
    { id: 'rewrite', label: 'עריכה מחדש' },
    { id: 'expand', label: 'הרחבת רעיונות' },
    { id: 'summarize', label: 'סיכום' }
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
      <h5 className="text-lg font-bold text-gray-800 mb-4">אפשרויות עיבוד עם ChatGPT:</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-3 space-x-reverse p-3 bg-white rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id={`${fileId}-${option.id}`}
              checked={processingOptions[fileId]?.includes(option.id) || false}
              onChange={(e) => onUpdateOptions(fileId, option.id, e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <Label htmlFor={`${fileId}-${option.id}`} className="text-sm font-medium text-gray-700">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      <Button
        size="lg"
        onClick={() => onProcessText(fileId, processingOptions[fileId] || [])}
        disabled={isProcessing || !processingOptions[fileId]?.length}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl"
      >
        <MessageSquare className="w-5 h-5 ml-2" />
        עבד טקסט
      </Button>
    </div>
  );
};
