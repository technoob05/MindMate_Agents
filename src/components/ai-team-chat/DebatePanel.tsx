// src/components/ai-team-chat/DebatePanel.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareQuote } from 'lucide-react'; // Using a quote icon

interface DebatePanelProps {
  debateText: string;
}

const DebatePanel: React.FC<DebatePanelProps> = ({ debateText }) => {
  if (!debateText || debateText.trim() === "" || debateText.includes("No debate generated") || debateText.includes("Error during debate simulation")) {
    // Don't render if debate is empty or indicates an error/default state
    return null;
  }

  return (
    <Card className="my-4 border-dashed border-purple-500/50 bg-purple-500/5 shadow-sm">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-base font-medium text-purple-600 dark:text-purple-400 flex items-center">
          <MessageSquareQuote size={18} className="mr-2" />
          Agents' Discussion
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1 pb-3">
        {/* Render debate text, preserving line breaks */}
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{debateText}</p>
      </CardContent>
    </Card>
  );
};

export default DebatePanel;
