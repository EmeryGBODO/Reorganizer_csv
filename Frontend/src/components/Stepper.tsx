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
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.title} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-blue-400" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-blue-600 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-blue-200" />
                </div>
                <div className="relative flex h-8 w-8 items-center justify-center bg-white border-2 border-blue-600 rounded-full" aria-current="step">
                  <span className="h-2.5 w-2.5 bg-blue-600 rounded-full" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-blue-200" />
                </div>
                <div className="group relative flex h-8 w-8 items-center justify-center bg-white border-2 border-blue-300 rounded-full">
                  <span className="h-2.5 w-2.5 bg-transparent rounded-full" aria-hidden="true" />
                </div>
              </>
            )}
            <span className="absolute top-10 w-max text-center text-xs text-gray-600">{step.title}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;