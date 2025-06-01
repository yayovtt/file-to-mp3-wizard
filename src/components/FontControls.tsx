
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Type, Plus, Minus, Printer, Download, Share2 } from 'lucide-react';

interface FontControlsProps {
  fontSize: number;
  fontFamily: string;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
  onPrint: () => void;
  onShare: () => void;
  onDownload: () => void;
}

export const FontControls = ({
  fontSize,
  fontFamily,
  onFontSizeChange,
  onFontFamilyChange,
  onPrint,
  onShare,
  onDownload
}: FontControlsProps) => {
  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' },
  ];

  return (
    <div dir="rtl">
      <Card className="p-6 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl">
        <div className="flex items-center mb-4">
          <Type className="w-5 h-5 ml-2 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">אפשרויות עיצוב וייצוא</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Font Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סגנון גופן</label>
              <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר גופן" />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">גודל גופן</label>
              <div className="flex items-center space-x-3 space-x-reverse">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFontSizeChange(Math.max(fontSize - 2, 10))}
                  disabled={fontSize <= 10}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Badge variant="secondary" className="px-4 py-2 text-base">
                  {fontSize}px
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFontSizeChange(Math.min(fontSize + 2, 24))}
                  disabled={fontSize >= 24}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">אפשרויות ייצוא</label>
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={onPrint}
                variant="outline"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3"
              >
                <Printer className="w-4 h-4" />
                <span>הדפסה</span>
              </Button>
              
              <Button
                onClick={onShare}
                variant="outline"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 bg-green-50 hover:bg-green-100 border-green-300"
              >
                <Share2 className="w-4 h-4" />
                <span>שתף לוואטסאפ</span>
              </Button>
              
              <Button
                onClick={onDownload}
                variant="outline"
                className="flex items-center justify-center space-x-2 space-x-reverse py-3 bg-blue-50 hover:bg-blue-100 border-blue-300"
              >
                <Download className="w-4 h-4" />
                <span>הורד כקובץ</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
