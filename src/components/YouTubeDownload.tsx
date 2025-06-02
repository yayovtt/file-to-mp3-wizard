
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Youtube, Download } from 'lucide-react';
import { downloadYouTubeAudio, getYouTubeVideoInfo } from '@/services/youtubeService';
import { useToast } from '@/hooks/use-toast';

interface YouTubeDownloadProps {
  onFileDownloaded: (file: File, subtitles?: string) => void;
  outputFormat: 'mp3' | 'webm';
}

export const YouTubeDownload = ({ onFileDownloaded, outputFormat }: YouTubeDownloadProps) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const { toast } = useToast();

  const handleUrlChange = async (url: string) => {
    setYoutubeUrl(url);
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      try {
        const info = await getYouTubeVideoInfo(url);
        setVideoInfo(info);
      } catch (error) {
        console.error('Error getting video info:', error);
        setVideoInfo(null);
      }
    } else {
      setVideoInfo(null);
    }
  };

  const handleDownload = async () => {
    if (!youtubeUrl) {
      toast({
        title: "שגיאה",
        description: "אנא הכנס קישור יוטיוב תקין",
        variant: "destructive"
      });
      return;
    }

    setIsDownloading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const result = await downloadYouTubeAudio(youtubeUrl, outputFormat);
      
      clearInterval(progressInterval);
      setProgress(100);

      // Convert blob to file
      const file = new File([result.audioBlob], `${result.title}.${outputFormat}`, {
        type: outputFormat === 'mp3' ? 'audio/mpeg' : 'video/webm'
      });

      onFileDownloaded(file, result.subtitles);

      toast({
        title: "הורדה הושלמה",
        description: `הקובץ ${result.title} הורד בהצלחה`,
      });

      // Reset form
      setYoutubeUrl('');
      setVideoInfo(null);
      setProgress(0);

    } catch (error) {
      toast({
        title: "שגיאה בהורדה",
        description: error.message || "אירעה שגיאה בהורדת הקובץ",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-xl rounded-2xl">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-3 rounded-xl">
          <Youtube className="w-6 h-6 text-white" />
        </div>
        <div className="mr-4">
          <h3 className="text-xl font-bold text-gray-800">הורדה מיוטיוב</h3>
          <p className="text-gray-600">הכנס קישור יוטיוב להורדת אודיו</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="youtube-url" className="text-base font-medium text-gray-700 mb-2 block">
            קישור יוטיוב:
          </Label>
          <Input
            id="youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="text-left"
            dir="ltr"
          />
        </div>

        {videoInfo && (
          <Card className="p-4 bg-white border-emerald-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <img 
                src={videoInfo.thumbnail} 
                alt="Video thumbnail" 
                className="w-16 h-12 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{videoInfo.title}</p>
                <p className="text-sm text-gray-600">
                  משך: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                  {videoInfo.hasSubtitles && <span className="text-green-600 mr-2">• כתוביות זמינות</span>}
                </p>
              </div>
            </div>
          </Card>
        )}

        {isDownloading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>מוריד...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button
          onClick={handleDownload}
          disabled={!youtubeUrl || isDownloading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? 'מוריד...' : `הורד כ-${outputFormat.toUpperCase()}`}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>התכונה תומכת בקישורי יוטיוב רגילים ו-YouTube Shorts</p>
          <p>כתוביות יורדו אוטומטית אם זמינות</p>
        </div>
      </div>
    </Card>
  );
};
