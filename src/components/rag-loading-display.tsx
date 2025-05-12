import React from 'react';
import { motion } from 'framer-motion';
import { Bot, FileText, Search, Database, Sparkles } from 'lucide-react';

type RagStep = 'analyzing' | 'searching' | 'retrieving' | 'generating' | 'completed' | null;

interface RagLoadingDisplayProps {
  isVisible: boolean;
  currentStep: RagStep;
}

export function RagLoadingDisplay({ isVisible, currentStep }: RagLoadingDisplayProps) {
  if (!isVisible) return null;

  return (
    <div className="text-sm text-muted-foreground mb-2 p-2 rounded-md border">
      <div className="flex flex-col">
        <div className="flex items-center mb-1">
          <Bot size={14} className="mr-2" />
          <span className="font-medium">Thinking...</span>
        </div>
        
        <div className="space-y-1 ml-6">
          {/* Analyzing step */}
          <Step 
            icon={<FileText size={14} />}
            label="Analyzing query"
            isActive={currentStep === 'analyzing'}
            isCompleted={['searching', 'retrieving', 'generating', 'completed'].includes(currentStep as string)}
          />
          
          {/* Searching step */}
          <Step 
            icon={<Search size={14} />}
            label="Searching knowledge base"
            isActive={currentStep === 'searching'}
            isCompleted={['retrieving', 'generating', 'completed'].includes(currentStep as string)}
          />
          
          {/* Retrieving step */}
          <Step 
            icon={<Database size={14} />}
            label="Retrieving relevant information"
            isActive={currentStep === 'retrieving'}
            isCompleted={['generating', 'completed'].includes(currentStep as string)}
          />
          
          {/* Generating step */}
          <Step 
            icon={<Sparkles size={14} />}
            label="Generating response"
            isActive={currentStep === 'generating'}
            isCompleted={['completed'].includes(currentStep as string)}
          />
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function Step({ icon, label, isActive, isCompleted }: StepProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`
        ${isActive ? 'text-primary' : ''}
        ${isCompleted ? 'text-green-500' : ''}
        ${!isActive && !isCompleted ? 'text-gray-400' : ''}
      `}>
        {icon}
      </div>
      <span className={`
        ${isActive ? 'text-primary font-medium' : ''}
        ${isCompleted ? 'text-green-500' : ''}
        ${!isActive && !isCompleted ? 'text-gray-400' : ''}
      `}>
        {label}
        {isActive && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="inline-block"
          >
            ...
          </motion.span>
        )}
      </span>
    </div>
  );
} 