'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import VoiceInteraction from '@/components/voice-interaction';
import { AnimatePresence, motion } from 'framer-motion';
// Import necessary icons from lucide-react
import {
    Send, Mic, ChevronRight, ChevronLeft, BrainCircuit, BarChart, RefreshCw, Info, X, BookOpen, 
    MessageSquare, Settings, Sparkles, AlertTriangle, ShieldAlert, XCircle, Users, Loader2
} from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
// Import AlertDialog components
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import EmotionAgentBubble from '@/components/ai-team-chat/EmotionAgentBubble';
import InsideOutSummaryCard from '@/components/ai-team-chat/InsideOutSummaryCard'; // Keep for potential future use
import DebatePanel from '@/components/ai-team-chat/DebatePanel'; // Keep for potential future use

// Import shared types
import { type AgentName, type AgentTheme, type TeamChatMessage, type SummaryResult } from '@/types/chat';

// Define Interaction Step types (Keep for potential future summary logic)
type InteractionStep = 'analysis' | 'debate' | 'summary';

// Define theming constants for agents including emotions
const AGENT_THEMES: Record<AgentName, AgentTheme> = {
  // Standard Agents
  Listener: {
    baseClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: MessageSquare,
    description: "Focuses on understanding your feelings and emotions.",
  },
  "Goal Setter": { // Keep standard agents if they are still used elsewhere
    baseClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    icon: BarChart,
    description: "Helps define actionable steps to achieve your goals.",
  },
  "Resource Finder": {
    baseClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    icon: BookOpen,
    description: "Suggests relevant tools, resources or information.",
  },
  Coordinator: {
    baseClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: BrainCircuit,
    description: "Manages the team's interaction and coordinates responses.",
  },
  // Emotion Agents
  Joy: {
    baseClass: "bg-yellow-400/10 text-yellow-500 dark:text-yellow-300 border-yellow-400/20",
    icon: Sparkles, // Example icon
    description: "Focuses on the positive aspects and potential.",
  },
  Sadness: {
    baseClass: "bg-blue-600/10 text-blue-700 dark:text-blue-500 border-blue-600/20",
    icon: MessageSquare, // Example icon (reuse or find specific)
    description: "Acknowledges pain, loss, and empathy.",
  },
  Anger: {
    baseClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: AlertTriangle,
    description: "Highlights unfairness, boundaries, and motivation for change.",
  },
  Fear: {
    baseClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    icon: ShieldAlert,
    description: "Focuses on potential threats, risks, and safety.",
  },
  Disgust: {
    baseClass: "bg-green-700/10 text-green-800 dark:text-green-600 border-green-700/20",
    icon: XCircle,
    description: "Reacts to toxicity, unfairness, and protects standards.",
  },
};

