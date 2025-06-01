
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Loader2 } from 'lucide-react';
import { ProcessingOptions } from './ProcessingOptions';

interface TranscriptionResultProps {
  result: {
    fileId: string;
    fileName: string;
    transcription: string;
    processedText?: string;
    processingType?: string;
    isTranscribing: boolean;
    isProcessing: boolean;
  };
  fontSize: number;
  fontFamily: string;
  processingOptions: {[key: string]: string[]};
  onUpdateOptions: (fileId: string, option: string, checked: boolean) => void;
  onProcessText: (fileId: string, options: string[]) => void;
  onDownload: () => void;
}

export const TranscriptionResult = ({ 
  result, 
  fontSize, 
  fontFamily, 
  processingOptions, 
  onUpdateOptions, 
  onProcessText, 
  onDownload 
}: TranscriptionResultProps) => {
  const [showProcessingOptions, setShowProcessingOptions] = useState(!result.processedText);

  const handleProcessText = (fileId: string, options: string[]) => {
    onProcessText(fileId, options);
    setShowProcessingOptions(false);
  };

  const handleProcessAgain = () => {
    setShowProcessingOptions(true);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-blue-50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg ml-3">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{result.fileName}</h4>
            <p className="text-sm text-gray-600">תמלול ועיבוד אוטומטי</p>
          </div>
        </div>
        <div className="flex gap-3 space-x-reverse">
          {result.transcription && (
            <Button
              size="lg"
              variant="outline"
              onClick={onDownload}
              className="px-6 py-2 rounded-lg border-2 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 ml-2" />
              הורד קובץ
            </Button>
          )}
        </div>
      </div>
      
      {result.isTranscribing && (
        <div className="flex items-center justify-center py-8 text-blue-600">
          <Loader2 className="w-6 h-6 animate-spin ml-3" />
          <span className="text-lg font-medium">מתמלל את הקובץ...</span>
        </div>
      )}
      
      {result.transcription && (
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              תמלול מלא:
            </label>
            <Textarea
              value={result.transcription}
              readOnly
              style={{ fontSize: `${fontSize}px`, fontFamily, textAlign: 'right' }}
              className="min-h-[150px] resize-none leading-relaxed p-4 bg-white border-2 border-gray-200 rounded-lg"
              dir="rtl"
            />
          </div>
          
          {/* Processing Options */}
          {showProcessingOptions && !result.isProcessing && (
            <ProcessingOptions
              fileId={result.fileId}
              processingOptions={processingOptions}
              isProcessing={result.isProcessing}
              onUpdateOptions={onUpdateOptions}
              onProcessText={handleProcessText}
            />
          )}
          
          {result.isProcessing && (
            <div className="flex items-center justify-center py-6 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              <span className="text-lg font-medium">מעבד טקסט עם ChatGPT...</span>
            </div>
          )}
          
          {result.processedText && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-3">
                  {result.processingType}:
                </label>
                <Textarea
                  value={result.processedText}
                  readOnly
                  style={{ fontSize: `${fontSize}px`, fontFamily, textAlign: 'right' }}
                  className="min-h-[120px] resize-none leading-relaxed p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg"
                  dir="rtl"
                />
              </div>
              <Button
                onClick={handleProcessAgain}
                variant="outline"
                className="w-full bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
              >
                עבד שוב עם אפשרויות שונות
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
