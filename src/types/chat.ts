// src/types/chat.ts

import React from 'react'; // Import React for the Icon type

// Define AgentName type
export type AgentName =
  | "Listener"
  | "Goal Setter"
  | "Resource Finder"
  | "Coordinator"
  | "Joy"
  | "Sadness"
  | "Anger"
  | "Fear"
  | "Disgust";

// Define AgentTheme interface
export interface AgentTheme {
  baseClass: string; // Tailwind class for background/accents
  icon: React.ForwardRefExoticComponent<any>; // Type for Lucide icons
  description: string;
}

// Define the message structure used across frontend and backend
export interface TeamChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  agentName?: AgentName;
  timestamp: number;
  conversationId: string;
  type: 'standard' | 'insideOut';
  avatar?: string;
  isNewSession?: boolean; // Frontend only state
}

// Result structure for the summary API
export interface SummaryResult {
    summary: string;
    advice: string;
}

// ChatMessage type used in the flow functions (simplified)
export interface FlowChatMessage {
    sender: 'user' | string; // 'user' or agent name (e.g., 'Joy')
    text: string;
}

// Interface for the data structure expected by EmotionAgentBubble
export interface EmotionAgentResponse {
  emotion: string; // Corresponds to AgentName
  analysis: string; // The agent's message text
  avatar?: string;
}
