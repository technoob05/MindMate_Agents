'use client';

import React from 'react';
import { motion } from 'framer-motion'; // Import motion
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area"; // For scrollable list
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"; // Import recharts components
import { useTheme } from "@/components/theme-provider"; // Use the custom theme hook

// Import the type definition (assuming it might be moved to a shared types file later)
interface StoredJournalEntry {
  id: string;
  timestamp: number;
  prompt: string;
  entry: string;
  emotion: string;
  response: string;
  insight?: string; // Add optional field
  action?: string;  // Add optional field
  quote?: string;   // Add optional field
}

interface JournalDashboardProps {
  history: StoredJournalEntry[];
}

// Mapping emotions to potential sentiment scores for charting (example)
const emotionSentimentScore: { [key: string]: number } = {
  'Buồn': -2,
  'Lo âu': -1,
  'Mệt mỏi': -1,
  'Giận dữ': -2,
  'Bối rối': 0,
  'Bình yên': 1,
  'Biết ơn': 2,
  'Hy vọng': 1,
  'Tự hào': 2,
  'Tích cực': 2,
  'Không xác định': 0,
};

// Define a type for chart data points
interface ChartDataPoint {
    date: string;
    timestamp: number;
    emotion: string;
    score: number;
}

export const JournalDashboard: React.FC<JournalDashboardProps> = ({ history }) => {
  const { theme } = useTheme(); // Get current theme ('light', 'dark', 'ghibli')

  // Prepare data for the chart
  const chartData: ChartDataPoint[] = history
    .map(entry => ({
      // Format date for display on X-axis (e.g., DD/MM)
      date: new Date(entry.timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      timestamp: entry.timestamp,
      emotion: entry.emotion,
      score: emotionSentimentScore[entry.emotion] ?? 0, // Get score or default to 0
    }))
    .sort((a, b) => a.timestamp - b.timestamp); // Sort by date ascending

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Use themed Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Journal History & Insights</CardTitle>
          <CardDescription>Review your emotional journey over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8"> {/* Increased spacing */}
          {/* Chart Section */}
          <div>
             <h3 className="text-lg font-semibold mb-4 text-foreground">Emotion Trend</h3>
             {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 5 }} // Adjusted margins
                  >
                    {/* Use CSS variables for theme-aware colors */}
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                       dataKey="date"
                       stroke="hsl(var(--muted-foreground))"
                       fontSize={11} // Slightly smaller font
                       tickLine={false}
                       axisLine={false}
                    />
                    <YAxis
                       domain={[-2.5, 2.5]}
                       allowDecimals={false}
                       stroke="hsl(var(--muted-foreground))"
                       fontSize={11}
                       tickLine={false}
                       axisLine={false}
                       tickFormatter={(value) => {
                           if (value === 2) return 'Positive';
                           if (value === 0) return 'Neutral';
                           if (value === -2) return 'Negative';
                           return '';
                       }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))", // Use popover background
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--popover-foreground))", // Use popover foreground
                        borderRadius: 'var(--radius)', // Use theme radius
                        fontSize: '12px',
                        boxShadow: 'hsl(var(--shadow))', // Use theme shadow if defined, else default
                      }}
                      labelFormatter={(label) => `Date: ${label}`}
                      formatter={(value: number, name: string, props: any) => [
                        `${props.payload.emotion} (${value > 0 ? '+' : ''}${value})`, // Show emotion and score with sign
                        'Sentiment'
                      ]}
                    />
                    {/* <Legend wrapperStyle={{ fontSize: '12px' }} /> */}
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))" // Use primary color variable
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                      activeDot={{ r: 5, stroke: 'hsl(var(--primary))', fill: 'hsl(var(--background))', strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
             ) : (
                // Use themed placeholder style
                <div className="h-64 bg-muted/50 border border-dashed border-border rounded-md flex items-center justify-center">
                   <p className="text-muted-foreground text-center text-sm px-4">
                      Not enough data to display the chart yet. <br/> Keep journaling to see your trends!
                   </p>
                </div>
             )}
          </div>

          {/* History List Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Saved Entries</h3>
            {history.length === 0 ? (
              // Use themed placeholder style
              <div className="h-40 bg-muted/50 border border-dashed border-border rounded-md flex items-center justify-center">
                 <p className="text-muted-foreground text-sm">No journal entries saved yet.</p>
              </div>
            ) : (
              // Use themed ScrollArea and list item styles
              <ScrollArea className="h-80 w-full rounded-md border border-border/60 p-1"> {/* Reduced padding */}
                <ul className="divide-y divide-border/60"> {/* Use divide for separators */}
                  {history.map(entry => (
                    <li key={entry.id} className="p-3 hover:bg-muted/50 transition-colors"> {/* Added hover effect */}
                      <p className="text-xs text-muted-foreground mb-1.5"> {/* Adjusted margin */}
                        {new Date(entry.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                      <p className="text-sm mb-1">
                         <span className="font-medium text-muted-foreground">Emotion:</span>{' '}
                         <span className="font-semibold text-foreground">{entry.emotion}</span>
                      </p>
                      <p className="text-sm italic text-muted-foreground mb-2">"{entry.prompt}"</p>
                      {/* Themed details/summary */}
                      <details className="text-sm group">
                          <summary className="cursor-pointer text-primary/80 hover:text-primary list-none flex items-center text-xs font-medium">
                             View Details
                             <svg className="h-3 w-3 ml-1 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                             </svg>
                          </summary>
                          <div className="pt-2 mt-1 border-t border-border/60 space-y-2 text-muted-foreground">
                            <p><span className="font-semibold text-foreground">Your Entry:</span> {entry.entry}</p>
                            <p><span className="font-semibold text-foreground">Muse Reflection:</span> {entry.response}</p>
                            {/* Display optional fields if they exist */}
                            {entry.insight && <p><span className="font-semibold text-foreground">Insight:</span> {entry.insight}</p>}
                            {entry.action && <p><span className="font-semibold text-foreground">Suggestion:</span> {entry.action}</p>}
                            {entry.quote && <p><span className="font-semibold text-foreground">Quote:</span> "{entry.quote}"</p>}
                          </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
