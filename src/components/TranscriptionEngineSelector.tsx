
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, Mic, Globe } from 'lucide-react';

export type TranscriptionEngine = 'groq' | 'google' | 'assemblyai' | 'vosk';

interface TranscriptionEngineConfig {
  engine: TranscriptionEngine;
  apiKey: string;
}

interface TranscriptionEngineSelectorProps {
  onEngineChange: (config: TranscriptionEngineConfig) => void;
  currentEngine: TranscriptionEngine;
  currentApiKey: string;
}

export const TranscriptionEngineSelector = ({
  onEngineChange,
  currentEngine,
  currentApiKey
}: TranscriptionEngineSelectorProps) => {
  const [selectedEngine, setSelectedEngine] = useState<TranscriptionEngine>(currentEngine);
  const [apiKey, setApiKey] = useState(currentApiKey);

  const engines = [
    {
      id: 'groq' as TranscriptionEngine,
      name: 'Groq (Whisper)',
      description: 'מהיר ואיכותי, עם מגבלות שעתיות',
      icon: <Mic className="w-4 h-4" />,
      needsApiKey: true,
      placeholder: 'gsk_...'
    },
    {
      id: 'google' as TranscriptionEngine,
      name: 'Google Speech-to-Text',
      description: 'דיוק גבוה, תמיכה במגוון שפות',
      icon: <Globe className="w-4 h-4" />,
      needsApiKey: true,
      placeholder: 'AIza...'
    },
    {
      id: 'assemblyai' as TranscriptionEngine,
      name: 'AssemblyAI',
      description: 'תמלול מתקדם עם ניתוח רגשות',
      icon: <Settings className="w-4 h-4" />,
      needsApiKey: true,
      placeholder: 'API Key...'
    },
    {
      id: 'vosk' as TranscriptionEngine,
      name: 'Vosk (מקומי)',
      description: 'תמלול מקומי ללא צורך באינטרנט',
      icon: <Mic className="w-4 h-4" />,
      needsApiKey: false,
      placeholder: ''
    }
  ];

  const handleEngineChange = (engine: TranscriptionEngine) => {
    setSelectedEngine(engine);
    const selectedEngineInfo = engines.find(e => e.id === engine);
    if (!selectedEngineInfo?.needsApiKey) {
      // For engines that don't need API key, apply immediately
      onEngineChange({ engine, apiKey: '' });
      setApiKey('');
    }
  };

  const handleApplyChanges = () => {
    const selectedEngineInfo = engines.find(e => e.id === selectedEngine);
    if (selectedEngineInfo?.needsApiKey && !apiKey.trim()) {
      return; // Don't apply if API key is required but missing
    }
    onEngineChange({ engine: selectedEngine, apiKey });
  };

  const currentEngineInfo = engines.find(e => e.id === selectedEngine);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
      <div className="flex items-center mb-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl ml-4">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">בחירת מנוע תמלול</h3>
          <p className="text-sm text-gray-600">בחר את מנוע התמלול המועדף עליך</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="engine-select" className="text-sm font-medium text-gray-700 mb-2 block">
            מנוע תמלול
          </Label>
          <Select value={selectedEngine} onValueChange={handleEngineChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {engines.map((engine) => (
                <SelectItem key={engine.id} value={engine.id}>
                  <div className="flex items-center gap-2">
                    {engine.icon}
                    <div>
                      <div className="font-medium">{engine.name}</div>
                      <div className="text-xs text-gray-500">{engine.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentEngineInfo?.needsApiKey && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-gray-600" />
              <Label htmlFor="api-key" className="text-sm font-medium text-gray-700">
                מפתח API
              </Label>
            </div>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={currentEngineInfo.placeholder}
              className="font-mono text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              {currentEngineInfo?.icon}
              {currentEngineInfo?.name}
            </Badge>
            {currentEngine === selectedEngine && (
              <Badge variant="default">פעיל</Badge>
            )}
          </div>
          
          {(selectedEngine !== currentEngine || 
            (currentEngineInfo?.needsApiKey && apiKey !== currentApiKey)) && (
            <Button 
              onClick={handleApplyChanges}
              disabled={currentEngineInfo?.needsApiKey && !apiKey.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              החל שינויים
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
