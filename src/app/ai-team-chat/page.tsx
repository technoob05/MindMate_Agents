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
import { Send, Mic, ChevronRight, ChevronLeft, BrainCircuit, BarChart, RefreshCw, Info, X, BookOpen, MessageSquare, Settings } from 'lucide-react';

// Define agent names as literal types
type AgentName = "Listener" | "Goal Setter" | "Resource Finder" | "Coordinator";

interface AgentTheme {
  baseClass: string; // Tailwind class for background/accents
  icon: React.ForwardRefExoticComponent<any>;
  description: string;
}

// Define theming constants for agents using theme variables
const AGENT_THEMES: Record<AgentName, AgentTheme> = {
  Listener: {
    baseClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", // Example: Use primary or specific color
    icon: MessageSquare,
    description: "Focuses on understanding your feelings and emotions.",
  },
  "Goal Setter": {
    baseClass: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20", // Example: Use secondary or specific color
    icon: BarChart,
    description: "Helps define actionable steps to achieve your goals.",
  },
  "Resource Finder": {
    baseClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20", // Example: Use accent or specific color
    icon: BookOpen,
    description: "Suggests relevant tools, resources or information.",
  },
  Coordinator: {
    baseClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", // Example: Use another color
    icon: BrainCircuit,
    description: "Manages the team's interaction and coordinates responses.",
  },
};

// Enhanced message structure
interface TeamChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  agentName?: AgentName;
  timestamp: number;
  isNewSession?: boolean; // To mark the start of a new conversation session
}

