
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageSquare, Loader2 } from 'lucide-react';

interface TextProcessingOptionsProps {
  onProcess: (selectedOptions: string[]) => void;
  isProcessing: boolean;
}

export const TextProcessingOptions = ({ onProcess, isProcessing }: TextProcessingOptionsProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const options = [
    { id: 'correct', label: 'תיקון שגיאות והבאת מקורות' },
    { id: 'rewrite', label: 'עריכה מחדש' },
    { id: 'expand', label: 'הרחבת רעיונות' },
    { id: 'summarize', label: 'סיכום' }
  ];

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleProcess = () => {
    if (selectedOptions.length > 0) {
      onProcess(selectedOptions);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
      <h5 className="text-lg font-bold text-gray-800 mb-4">עיבוד עם ChatGPT:</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-3 space-x-reverse p-3 bg-white rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={() => toggleOption(option.id)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <Label htmlFor={option.id} className="text-sm font-medium text-gray-700">
              {option.label}
            </Label>
          </div>
        ))}
      </div>
      <Button
        size="lg"
        onClick={handleProcess}
        disabled={isProcessing || selectedOptions.length === 0}
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin ml-2" />
            מעבד...
          </>
        ) : (
          <>
            <MessageSquare className="w-5 h-5 ml-2" />
            עבד טקסט
          </>
        )}
      </Button>
    </div>
  );
};
