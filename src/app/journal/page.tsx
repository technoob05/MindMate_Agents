'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Terminal, AlertCircle, BookOpen, Lightbulb, Zap, Quote, Loader2 } from "lucide-react";
import { JournalDashboard } from "@/components/journal/dashboard";

// Define the structure for stored entries (including optional fields)
interface StoredJournalEntry {
  id: string; // Unique ID for each entry
  timestamp: number;
  prompt: string;
  entry: string;
  emotion: string;
  response: string; // Main response
  insight?: string;
  action?: string;
  quote?: string;
}

// Define the structure for the analysis result state (including optional fields)
interface AnalysisResultState {
  emotion: string;
  response: string;
  audioUrl: string;
  insight?: string;
  action?: string;
  quote?: string;
}

// Local Storage Key
const JOURNAL_HISTORY_KEY = 'journalHistory';

// Helper functions for local storage
const getStoredEntries = (): StoredJournalEntry[] => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(JOURNAL_HISTORY_KEY);
    try {
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to parse journal history from localStorage", e);
      return [];
    }
  }
  return [];
};

const saveStoredEntry = (newEntry: StoredJournalEntry) => {
  if (typeof window !== 'undefined') {
    const existingEntries = getStoredEntries();
    // Add new entry and keep only the last N entries (e.g., 100) to prevent excessive storage use
    const updatedEntries = [newEntry, ...existingEntries].slice(0, 100);
    localStorage.setItem(JOURNAL_HISTORY_KEY, JSON.stringify(updatedEntries));
  }
};


