"use client";

import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Terminal, Lightbulb, Brain, Search, Database, Info, Leaf, Droplets, Sprout, Sun } from "lucide-react"; // Added garden icons, replaced Droplet/Seedling
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Utility for conditional class names

interface Slide {
  id: number;
  text: string;
  image: string | null;
  mimeType: string | null;
}

const AiExplainerPage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null); // State to hold the fetched API key
  const slideIdCounterRef = useRef<number>(0);
  const chatRef = useRef<any>(null);

  // Updated example prompts for MindMate
  const examplePrompts = [
    { icon: <Sprout size={14} />, text: "Explain mindfulness meditation like I'm five" }, // Replaced Seedling
    { icon: <Brain size={14} />, text: "What is cognitive behavioral therapy (CBT)?" },
    { icon: <Droplets size={14} />, text: "How does journaling help with stress?" }, // Replaced Droplet
    { icon: <Sun size={14} />, text: "Describe the 'fight or flight' response" },
  ];

  // Configure marked
  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }, []);

  // Fetch API key from the server endpoint on component mount
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await fetch('/api/ai-explainer/config');
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
          initializeChat(data.apiKey);
        } else {
          throw new Error("API key not found in response.");
        }
      } catch (err: any) {
        console.error("Failed to fetch or initialize chat:", err);
        setError(`Could not load API key. ${err.message}`);
      }
    };

    fetchApiKey();
  }, []); // Empty dependency array ensures this runs once on mount

  const parseAndRenderMarkdown = async (markdown: string): Promise<string> => {
    try {
      const sanitized = markdown.replace(/<script.*?>.*?<\/script>/gi, "");
      const parsedHtml = await marked.parse(sanitized);
      const textContent = parsedHtml
        .replace(/<\/?h[1-6]>/gi, "")
        .replace(/<\/?p>/gi, "")
        .replace(/<\/?li>/gi, "• ")
        .replace(/<\/?[uo]l>/gi, "<br>")
        .replace(/<strong>(.*?)<\/strong>/gi, "$1")
        .replace(/<em>(.*?)<\/em>/gi, "$1")
        .trim();
      return `<p>${textContent}</p>`;
    } catch (e) {
      console.error("Markdown parsing error:", e);
      return markdown;
    }
  };

  // Initialize the chat instance with the fetched API key
  const initializeChat = (key: string) => {
    if (!key) return;

    try {
      // Use the passed key directly
      const aiInstance = new GoogleGenAI({apiKey: key});
      chatRef.current = aiInstance.chats.create({
        model: 'gemini-2.0-flash-exp', // Consider updating model if needed
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
        history: [],
      });
    } catch (err) {
      console.error("Failed to initialize chat:", err);
      setError("Failed to initialize Google AI client. Please check your API key configuration.");
    }
  };

  const generateExplanation = async (currentPrompt: string) => {
    if (!currentPrompt.trim() || isLoading) return;

    if (!chatRef.current) {
      // Attempt re-initialization if chatRef is null and apiKey exists
      if (apiKey) {
        initializeChat(apiKey);
        if (!chatRef.current) {
          setError("API not initialized. Please refresh the page or check configuration.");
          return;
        }
      } else {
        setError("API key not available. Cannot initialize chat.");
        return;
      }
    }


    setIsLoading(true);
    setError(null);
    setSlides([]);
    slideIdCounterRef.current = 0;

    // Reset chat history
    if (chatRef.current && chatRef.current.history) {
      chatRef.current.history.length = 0;
    }

    // Updated instructions with "Calm Garden" metaphor
    const additionalInstructions = `
Use a metaphor involving a calm garden (planting seeds for ideas, watering thoughts, weeding out negativity, watching growth) to explain the concept.
Keep sentences short but conversational, casual, and engaging.
Generate a cute, minimal illustration for each sentence with black ink on white background, related to the garden metaphor.
No commentary, just begin your explanation.
Keep going until you're done`;

    const fullPrompt = currentPrompt + additionalInstructions;

    try {
      const result = await chatRef.current.sendMessageStream({
        message: fullPrompt,
      });

      let text = '';
      let img = null;

      for await (const chunk of result) {
        for (const candidate of chunk.candidates) {
          for (const part of candidate.content.parts ?? []) {
            if (part.text) {
              text += part.text;
            } else if (part.inlineData) {
              img = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";

              if (text && img) {
                const renderedText = await parseAndRenderMarkdown(text);
                const newSlide: Slide = {
                  id: slideIdCounterRef.current++,
                  text: renderedText,
                  image: img,
                  mimeType: mimeType,
                };
                setSlides(prev => [...prev, newSlide]);
                text = '';
                img = null;
              }
            }
          }
        }
      }

      if (text.trim()) {
        const renderedText = await parseAndRenderMarkdown(text);
        const finalSlide: Slide = {
          id: slideIdCounterRef.current++,
          text: renderedText,
          image: null,
          mimeType: null,
        };
        setSlides(prev => [...prev, finalSlide]);
      }
    } catch (err: any) {
      console.error("Failed to generate explanation:", err);
      let detailedError = err.message || "An unknown error occurred.";
      try {
        const regex = /{"error":(.*)}/gm;
        const match = regex.exec(err.toString());
        if (match && match[1]) {
          const parsedError = JSON.parse(match[1]);
          detailedError = parsedError.message || detailedError;
        }
      } catch (parseErr) {
        // Ignore parsing error
      }
      setError(detailedError);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    generateExplanation(prompt);
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    generateExplanation(example);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Removed MainNav */}
      <div className="space-y-8 pt-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #10b981, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif"
              }}>
            AI Concept Explainer
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Get instant visual explanations with simple illustrations from our Calm Garden
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-md border-2 border-gray-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl" style={{
                background: "linear-gradient(135deg, #3b82f6, #10b981, #f59e0b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif"
              }}>
                Ask anything
              </CardTitle>
              <CardDescription>
                Get simple visual explanations using our Calm Garden metaphor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  id="prompt-input"
                  placeholder="e.g., Explain mindfulness meditation like I'm five..."
                  value={prompt}
                  onChange={handlePromptChange}
                  rows={3}
                  className="resize-none bg-white border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                  disabled={isLoading || !apiKey} // Disable if loading or no API key
                  aria-label="Enter your prompt here"
                />
                <div className="flex flex-col space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block"
                       style={{
                        fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif"
                      }}>
                      Try these examples:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {examplePrompts.map((ex, index) => (
                        <Badge
                          key={ex.text}
                          variant="outline"
                          className={cn(
                            "cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1.5 py-2 px-3 bg-white border-2",
                            index % 3 === 0 ? "border-blue-200 text-blue-600" :
                            index % 3 === 1 ? "border-emerald-200 text-emerald-600" : "border-amber-200 text-amber-600"
                          )}
                          onClick={() => handleExampleClick(ex.text)}
                          style={{
                            fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif"
                          }}
                        >
                          {ex.icon}
                          <span>{ex.text}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading || !apiKey} // Disable if loading or no API key
                      className="px-6 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                      style={{
                        fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif",
                        borderRadius: "8px"
                      }}
                    >
                      {isLoading ? "Drawing..." : !apiKey ? "Initializing..." : "Create Explanation"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-6 animate-pulse">
              <div className="flex justify-center">
                <Skeleton className="h-8 w-1/3" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-52 w-52 rounded-md" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && slides.length > 0 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-xl font-medium text-center relative">
                <span className="bg-white px-4 relative z-10">Explanation Cards</span>
                <Separator className="absolute top-1/2 w-full left-0 -z-0" />
              </h2>

              <Tabs defaultValue="cards" className="w-full">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                  <TabsTrigger value="cards">Card View</TabsTrigger>
                  <TabsTrigger value="scroll">Scroll View</TabsTrigger>
                </TabsList>

                <TabsContent value="cards" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slides.map((slide, index) => (
                      <Card key={slide.id} className="overflow-hidden border shadow-md hover:shadow-lg transition-shadow bg-white">
                        <CardContent className="p-6 flex flex-col items-center">
                          {slide.image && (
                            <div className="flex justify-center mb-4">
                              <div className="flex items-center justify-center w-64 h-64">
                                <img
                                  src={`data:${slide.mimeType};base64,${slide.image}`}
                                  alt="AI generated illustration"
                                  className="object-contain max-h-full max-w-full"
                                />
                              </div>
                            </div>
                          )}
                          <div
                            className={cn(
                              "mt-2 text-center w-full",
                              index % 3 === 0 ? "text-blue-600" :
                              index % 3 === 1 ? "text-emerald-600" : "text-amber-600"
                            )}
                            style={{
                              fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif",
                              fontWeight: "normal"
                            }}
                            dangerouslySetInnerHTML={{ __html: slide.text }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="scroll" className="mt-6">
                  <ScrollArea className="w-full rounded-md">
                    <div className="flex space-x-4 p-4">
                      {slides.map((slide, index) => (
                        <Card
                          key={slide.id}
                          className="min-w-[300px] max-w-[350px] flex-shrink-0 bg-white border shadow-md"
                        >
                          <CardContent className="p-6 flex flex-col items-center">
                            {slide.image && (
                              <div className="flex justify-center mb-4">
                                <div className="flex items-center justify-center w-64 h-64">
                                  <img
                                    src={`data:${slide.mimeType};base64,${slide.image}`}
                                    alt="AI generated illustration"
                                    className="object-contain max-h-full max-w-full"
                                  />
                                </div>
                              </div>
                            )}
                            <div
                              className={cn(
                                "mt-2 text-center w-full",
                                index % 3 === 0 ? "text-blue-600" :
                                index % 3 === 1 ? "text-emerald-600" : "text-amber-600"
                              )}
                              style={{
                                fontFamily: "'Comic Sans MS', 'Comic Sans', cursive, sans-serif",
                                fontWeight: "normal"
                              }}
                              dangerouslySetInnerHTML={{ __html: slide.text }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <CardFooter className="pt-2 justify-center">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lightbulb size={12} />
                  <span>AI-generated explanations with custom illustrations</span>
                </p>
              </CardFooter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiExplainerPage;
