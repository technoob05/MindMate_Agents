// src/components/ai-team-chat/EmotionAgentBubble.tsx
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Using Shadcn UI Avatar, added AvatarImage
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Using Shadcn UI Card
import { motion } from 'framer-motion'; // For potential animations

// Import shared types
import { type AgentName, type AgentTheme, type EmotionAgentResponse } from '@/types/chat';

interface EmotionAgentBubbleProps {
  response: EmotionAgentResponse;
  agentTheme?: AgentTheme; // Accept the theme data
}

const EmotionAgentBubble: React.FC<EmotionAgentBubbleProps> = ({ response, agentTheme }) => {
  const IconComponent = agentTheme?.icon; // Get the icon component from theme

  return (
    // Use motion.div for potential entry/exit animations
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-start space-x-3 my-2 max-w-[85%]"
    >
      <Avatar className={`w-8 h-8 border shadow-sm flex-shrink-0 transition-transform hover:scale-110 ${agentTheme?.baseClass || 'bg-muted'}`}>
        {response.avatar && 
          <AvatarImage 
            src={response.avatar} 
            alt={response.emotion} 
            className="object-cover" 
          />
        }
        <AvatarFallback className="text-xs font-semibold bg-transparent">
          {response.avatar || response.emotion.charAt(0)}
        </AvatarFallback>
      </Avatar>

      <Card 
        className={`rounded-lg rounded-tl-sm shadow-sm flex-grow break-words border relative overflow-hidden ${
          agentTheme?.baseClass || 'glass-morphism bg-card/30 border-border/50'
        }`}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1
          }}
        />
        
        <CardHeader className="p-2 pb-1 flex flex-row items-center relative z-10">
          {IconComponent && (
            <IconComponent 
              size={14} 
              className={`mr-1.5 ${
                agentTheme?.baseClass.split(' ').find(cls => cls.startsWith('text-')) || 'text-foreground'
              }`} 
            />
          )}
          <CardTitle className="text-sm font-semibold">{response.emotion}</CardTitle>
        </CardHeader>
        
        <CardContent className="p-2 pt-0 text-sm text-card-foreground relative z-10">
          <p className="whitespace-pre-wrap">{response.analysis}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EmotionAgentBubble;