const JournalPage = () => {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [journalEntry, setJournalEntry] = useState<string>('');
  const [journalHistory, setJournalHistory] = useState<StoredJournalEntry[]>([]); // State for history
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultState | null>(null); // Use updated state type
  const [error, setError] = useState<string | null>(null); // For submission errors
  const [promptError, setPromptError] = useState<string | null>(null); // Separate error state for prompt fetching
  const [showDashboard, setShowDashboard] = useState<boolean>(false); // State to toggle dashboard view

  // Fetch daily prompt and load history on load
  useEffect(() => {
    // Load history from local storage
    setJournalHistory(getStoredEntries());

    const fetchPrompt = async () => {
      setIsLoadingPrompt(true);
      setPromptError(null); // Clear previous prompt errors
      try {
        const response = await fetch('/api/journal/prompt');
        if (!response.ok) {
          // Try to get error message from response body if possible
          let errorDetails = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorDetails = errorData.error || errorDetails;
          } catch (jsonError) {
            // Ignore if response is not JSON or empty
          }
          throw new Error(errorDetails);
        }
        const data = await response.json();
        if (data.prompt) {
          setPrompt(data.prompt);
        } else {
          // Handle case where API returns success but no prompt
          throw new Error("API returned an empty prompt.");
        }
      } catch (e: any) {
        console.error("Failed to fetch journal prompt:", e);
        setPromptError(`Không thể tải gợi ý hôm nay. ${e.message || 'Vui lòng thử lại sau.'}`);
        // Provide a fallback prompt for the user
        setPrompt("Điều gì mang lại cho bạn niềm vui nhỏ bé hôm nay?");
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    fetchPrompt();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleSubmitJournal = async () => {
    if (!journalEntry.trim()) {
      setError("Vui lòng viết gì đó vào nhật ký của bạn.");
      return;
    }
    setIsSubmitting(true);
    setError(null); // Clear previous submission errors
    setAnalysisResult(null); // Clear previous results

    try {
      console.log("Submitting journal to /api/journal/analyze");
      const response = await fetch('/api/journal/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ journalEntry }),
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.details || errorDetails;
        } catch (jsonError) { /* Ignore */ }
        throw new Error(errorDetails);
      }

      const result = await response.json();

      // Check for required fields and optional fields
      if (result.emotion && result.response && result.audioDataUrl) {
        const newAnalysisResult: AnalysisResultState = {
          emotion: result.emotion,
          response: result.response,
          audioUrl: result.audioDataUrl,
          insight: result.insight, // Store optional fields
          action: result.action,
          quote: result.quote,
        };
        setAnalysisResult(newAnalysisResult);

        // Save the successful entry (including optional fields) to local storage
        if (prompt) { // Ensure prompt is not null
            const newStoredEntry: StoredJournalEntry = {
                id: crypto.randomUUID(), // Generate a simple unique ID
                timestamp: Date.now(),
                prompt: prompt,
                entry: journalEntry,
                emotion: result.emotion,
                response: result.response,
                insight: result.insight, // Save optional fields
                action: result.action,
                quote: result.quote,
            };
            saveStoredEntry(newStoredEntry);
            // Update history state immediately
            setJournalHistory(prev => [newStoredEntry, ...prev].slice(0, 100));
        } else {
             console.warn("Prompt was null, not saving entry to history.");
        }

      } else {
        throw new Error("Invalid response structure received from analysis API.");
      }

    } catch (e: any) {
      console.error("Failed to submit journal for analysis:", e);
      setError(`Không thể phân tích nhật ký: ${e.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsSubmitting(false);
    }
    // Optionally clear entry: setJournalEntry('');
  };

  // Updated to play audio from base64 data URL
  const playAudio = () => {
    if (analysisResult?.audioUrl) {
      try {
        const audio = new Audio(analysisResult.audioUrl); // Directly use the data URL
        audio.play().catch(e => {
            console.error("Error playing audio:", e);
            setError("Không thể phát âm thanh phản hồi. Trình duyệt có thể không hỗ trợ định dạng.");
        });
      } catch (e) {
         console.error("Error creating audio object:", e);
         setError("Lỗi khi chuẩn bị phát âm thanh.");
      }
    } else {
       setError("Không tìm thấy dữ liệu âm thanh để phát.");
       // Removed extra }); here
    }
  };

  // TODO: Implement Dashboard Component

  return (
    // Use theme background implicitly, adjust padding
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Guided Journal</h1>
        {/* Button to toggle Dashboard view - Use themed Button */}
        <Button variant="outline" size="sm" onClick={() => setShowDashboard(!showDashboard)}>
          <BookOpen className="mr-2 h-4 w-4" />
          {showDashboard ? "Write New Entry" : "View History"}
        </Button>
      </div>

      {/* Conditional Rendering: Show Journal or Dashboard */}
      {showDashboard ? (
        // Render the actual Dashboard component
        <JournalDashboard history={journalHistory} />
      ) : (
        // Journal Writing View
        <AnimatePresence mode="wait">
          {!showDashboard ? (
            <motion.div
              key="journal-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Display Prompt Error if exists - Use themed Alert */}
              {promptError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Loading Prompt</AlertTitle>
                  <AlertDescription>{promptError}</AlertDescription>
                </Alert>
              )}

              {/* Animated Prompt Card - Use themed Card */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
              >
                <Card className="mb-6 border-primary/20 bg-gradient-to-r from-card via-primary/5 to-card shadow-sm">
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-base font-semibold text-center text-primary">
                      Today's Reflection Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-base md:text-lg text-muted-foreground min-h-[40px] flex items-center justify-center pb-4">
                    {isLoadingPrompt ? (
                      <Skeleton className="h-5 w-3/4 mx-auto" />
                    ) : (
                      <span className="italic">"{prompt}"</span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Journal Entry Card - Use themed Card and Textarea */}
              <Card className="mb-6 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Your Thoughts</CardTitle>
                  <CardDescription>Write freely about the prompt or anything on your mind.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Start writing here..."
                    value={journalEntry}
                    onChange={(e) => setJournalEntry(e.target.value)}
                    rows={10}
                    className="w-full p-3 rounded-md focus:ring-primary" // Use themed focus
                    disabled={isSubmitting || isLoadingPrompt}
                  />
                  {/* Display submission error - Use themed text */}
                  {error && (
                    <p className="text-destructive text-sm mt-2">{error}</p>
                  )}
                  {/* Use themed Button */}
                  <Button
                    onClick={handleSubmitJournal}
                    disabled={ isSubmitting || isLoadingPrompt || !prompt || !!promptError || journalEntry.trim() === '' } // Also disable if entry is empty
                    variant="gradient" // Use gradient for primary action
                    className="mt-4 w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Analyze My Entry"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Loading Indicator - Use themed spinner */}
              {isSubmitting && (
                <div className="text-center my-4 flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Healing Muse is reflecting...</span>
                </div>
              )}

              {/* Animated Analysis Result Card - Use themed Card */}
              <AnimatePresence>
                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="mt-6"
                  >
                    <Card className="border-primary/30 bg-card shadow-md overflow-hidden">
                      <CardHeader className="bg-primary/5 p-4">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="text-primary font-semibold">Healing Muse Reflection</span>
                          {/* Emotion Badge - Use themed Badge */}
                          <motion.div
                            key={analysisResult.emotion} // Animate when emotion changes
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                          >
                            <Badge variant="secondary" className="text-sm capitalize">
                              {analysisResult.emotion}
                            </Badge>
                          </motion.div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        {/* Main Response */}
                        <p className="text-foreground">{analysisResult.response}</p>

                        {/* Optional Insight - Use themed background */}
                        {analysisResult.insight && (
                          <div className="flex items-start gap-3 p-3 bg-muted/70 rounded-md border border-border/50">
                            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">Insight:</span> {analysisResult.insight}
                            </p>
                          </div>
                        )}

                        {/* Optional Action - Use themed background */}
                        {analysisResult.action && (
                          <div className="flex items-start gap-3 p-3 bg-muted/70 rounded-md border border-border/50">
                            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-semibold text-foreground">Suggestion:</span> {analysisResult.action}
                            </p>
                          </div>
                        )}

                        {/* Optional Quote - Use themed background */}
                        {analysisResult.quote && (
                          <div className="flex items-start gap-3 p-3 bg-muted/70 rounded-md border border-border/50">
                            <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <blockquote className="text-sm text-muted-foreground italic">
                              "{analysisResult.quote}"
                            </blockquote>
                          </div>
                        )}

                        {/* Audio Button - Use themed Button */}
                        <Button
                          onClick={playAudio}
                          variant="outline"
                          size="sm"
                          disabled={!analysisResult.audioUrl}
                          className="mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.858 15.858a5 5 0 010-7.072m2.828 9.9a9 9 0 010-12.728M12 12a3 3 0 100-6 3 3 0 000 6z" />
                          </svg>
                          Listen to Reflection
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            // Dashboard View
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <JournalDashboard history={journalHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      )} {/* Closing parenthesis for the conditional rendering */}
    </div>
  );
};

export default JournalPage;
