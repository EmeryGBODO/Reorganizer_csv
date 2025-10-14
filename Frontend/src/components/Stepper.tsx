import React from 'react';
import { CheckCircle } from 'lucide-react';

interface StepperStep {
  id: string;
  title: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <nav aria-label="Progress" className="px-4">
      <ol className="flex items-center justify-center">
        {steps.map((step, stepIdx) => {
          const isCompleted = stepIdx < currentStepIndex;
          const isCurrent = stepIdx === currentStepIndex;
          const isLast = stepIdx === steps.length - 1;

          return (
            <li key={step.id} className={`relative ${!isLast ? 'pr-8 sm:pr-20' : ''}`}>
              {!isLast && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full transition-all duration-500 ${
                    isCompleted ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-200'
                  }`} />
                </div>
              )}
              
              <div className="relative flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg' 
                    : isCurrent 
                    ? 'bg-white border-2 border-blue-500 shadow-md' 
                    : 'bg-white border-2 border-gray-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <span className={`h-3 w-3 rounded-full transition-all duration-300 ${
                      isCurrent ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                  )}
                </div>
                <span className={`absolute top-12 w-max text-center text-sm transition-colors duration-300 ${
                  isCompleted || isCurrent ? 'text-gray-800 font-medium' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Stepper;