export default function AiTeamChatPage() {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for ScrollArea viewport

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Use timeout to allow DOM update before scrolling
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, [messages, isTyping]); // Scroll on new messages and typing state change

  const scrollToBottom = () => { // Re-add the function definition
    // Use timeout to allow DOM update before scrolling
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  // Fetch initial messages from the API
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ai-team-chat');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TeamChatMessage[] = await response.json();
        // Add a welcome message if history is empty
        if (data.length === 0) {
          setMessages([
            {
              id: "team-welcome-1",
              text: "Welcome to MindMate AI Team Chat! Our specialized agents are here to help. What's on your mind?", // Shortened welcome
              sender: "ai",
              agentName: "Coordinator",
              timestamp: Date.now(),
              isNewSession: true,
            },
          ]);
        } else {
          // Ensure fetched messages also trigger scroll if needed
          setMessages(data);
          setTimeout(scrollToBottom, 150); // Scroll after fetching
        }
      } catch (err: any) {
        console.error("Failed to fetch AI team messages:", err);
        setError(
          `Failed to load chat history: ${err.message}. Please try refreshing.`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const simulateTyping = (messageText: string) => {
    return new Promise((resolve) => {
      setIsTyping(true);
      // Calculate a reasonable typing delay based on message length
      const typingTime = Math.min(Math.max(messageText.length * 20, 500), 2000);
      setTimeout(() => {
        setIsTyping(false);
        resolve(true);
      }, typingTime);
    });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading) return;

    const textToSend = inputMessage;
    setInputMessage('');
    // No need to set isLoading here, handled by typing indicator
    setError(null);

    // Optimistically add user message
    const optimisticUserMessage: TeamChatMessage = {
      id: `temp-team-${crypto.randomUUID()}`,
      text: textToSend,
      sender: "user",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      // Call the AI Team Chat API endpoint
      const response = await fetch('/api/ai-team-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSend, sender: 'user' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const aiTeamResponse: TeamChatMessage = await response.json();

      // Simulate typing before showing the response
      await simulateTyping(aiTeamResponse.text);

      // Update messages state with the actual response
      setMessages((prev) => {
        const newMessages = prev.filter(
          (msg) => msg.id !== optimisticUserMessage.id
        ); // Remove optimistic message
        // Use the temporary optimistic ID as chatId is not available on TeamChatMessage
        const finalUserMessage = { ...optimisticUserMessage };
        newMessages.push(finalUserMessage);
        newMessages.push(aiTeamResponse); // Add the AI team response
        return newMessages;
      });
    } catch (err: any) {
      console.error("Failed to send message to AI team:", err);
      setError(`Failed to get AI Team response: ${err.message}`);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticUserMessage.id)
      );
    } finally {
      // setIsLoading(false); // Loading state handled by typing indicator
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(event.target.value);
  };

  // Callback function for STT
  const handleTranscript = (transcript: string) => {
    setInputMessage(transcript);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to get avatar initials based on agent name
  const getAgentInitials = (name?: AgentName) => {
    if (!name) return "AI";
    switch (name) {
      case "Listener": return "L";
      case "Goal Setter": return "G";
      case "Resource Finder": return "R";
      case "Coordinator": return "C";
      default:
        // Handle undefined name before calling substring
        const definiteName = name || '';
        return definiteName.substring(0, 1) || "AI"; // Fallback
    }
  };

  // Helper to get agent theme classes
  const getAgentThemeClasses = (name?: AgentName): string => {
    return name && AGENT_THEMES[name] ? AGENT_THEMES[name].baseClass : "bg-muted text-muted-foreground border-border";
  };

  // Helper function to format dates for message groups
  const formatMessageDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }
  };

  // Helper function to check if message is first in a day group
  const isFirstMessageOfDay = (message: TeamChatMessage, index: number) => {
    if (index === 0) return true;
    if (message.isNewSession) return true; // Treat new session as a new day visually

    const prevDate = new Date(messages[index - 1].timestamp).setHours(0, 0, 0, 0);
    const currDate = new Date(message.timestamp).setHours(0, 0, 0, 0);

    return prevDate !== currDate;
  };

  const renderAgentIcon = (agentName?: AgentName) => {
    if (!agentName || !AGENT_THEMES[agentName]) return null;
    const IconComponent = AGENT_THEMES[agentName].icon;
    // Apply text color from baseClass
    const textColorClass = getAgentThemeClasses(agentName).split(' ').find(cls => cls.startsWith('text-')) || 'text-foreground';
    return <IconComponent size={14} className={`mr-1.5 ${textColorClass}`} />;
  };

  // New chat session function
  const startNewSession = () => {
    // Add a session divider and welcome message
    const newSessionMessage: TeamChatMessage = {
      id: `new-session-${Date.now()}`,
      text: "Starting a new session. How can our team assist you now?",
      sender: "ai",
      agentName: "Coordinator",
      timestamp: Date.now(),
      isNewSession: true,
    };

    setMessages((prev) => [...prev, newSessionMessage]);
    setError(null); // Clear any previous errors
  };

  return (
    // Use theme background implicitly
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem))]">
      {/* Header - Use themed styles */}
      <header className="bg-background/90 backdrop-blur-sm border-b border-border/60 p-3 shadow-sm flex justify-between items-center sticky top-0 z-10 h-[var(--header-height,4rem)]">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            MindMate AI Team
          </h1>
        </div>

        {/* Header Actions - Use themed styles */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={startNewSession} className="h-9 w-9">
                  <RefreshCw size={17} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                New Session
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden h-9 w-9" // Only show on mobile
                >
                  {isSidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                {isSidebarOpen ? "Hide Team Info" : "Show Team Info"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Settings button can be added later if needed */}
          {/* <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings size={17} />
          </Button> */}
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow">
          {/* Tabs - Use themed styles */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow overflow-hidden">
            <div className="px-4 pt-3 border-b border-border/60">
              <TabsList className="bg-muted p-1 rounded-lg inline-flex h-9">
                <TabsTrigger value="chat" className="px-3 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md">
                  Chat
                </TabsTrigger>
                <TabsTrigger value="insights" className="px-3 py-1.5 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md">
                  Insights
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-grow flex flex-col overflow-hidden">
              {/* Scroll Area */}
              <ScrollArea className="flex-grow" ref={scrollAreaRef}>
                <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto"> {/* Adjusted spacing */}
                  {/* Error Notification - Use themed styles */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 flex items-center gap-3 mx-auto"
                      >
                        <Info size={16} className="flex-shrink-0" />
                        <p className="text-sm flex-grow">{error}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/20" onClick={() => setError(null)}>
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
                            className="flex justify-center my-4"
                          >
                            <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground shadow-sm border border-border/50">
                              {formatMessageDate(message.timestamp)}
                            </div>
                          </motion.div>
                        )}

                        {/* Message Bubble */}
                        <motion.div
                          layout // Enable layout animation
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className={`group flex items-start gap-2.5 ${ // Adjusted gap
                            message.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {/* AI Message */}
                          {message.sender === "ai" && (
                            <>
                              <Avatar className={`h-8 w-8 border shadow-sm flex-shrink-0 ${getAgentThemeClasses(message.agentName)}`}>
                                <AvatarFallback className="text-xs font-semibold bg-transparent">
                                  {getAgentInitials(message.agentName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start max-w-[80%]">
                                {/* Styled bubble */}
                                <div className="relative flex flex-col rounded-lg rounded-tl-sm bg-card/80 backdrop-blur-sm border border-border/50 p-3 shadow-sm">
                                  {message.agentName && (
                                    <div className="flex items-center mb-1.5">
                                      <Badge variant="outline" className={`text-xs font-medium flex items-center border-none rounded-md px-1.5 py-0.5 ${getAgentThemeClasses(message.agentName)}`}>
                                        {renderAgentIcon(message.agentName)}
                                        {message.agentName}
                                      </Badge>
                                    </div>
                                  )}
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">
                                    {message.text}
                                  </p>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <VoiceInteraction textToSpeak={message.text} />
                                  {/* Add other actions like copy, feedback later if needed */}
                                </div>
                              </div>
                            </>
                          )}

                          {/* User Message */}
                          {message.sender === "user" && (
                            <>
                              <div className="flex flex-col items-end max-w-[80%]">
                                {/* Styled bubble */}
                                <div className="flex flex-col rounded-lg rounded-tr-sm bg-primary/90 text-primary-foreground p-3 shadow-sm border border-primary/20">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.text}
                                  </p>
                                </div>
                                <time className="text-xs text-muted-foreground/80 mt-1 mr-1">
                                  {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: "numeric", minute: "2-digit",
                                  })}
                                </time>
                              </div>
                              <Avatar className="h-8 w-8 border shadow-sm flex-shrink-0">
                                <AvatarFallback className="bg-muted font-semibold text-xs">
                                  You
                                </AvatarFallback>
                              </Avatar>
                            </>
                          )}
                        </motion.div>
                      </React.Fragment>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-2.5"
                    >
                      <Avatar className={`h-8 w-8 border shadow-sm flex-shrink-0 ${getAgentThemeClasses('Coordinator')}`}>
                         <AvatarFallback className="text-xs font-semibold bg-transparent">
                           {getAgentInitials('Coordinator')}
                         </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-1.5 rounded-lg rounded-tl-sm bg-card/80 border border-border/50 p-3 shadow-sm">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></div>
                      </div>
                    </motion.div>
                  )}

                  {/* Loading Indicator (if needed, distinct from typing) */}
                  {/* ... */}

                  <div ref={messagesEndRef} className="h-1" /> {/* Anchor for auto-scroll */}
                </div>
              </ScrollArea>

              {/* Input Area - Use themed styles */}
              <footer className="p-3 border-t border-border/60 bg-background/95 backdrop-blur-sm sticky bottom-0">
                <div className="flex items-center gap-2 max-w-4xl mx-auto rounded-xl border border-input bg-background/80 shadow-sm px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:border-primary/50 transition-all duration-200 ease-in-out">
                  {/* Input field */}
                  <Input
                    type="text"
                    placeholder="Message the AI Team..."
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="flex-grow border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-9 text-sm"
                    disabled={isLoading || isTyping}
                  />
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <VoiceInteraction onTranscript={handleTranscript} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || isTyping || inputMessage.trim() === ""}
                            size="icon"
                            variant="gradient"
                            className="h-8 w-8 rounded-lg flex-shrink-0"
                          >
                            <Send size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                          Send Message
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </footer>
            </TabsContent>

            {/* Insights Tab Content */}
            <TabsContent value="insights" className="flex-grow bg-muted/40">
              <div className="p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <BarChart size={40} className="mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">Conversation Insights</h3>
                <p className="text-sm">Analytics and summaries from your conversations will appear here.</p>
                <p className="text-xs mt-2">(Feature coming soon)</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar for Team Info - Use themed styles */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, x: 50 }}
              animate={{ width: 300, opacity: 1, x: 0 }} // Slightly narrower
              exit={{ width: 0, opacity: 0, x: 50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-l border-border/60 bg-background/90 backdrop-blur-sm hidden md:block overflow-y-auto" // Added overflow-y-auto
            >
              <div className="p-4 space-y-4">
                <h3 className="text-base font-semibold mb-3 flex items-center text-foreground">
                  <BrainCircuit size={18} className="mr-2 text-primary" />
                  Meet the AI Team
                </h3>

                {/* Agent Cards - Use themed Card */}
                {Object.entries(AGENT_THEMES).map(([agentName, theme]) => {
                  const IconComponent = theme.icon;
                  const agentClasses = getAgentThemeClasses(agentName as AgentName);
                  const textClass = agentClasses.split(' ').find(cls => cls.startsWith('text-')) || 'text-foreground';
                  return (
                    <Card key={agentName} className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
                      <CardHeader className={`p-3 border-b ${agentClasses} border-opacity-50`}>
                        <CardTitle className={`text-sm font-medium flex items-center ${textClass}`}>
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

                {/* Collaboration Info Card - Use themed Card */}
                <Card className="mt-4 border-border/60 bg-card/80 shadow-sm">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium text-foreground">Team Collaboration</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-muted-foreground">
                    <p>Our AI agents work together to provide comprehensive support.</p>
                  </CardContent>
                  {/* <CardFooter className="p-3 pt-0">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Learn More
                    </Button>
                  </CardFooter> */}
                </Card>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
