// src/components/ai-team-chat/InsideOutSummaryCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; // Use Separator for visual distinction

interface InsideOutSummaryCardProps {
  summary: string;
  advice: string;
}

const InsideOutSummaryCard: React.FC<InsideOutSummaryCardProps> = ({ summary, advice }) => {
  // Basic check to prevent rendering empty cards if somehow summary/advice are missing
  if (!summary && !advice) {
    return null;
  }

  return (
    <Card className="my-4 border-primary/50 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-primary">Emotion Summary & Advice</CardTitle>
        {summary && <CardDescription className="pt-1">{summary}</CardDescription>}
      </CardHeader>
      {summary && advice && <Separator className="my-1" />}
      {advice && (
        <CardContent className="pt-2">
          <h4 className="text-md font-medium mb-1">Suggested Action:</h4>
          {/* Render advice potentially with line breaks */}
          <p className="text-sm whitespace-pre-wrap">{advice}</p>
        </CardContent>
      )}
    </Card>
  );
};

export default InsideOutSummaryCard;
