import React, { useState, useEffect } from 'react';
import { LightbulbIcon, BrainCircuit, MessagesSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReasoningStep {
  type: 'thinking' | 'analysis' | 'conclusion';
  content: string;
}

interface ReasoningProcessProps {
  steps: ReasoningStep[];
  isComplete: boolean;
  isVisible: boolean;
}

export function ReasoningProcess({ steps, isComplete, isVisible }: ReasoningProcessProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  
  useEffect(() => {
    if (!isVisible) {
      setVisibleSteps(0);
      return;
    }
    
    // Only start revealing steps if we have steps to show
    if (steps.length === 0) return;
    
    // Gradually reveal steps with a staggered delay
    const interval = setInterval(() => {
      setVisibleSteps(prev => {
        if (prev < steps.length) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1600); // Slow down to 1.6 seconds for more dramatic effect
    
    return () => clearInterval(interval);
  }, [steps, isVisible]);
  
  if (!isVisible) return null;
  if (steps.length === 0) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm mb-3 p-4 rounded-md border-2 border-primary/20 bg-gradient-to-b from-background to-muted/20 shadow-sm"
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-center mb-1">
          <BrainCircuit size={18} className="mr-2 text-primary" />
          <span className="font-medium text-primary">Quá trình suy luận</span>
          
          {isComplete && visibleSteps >= steps.length && (
            <div className="ml-auto flex items-center text-xs text-green-500 font-medium">
              <CheckCircle2 size={14} className="mr-1" />
              <span>Đã hoàn thành</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4 ml-1">
          <AnimatePresence initial={false}>
            {steps.slice(0, visibleSteps).map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                transition={{ 
                  duration: 0.5,
                  ease: 'easeOut'
                }}
              >
                <Step step={step} isLast={index === steps.length - 1} />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {visibleSteps < steps.length && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-xs text-muted-foreground ml-1"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <BrainCircuit size={14} className="text-primary/70" />
              </motion.div>
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                Đang suy luận...
              </motion.span>
            </motion.div>
          )}
        </div>
      </div>
      
      {isComplete && visibleSteps >= steps.length && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 pt-3 border-t border-border/50 flex items-center"
        >
          <ArrowRight size={14} className="mr-2 text-primary" />
          <span className="text-xs font-medium">Dựa trên phân tích trên, tôi đang chuẩn bị phản hồi...</span>
        </motion.div>
      )}
    </motion.div>
  );
}

interface StepProps {
  step: ReasoningStep;
  isLast: boolean;
}

function Step({ step, isLast }: StepProps) {
  const getIcon = () => {
    switch (step.type) {
      case 'thinking':
        return <BrainCircuit size={16} className="text-blue-500" />;
      case 'analysis':
        return <MessagesSquare size={16} className="text-amber-500" />;
      case 'conclusion':
        return <LightbulbIcon size={16} className="text-green-500" />;
      default:
        return <BrainCircuit size={16} />;
    }
  };
  
  const getTitle = () => {
    switch (step.type) {
      case 'thinking':
        return 'Suy nghĩ';
      case 'analysis':
        return 'Phân tích';
      case 'conclusion':
        return 'Kết luận';
      default:
        return 'Bước';
    }
  };

  const getStepColor = () => {
    switch (step.type) {
      case 'thinking':
        return 'border-blue-200 bg-blue-50/30';
      case 'analysis':
        return 'border-amber-200 bg-amber-50/30';
      case 'conclusion':
        return 'border-green-200 bg-green-50/30';
      default:
        return 'border-gray-200 bg-muted/30';
    }
  };
  
  return (
    <div className="relative pl-8">
      {/* Connection line between steps */}
      {!isLast && (
        <div className="absolute left-[0.875rem] top-7 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />
      )}
      
      {/* Step icon */}
      <div className="absolute left-0 top-1 h-7 w-7 rounded-full bg-card flex items-center justify-center border border-primary/20 shadow-sm">
        {getIcon()}
      </div>
      
      <div className="space-y-1.5">
        <div className="text-sm font-medium">{getTitle()}</div>
        <div className={`text-xs rounded-md p-3.5 border ${getStepColor()} whitespace-pre-wrap shadow-sm`}>
          {step.content}
        </div>
      </div>
    </div>
  );
} 