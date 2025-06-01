
import { Card } from '@/components/ui/card';
import { TranscriptionSection } from '@/components/TranscriptionSection';
import { Music, Video, FileText, MessageSquare } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50" dir="rtl">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6 space-x-4 space-x-reverse">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-3xl shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-3xl shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
            תמלול וסיכום
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
            אודיו ווידאו לטקסט בעברית
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            העלה קובץ אודיו או וידאו, קבל תמלול מדויק בעברית ועיבוד אוטומטי עם ChatGPT
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">תמלול מדויק</h3>
            <p className="text-purple-100 text-lg">המרה אוטומטית לטקסט באיכות גבוהה</p>
          </Card>
          
          <Card className="p-8 text-center bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-4">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-3">עיבוד חכם</h3>
            <p className="text-blue-100 text-lg">סיכום, עריכה ותיקון עם ChatGPT</p>
          </Card>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 text-center bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl rounded-2xl">
            <div className="text-4xl font-bold mb-3">1</div>
            <div className="text-green-100 text-lg">העלה קובץ</div>
          </Card>
          <Card className="p-8 text-center bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl rounded-2xl">
            <div className="text-4xl font-bold mb-3">2</div>
            <div className="text-orange-100 text-lg">המרה ותמלול</div>
          </Card>
          <Card className="p-8 text-center bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-xl rounded-2xl">
            <div className="text-4xl font-bold mb-3">3</div>
            <div className="text-pink-100 text-lg">עיבוד וסיכום</div>
          </Card>
        </div>

        {/* Main Transcription Section */}
        <TranscriptionSection />
      </div>
    </div>
  );
};

export default Index;
