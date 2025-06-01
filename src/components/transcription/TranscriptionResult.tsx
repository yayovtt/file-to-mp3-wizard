
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { TextProcessingOptions } from './TextProcessingOptions';

interface TranscriptionResultProps {
  fileName: string;
  transcription: string;
  processedTexts: Array<{
    type: string;
    content: string;
  }>;
  fontSize: number;
  fontFamily: string;
  onProcessText: (selectedOptions: string[]) => void;
  onDownload: () => void;
  isProcessing: boolean;
}

export const TranscriptionResult = ({
  fileName,
  transcription,
  processedTexts,
  fontSize,
  fontFamily,
  onProcessText,
  onDownload,
  isProcessing
}: TranscriptionResultProps) => {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-r from-gray-50 to-blue-50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-gray-900 text-lg">{fileName}</h4>
        <Button
          size="lg"
          variant="outline"
          onClick={onDownload}
          className="px-6 py-2 rounded-lg border-2 hover:bg-gray-50"
        >
          <Download className="w-4 h-4 ml-2" />
          הורד קובץ
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-gray-700 mb-3">
            תמלול מלא:
          </label>
          <Textarea
            value={transcription}
            readOnly
            style={{ fontSize: `${fontSize}px`, fontFamily, textAlign: 'right' }}
            className="min-h-[150px] resize-none leading-relaxed p-4 bg-white border-2 border-gray-200 rounded-lg"
            dir="rtl"
          />
        </div>

        <TextProcessingOptions
          onProcess={onProcessText}
          isProcessing={isProcessing}
        />

        {processedTexts.map((processed, index) => (
          <div key={index}>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              {processed.type}:
            </label>
            <Textarea
              value={processed.content}
              readOnly
              style={{ fontSize: `${fontSize}px`, fontFamily, textAlign: 'right' }}
              className="min-h-[120px] resize-none leading-relaxed p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg"
              dir="rtl"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