export default function AiTeamChatPage() {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Tracks initial load
  const [isSending, setIsSending] = useState(false); // Tracks sending state (replaces isLoading for send button)
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // Tracks AI typing simulation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatMode, setChatMode] = useState<'standard' | 'insideOut'>('insideOut'); // Default to insideOut for testing
  // State for summary feature
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false); // Controls dialog visibility

  // Auto-scroll to bottom when messages change or typing starts/stops
  useEffect(() => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ai-team-chat');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: TeamChatMessage[] = await response.json();
        if (data.length === 0) {
          setMessages([{
            id: "team-welcome-1",
            text: "Welcome to MindMate AI Team Chat! Our specialized agents are here to help. What's on your mind?",
            sender: "ai", agentName: "Coordinator", timestamp: Date.now(), isNewSession: true, type: 'standard',
            conversationId: `welcome-${Date.now()}` // Add placeholder conversationId
          }]);
        } else {
          setMessages(data);
          setTimeout(scrollToBottom, 150);
        }
      } catch (err: any) {
        console.error("Failed to fetch AI team messages:", err);
        setError(`Failed to load chat history: ${err.message}. Please try refreshing.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isSending || isTyping) return; // Prevent sending while processing

    const textToSend = inputMessage;
    setInputMessage('');
    setIsSending(true); // Disable input while processing
    setError(null);

    // Optimistically add user message
    const optimisticUserMessage: TeamChatMessage = {
      id: `temp-user-${crypto.randomUUID()}`,
      text: textToSend,
      sender: "user",
      timestamp: Date.now(),
      type: chatMode,
      conversationId: `temp-conv-${Date.now()}` // Add placeholder conversationId
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    scrollToBottom();

    try {
      const response = await fetch('/api/ai-team-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, mode: chatMode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // API now returns TeamChatMessage[] in both modes
      const aiResponses = (await response.json()) as TeamChatMessage[];

      // Remove optimistic user message and add final one, ensuring conversationId is set
      setMessages((prev) => {
          const finalUserMsg = prev.find(msg => msg.id === optimisticUserMessage.id);
          const otherMsgs = prev.filter(msg => msg.id !== optimisticUserMessage.id);
          // Use the actual conversationId from the response if available, otherwise keep the temp one
          const finalConversationId = aiResponses[0]?.conversationId || optimisticUserMessage.conversationId;
          const finalUserMsgWithId = finalUserMsg ? { ...finalUserMsg, id: `user-${Date.now()}`, conversationId: finalConversationId } : null;
          return finalUserMsgWithId ? [...otherMsgs, finalUserMsgWithId] : otherMsgs;
      });
      // Store the conversation ID from the first response (assuming all responses in a batch share it)
      if (aiResponses.length > 0 && aiResponses[0].conversationId) {
        setCurrentConversationId(aiResponses[0].conversationId);
      }
      scrollToBottom();

      // --- Handle Response Based on Mode ---
      if (chatMode === 'insideOut') {
        // Sequentially display the initial agent responses
        let delay = 100; // Initial delay before first agent speaks
        const stepDelay = 600; // Delay between each agent speaking

        aiResponses.forEach((agentMsg, index) => {
          setTimeout(() => {
            setIsTyping(true); // Show typing indicator before adding message
            setTimeout(() => {
              setMessages((prev) => [...prev, agentMsg]);
              setIsTyping(false); // Hide typing indicator after adding
              scrollToBottom();

              // Re-enable input only after the *last* agent message is displayed
              if (index === aiResponses.length - 1) {
                setIsSending(false);
              }
            }, 400); // Simulate brief typing time
          }, delay);
          delay += stepDelay;
        });

      } else {
        // --- Standard Mode Rendering (should only be one message in aiResponses) ---
        if (aiResponses.length > 0) {
            const standardAiResponse = aiResponses[0];
            setIsTyping(true);
            const typingTime = Math.min(Math.max(standardAiResponse.text.length * 15, 500), 1500); // Adjust typing speed
            setTimeout(() => {
                setMessages((prev) => [...prev, standardAiResponse]); // Add the standard AI team response
                setIsTyping(false);
                setIsSending(false); // Re-enable input
                scrollToBottom();
            }, typingTime);
        } else {
             // Handle case where standard mode unexpectedly returns empty array
             console.warn("Standard mode returned no AI response.");
             setIsSending(false);
        }
      }
    } catch (err: any) {
      console.error("Failed to send/process message:", err);
      setError(`Failed to get AI Team response: ${err.message}`);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticUserMessage.id));
      setIsSending(false); // Re-enable input on error
      setIsTyping(false); // Ensure typing indicator stops on error
    }
    // No finally block needed as setIsSending is handled within branches
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(event.target.value);
  };

  const handleTranscript = (transcript: string) => {
    setInputMessage(transcript);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getAgentInitials = (name?: AgentName) => {
    if (!name) return "AI";
    switch (name) {
      case "Listener": return "L";
      case "Goal Setter": return "GS"; // Use 2 letters if single is ambiguous
      case "Resource Finder": return "RF";
      case "Coordinator": return "C";
      case "Joy": return "J";
      case "Sadness": return "S";
      case "Anger": return "A";
      case "Fear": return "F";
      case "Disgust": return "D";
      default:
         // Safely handle undefined or unexpected names
         return "AI"; // Fallback for unexpected cases
    }
  };

  const getAgentThemeClasses = (name?: AgentName): string => {
    // Provide a default theme if the agent name is missing or not found
    return name && AGENT_THEMES[name] ? AGENT_THEMES[name].baseClass : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
  };

  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  const isFirstMessageOfDay = (message: TeamChatMessage, index: number) => {
    if (index === 0 || message.isNewSession) return true;
    const prevDate = new Date(messages[index - 1].timestamp).setHours(0, 0, 0, 0);
    const currDate = new Date(message.timestamp).setHours(0, 0, 0, 0);
    return prevDate !== currDate;
  };

  // Moved renderAgentIcon function outside isFirstMessageOfDay
  const renderAgentIcon = (agentName?: AgentName) => {
    // Add specific emotion icons if available in AGENT_THEMES
    if (!agentName || !AGENT_THEMES[agentName]) {
        // Default icon or null if no agent name
        return <BrainCircuit size={14} className="mr-1.5 text-muted-foreground" />;
    }
    const IconComponent = AGENT_THEMES[agentName].icon;
    const themeClasses = getAgentThemeClasses(agentName);
    // Extract text color more robustly
    const textColorClass = themeClasses.split(' ').find(cls => cls.startsWith('text-')) || 'text-foreground';
    return <IconComponent size={14} className={`mr-1.5 ${textColorClass} flex-shrink-0`} />;
  };

  const startNewSession = () => {
    const newSessionMessage: TeamChatMessage = {
      id: `new-session-${Date.now()}`,
      text: "Starting a new session. How can our team assist you now?",
      sender: "ai", agentName: "Coordinator", timestamp: Date.now(), isNewSession: true, type: 'standard',
      conversationId: `new-session-conv-${Date.now()}` // Add placeholder conversationId
    };
    setMessages((prev) => [...prev, newSessionMessage]);
    setError(null);
    // Reset summary state when starting a new session
    setCurrentConversationId(null);
    setSummaryResult(null);
    setShowSummaryDialog(false);
  };

  // Function to handle requesting the summary
  const handleRequestSummary = async () => {
    if (!currentConversationId || isSummaryLoading) return;

    console.log(`Requesting summary for conversation: ${currentConversationId}`);
    setIsSummaryLoading(true);
    setError(null); // Clear previous errors
    setSummaryResult(null); // Clear previous summary

    try {
      const response = await fetch('/api/ai-team-chat/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: currentConversationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const summaryData = (await response.json()) as SummaryResult;
      setSummaryResult(summaryData);
      setShowSummaryDialog(true); // Open the dialog once data is fetched

    } catch (err: any) {
      console.error("Failed to fetch summary:", err);
      setError(`Failed to get summary: ${err.message}`);
      // Optionally show error in the dialog or as a toast
      setSummaryResult({ summary: "Error", advice: `Failed to load summary: ${err.message}` });
      setShowSummaryDialog(true); // Still show dialog but with error message
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Fix the JSX parsing issue by using a style object instead of Tailwind's square bracket notation
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height, 4rem))' }}>
      {/* Header with glass effect */}
      <header className="glass-morphism sticky top-0 z-10 h-[var(--header-height,4rem)] px-4">
        <div className="flex justify-between items-center h-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-full blur-sm" />
              <BrainCircuit className="h-6 w-6 text-primary relative" />
            </div>
            <h1 className="text-lg font-semibold gradient-text">MindMate AI Team</h1>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={startNewSession} 
                    className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all">
                    <RefreshCw size={17} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="glass-morphism">New Session</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all">
                    {isSidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="glass-morphism">
                  {isSidebarOpen ? "Hide Team Info" : "Show Team Info"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow overflow-hidden">
            {/* Tabs List */}
            <div className="px-4 pt-3">
              <TabsList className="glass-morphism p-1 rounded-lg inline-flex h-9">
                <TabsTrigger value="chat" 
                  className="px-3 py-1.5 text-sm data-[state=active]:glass-morphism data-[state=active]:shadow-sm rounded-md transition-all">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="insights"
                  className="px-3 py-1.5 text-sm data-[state=active]:glass-morphism data-[state=active]:shadow-sm rounded-md transition-all">
                  Insights
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Chat Tab Content */}
            <TabsContent value="chat" className="flex-grow flex flex-col overflow-hidden">
              <ScrollArea className="flex-grow" ref={scrollAreaRef}>
                <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
                  {/* Error Notification */}
                  <AnimatePresence>
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-morphism bg-destructive/10 border-destructive/30 text-destructive rounded-lg p-3 mb-4 flex items-center gap-3 mx-auto">
                        <Info size={16} className="flex-shrink-0" />
                        <p className="text-sm flex-grow">{error}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20" 
                          onClick={() => setError(null)}>
                          <X size={16} />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message List */}
                  <AnimatePresence initial={false}>
                    {messages.map((message, index) => (
                      <React.Fragment key={message.id}>
                        {/* Date divider */}
                        {isFirstMessageOfDay(message, index) && (
                          <motion.div 
                            layout 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="flex justify-center my-4">
                            <div className="glass-morphism px-3 py-1 rounded-full text-xs">
                              {formatMessageDate(message.timestamp)}
                            </div>
                          </motion.div>
                        )}

                        {/* User messages */}
                        {message.sender === "user" && (
                          <motion.div
                            layout 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="group flex items-start gap-2.5 justify-end">
                            <div className="flex flex-col items-end max-w-[80%]">
                              <div className="glass-morphism bg-primary/10 text-foreground rounded-lg rounded-tr-sm p-3">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                              </div>
                              <time className="text-xs text-muted-foreground/80 mt-1 mr-1">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </time>
                            </div>
                            <Avatar className="h-8 w-8 border shadow-sm flex-shrink-0">
                              <AvatarFallback className="bg-primary/10 font-semibold text-xs">You</AvatarFallback>
                            </Avatar>
                          </motion.div>
                        )}

                        {/* AI messages */}
                        {message.sender === "ai" && (
                          <motion.div
                            layout 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="group flex items-start gap-2.5 justify-start">
                            <EmotionAgentBubble
                              response={{
                                emotion: message.agentName || 'AI',
                                analysis: message.text,
                                avatar: message.avatar,
                              }}
                            />
                          </motion.div>
                        )}
                      </React.Fragment>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-2.5 pl-10">
                      <Avatar className={`h-8 w-8 border shadow-sm flex-shrink-0 ${getAgentThemeClasses('Coordinator')}`}>
                        <AvatarFallback className="text-xs font-semibold bg-transparent">AI</AvatarFallback>
                      </Avatar>
                      <div className="glass-morphism rounded-lg rounded-tl-sm p-3 flex items-center space-x-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <footer className="glass-morphism p-3 sticky bottom-0">
                {/* Mode Switch */}
                <div className="flex items-center justify-center space-x-2 mb-2 max-w-4xl mx-auto">
                  <Users className={`w-4 h-4 ${chatMode === 'insideOut' ? 'text-yellow-500' : 'text-muted-foreground/50'} transition-colors`} />
                  <Label htmlFor="inside-out-mode" className={`text-xs font-medium ${chatMode === 'insideOut' ? 'text-foreground' : 'text-muted-foreground/80'} transition-colors`}>
                    Emotion Agents Mode
                  </Label>
                  <Switch 
                    id="inside-out-mode" 
                    checked={chatMode === 'insideOut'} 
                    onCheckedChange={(checked) => setChatMode(checked ? 'insideOut' : 'standard')}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                {/* Summary Button */}
                {chatMode === 'insideOut' && currentConversationId && (
                  <div className="flex justify-center mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestSummary}
                      disabled={isSummaryLoading || !currentConversationId}
                      className="glass-morphism text-xs h-8 hover:bg-primary/10">
                      {isSummaryLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Get Session Summary
                    </Button>
                  </div>
                )}

                {/* Input Row */}
                <div className="glass-morphism flex items-center gap-2 max-w-4xl mx-auto rounded-xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 transition-all duration-200">
                  <Input 
                    type="text" 
                    placeholder={chatMode === 'insideOut' ? "Share your feelings..." : "Message the AI Team..."} 
                    value={inputMessage} 
                    onChange={handleInputChange} 
                    onKeyPress={handleKeyPress}
                    className="flex-grow border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-9 text-sm" 
                    disabled={isSending || isTyping} 
                  />
                  <div className="flex items-center gap-1">
                    <VoiceInteraction onTranscript={handleTranscript} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={handleSendMessage} 
                            disabled={isSending || isTyping || inputMessage.trim() === ""} 
                            size="icon" 
                            className="h-8 w-8 rounded-lg flex-shrink-0 bg-primary/90 hover:bg-primary transition-colors">
                            <Send size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="glass-morphism">Send Message</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </footer>
            </TabsContent>

            {/* Insights Tab Content */}
            <TabsContent value="insights" className="flex-grow glass-morphism m-4 rounded-lg">
              <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                <BarChart size={40} className="mb-4 text-primary/80" />
                <h3 className="text-lg font-medium mb-2 gradient-text">Conversation Insights</h3>
                <p className="text-sm text-muted-foreground">Analytics and summaries from your conversations will appear here.</p>
                <p className="text-xs mt-2 text-muted-foreground/80">(Feature coming soon)</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside 
              initial={{ width: 0, opacity: 0, x: 50 }} 
              animate={{ width: 300, opacity: 1, x: 0 }} 
              exit={{ width: 0, opacity: 0, x: 50 }} 
              transition={{ duration: 0.3, ease: "easeInOut" }} 
              className="glass-morphism hidden md:block overflow-y-auto">
              <div className="p-4 space-y-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gradient-text">
                  <BrainCircuit size={18} className="mr-2" /> Meet the AI Team
                </h3>
                {Object.entries(AGENT_THEMES).map(([agentName, theme]) => {
                  const IconComponent = theme.icon;
                  const agentClasses = getAgentThemeClasses(agentName as AgentName);
                  return (
                    <Card key={agentName} className="glass-morphism hover-scale">
                      <CardHeader className={`p-3 ${agentClasses} border-opacity-50`}>
                        <CardTitle className="text-sm font-medium flex items-center">
                          <IconComponent size={15} className="mr-2 flex-shrink-0" />
                          {agentName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-xs text-muted-foreground">
                        <p>{theme.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
                <Card className="glass-morphism mt-4 hover-scale">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium gradient-text">Team Collaboration</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                    <p>Our AI agents work together to provide comprehensive support.</p>
                  </CardContent>
                </Card>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Summary Dialog */}
      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent className="glass-morphism">
          <AlertDialogHeader>
            <AlertDialogTitle className="gradient-text">Conversation Summary</AlertDialogTitle>
            <AlertDialogDescription>
              Here's a summary and advice based on the recent discussion with the emotion agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {summaryResult ? (
            <div className="text-sm space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {summaryResult.summary && summaryResult.summary !== "Error" && (
                <div>
                  <h4 className="font-semibold mb-1 gradient-text">Summary:</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{summaryResult.summary}</p>
                </div>
              )}
              {summaryResult.advice && (
                <div>
                  <h4 className="font-semibold mb-1 gradient-text">Advice:</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{summaryResult.advice}</p>
                </div>
              )}
              {summaryResult.summary === "Error" && (
                <p className="text-destructive">{summaryResult.advice}</p>
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSummaryDialog(false)} className="glass-morphism">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}