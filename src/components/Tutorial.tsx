import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Lightbulb } from 'lucide-react';
import { Button, cn } from './ui/Base';

export interface TutorialStep {
  targetId?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialProps {
  steps: TutorialStep[];
  onComplete: () => void;
  isOpen: boolean;
}

export default function Tutorial({ steps, onComplete, isOpen }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset step when tutorial opens
  React.useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-auto"
        />

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl shadow-2xl p-8 pointer-events-auto relative overflow-hidden"
          >
            {/* Ambient light effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px]" />
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Step {currentStep + 1} of {steps.length}</span>
                </div>
                <button onClick={onComplete} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold tracking-tight text-white">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed italic">{step.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        i === currentStep ? "w-6 bg-blue-500" : "w-2 bg-white/10"
                      )}
                    />
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="px-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      if (currentStep === steps.length - 1) {
                        onComplete();
                      } else {
                        setCurrentStep(prev => prev + 1);
                      }
                    }}
                    className="gap-2"
                  >
                    {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                    {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
