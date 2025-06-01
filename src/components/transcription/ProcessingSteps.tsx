
import { CheckCircle, Loader2, Circle } from 'lucide-react';

interface ProcessingStepsProps {
  currentStep: 'conversion' | 'transcription' | 'completed';
  fileName: string;
}

export const ProcessingSteps = ({ currentStep, fileName }: ProcessingStepsProps) => {
  const steps = [
    { id: 'conversion', label: 'המרה ל-MP3', icon: Circle },
    { id: 'transcription', label: 'תמלול', icon: Circle },
    { id: 'completed', label: 'הושלם', icon: CheckCircle }
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      <h4 className="font-semibold text-gray-800 mb-3">{fileName}</h4>
      <div className="flex items-center space-x-4 space-x-reverse">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                status === 'completed' ? 'bg-green-500 text-white' :
                status === 'active' ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-400'
              }`}>
                {status === 'active' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <span className={`mr-2 text-sm ${
                status === 'completed' ? 'text-green-600' :
                status === 'active' ? 'text-blue-600' :
                'text-gray-400'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
