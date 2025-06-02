
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  preview: string;
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'כחול קלאסי',
    primary: 'from-blue-600 to-purple-600',
    secondary: 'from-indigo-500 to-indigo-600',
    accent: 'from-red-600 to-red-700',
    background: 'from-blue-50 to-purple-50',
    preview: 'bg-gradient-to-r from-blue-600 to-purple-600'
  },
  {
    id: 'green',
    name: 'ירוק טבע',
    primary: 'from-green-600 to-emerald-600',
    secondary: 'from-teal-500 to-teal-600',
    accent: 'from-orange-600 to-orange-700',
    background: 'from-green-50 to-emerald-50',
    preview: 'bg-gradient-to-r from-green-600 to-emerald-600'
  },
  {
    id: 'purple',
    name: 'סגול מלכותי',
    primary: 'from-purple-600 to-violet-600',
    secondary: 'from-indigo-500 to-purple-500',
    accent: 'from-pink-600 to-pink-700',
    background: 'from-purple-50 to-violet-50',
    preview: 'bg-gradient-to-r from-purple-600 to-violet-600'
  },
  {
    id: 'orange',
    name: 'כתום חם',
    primary: 'from-orange-600 to-red-600',
    secondary: 'from-amber-500 to-orange-500',
    accent: 'from-blue-600 to-blue-700',
    background: 'from-orange-50 to-red-50',
    preview: 'bg-gradient-to-r from-orange-600 to-red-600'
  },
  {
    id: 'teal',
    name: 'טורקיז מרגיע',
    primary: 'from-teal-600 to-cyan-600',
    secondary: 'from-blue-500 to-teal-500',
    accent: 'from-rose-600 to-rose-700',
    background: 'from-teal-50 to-cyan-50',
    preview: 'bg-gradient-to-r from-teal-600 to-cyan-600'
  },
  {
    id: 'dark',
    name: 'כהה אלגנטי',
    primary: 'from-gray-800 to-gray-900',
    secondary: 'from-slate-600 to-slate-700',
    accent: 'from-blue-600 to-blue-700',
    background: 'from-gray-100 to-gray-200',
    preview: 'bg-gradient-to-r from-gray-800 to-gray-900'
  }
];

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const ThemeSelector = ({ currentTheme, onThemeChange }: ThemeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700"
          >
            <Palette className="w-6 h-6 text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end" side="top">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-right">ערכות נושא</h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <Card
                  key={theme.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    currentTheme.id === theme.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    onThemeChange(theme);
                    setIsOpen(false);
                  }}
                >
                  <div className="space-y-3">
                    <div className={`w-full h-8 rounded ${theme.preview}`} />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{theme.name}</span>
                      {currentTheme.id === theme.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { themes };
