
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
    <Card className="p-10 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-xl rounded-2xl">
      <div className="flex items-center mb-8">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 rounded-xl">
          <Youtube className="w-7 h-7 text-white" />
        </div>
        <div className="mr-6">
          <h3 className="text-2xl font-bold text-gray-800">הורדה מיוטיוב</h3>
          <p className="text-lg text-gray-600">הכנס קישור יוטיוב להורדת אודיו</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="youtube-url" className="text-lg font-medium text-gray-700 mb-3 block">
            קישור יוטיוב:
          </Label>
          <Input
            id="youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="text-left py-4 text-lg"
            dir="ltr"
          />
        </div>

        {videoInfo && (
          <Card className="p-5 bg-white border-red-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <img 
                src={videoInfo.thumbnail} 
                alt="Video thumbnail" 
                className="w-20 h-15 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-lg">{videoInfo.title}</p>
                <p className="text-base text-gray-600">
                  משך: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                  {videoInfo.hasSubtitles && <span className="text-red-600 mr-3">• כתוביות זמינות</span>}
                </p>
              </div>
            </div>
          </Card>
        )}

        {isDownloading && (
          <div className="space-y-3">
            <div className="flex justify-between text-base">
              <span>מוריד...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Button
          onClick={handleDownload}
          disabled={!youtubeUrl || isDownloading}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 py-4 text-xl"
        >
          <Download className="w-5 h-5 mr-3" />
          {isDownloading ? 'מוריד...' : `הורד כ-${outputFormat.toUpperCase()}`}
        </Button>

        <div className="text-sm text-gray-500 text-center">
          <p className="text-base">התכונה תומכת בקישורי יוטיוב רגילים ו-YouTube Shorts</p>
          <p className="text-base">כתוביות יורדו אוטומטית אם זמינות</p>
        </div>
      </div>
    </Card>
  );
};
