'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Send, Mic, X, RefreshCw, MoreVertical, Clock, Paperclip, ThumbsUp, ThumbsDown, Share2, Bookmark, Sparkles, FileText, XCircle } from 'lucide-react'; // Added FileText, XCircle
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import VoiceInteraction from "@/components/voice-interaction";
import { motion, AnimatePresence } from "framer-motion"; // Import motion

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  chatId?: string;
  feedback?: 'like' | 'dislike' | null;
  saved?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeechListening, setIsSpeechListening] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingEffect, setTypingEffect] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messageUpdate, setMessageUpdate] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State for selected file
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  // Scroll to bottom effect
  useEffect(() => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, [messages, typingEffect]); // Trigger scroll on new messages and typing effect completion

   // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/chat/messages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Message[] = await response.json();
        setMessages(data);
        
        // Show empty state if no messages
        setShowEmptyState(data.length === 0);
      } catch (err: any) {
        console.error("Failed to fetch messages:", err);
        setError(`Failed to load chat history: ${err.message}`);
        setShowEmptyState(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [messageUpdate]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    // Allow sending only a file without text
    if (textToSend.trim() === '' && !selectedFile || isLoading) return;

    setInputMessage(''); // Clear input
    const fileToSend = selectedFile; // Capture file before clearing
    setSelectedFile(null); // Clear selected file state
    setIsLoading(true);
    setError(null);
    setShowEmptyState(false);

    // Optimistically add user message to UI
    // Include file name in optimistic message if present
    let optimisticText = textToSend;
    if (fileToSend) {
      optimisticText += `\n[Attached: ${fileToSend.name}]`;
    }
    const optimisticUserMessage: Message = {
      id: `temp-${crypto.randomUUID()}`,
      text: optimisticText.trim(), // Trim in case only file was sent
      sender: "user",
      timestamp: Date.now(),
    };
    setMessages((prevMessages) => [...prevMessages, optimisticUserMessage]);

    // Prepare FormData
    const formData = new FormData();
    formData.append('text', textToSend);
    formData.append('sender', 'user');
    if (fileToSend) {
      formData.append('file', fileToSend);
    }

    try {
      // Send FormData instead of JSON
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        // No 'Content-Type' header needed for FormData, browser sets it
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const aiMessage: Message = await response.json();

      // Replace optimistic user message and add AI message with typing effect
      setMessages((prevMessages) => {
        const newMessages = prevMessages.filter(
          (msg) => msg.id !== optimisticUserMessage.id
        );
        // Ensure the final user message has the correct ID if available from AI response context
        const finalUserMessage = {
          ...optimisticUserMessage,
          id: aiMessage.chatId || optimisticUserMessage.id,
        };
        newMessages.push(finalUserMessage);

        // Add AI message with empty text initially
        newMessages.push({
          ...aiMessage,
          text: "", // Start with empty text for typing effect
        });

        return newMessages;
      });

      // Simulate typing effect for the *last* message if it's AI
      setTypingEffect(true);
      let currentIndex = 0;
      const intervalId = setInterval(() => {
        setMessages((prevMessages) => {
          const lastMessageIndex = prevMessages.length - 1;
          if (lastMessageIndex < 0 || prevMessages[lastMessageIndex].sender !== 'ai') {
             clearInterval(intervalId);
             setTypingEffect(false);
             return prevMessages;
          }

          const currentAiMessageText = aiMessage.text; // Use full text from response
          const newMessages = [...prevMessages];

          if (currentIndex <= currentAiMessageText.length) {
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              text: currentAiMessageText.substring(0, currentIndex),
            };
            currentIndex += 1 + Math.floor(Math.random() * 2); // Adjusted speed
            return newMessages;
          } else {
            // Ensure the full message text is set at the end
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              text: currentAiMessageText,
            };
            clearInterval(intervalId);
            setTypingEffect(false);
            return newMessages;
          }
        });
      }, 30); // Slightly slower interval

    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(`Failed to get AI response: ${err.message}`);
      // Remove the optimistic message on error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== optimisticUserMessage.id)
      );
    } finally {
      // Ensure loading is set to false even if typing effect is interrupted
      setIsLoading(false);
      setMessageUpdate(prev => prev + 1);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(event.target.value);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input value
    }
  };

  // Removed handleTranscript - handled by VoiceInteraction component directly

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Removed toggleSpeechRecognition - handled by VoiceInteraction component

  const handleFeedback = (messageId: string, type: "like" | "dislike") => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: msg.feedback === type ? null : type }
          : msg
      )
    );
    // Here you would also send this feedback to your API
    console.log(`Feedback for ${messageId}: ${type}`);
  };

  const toggleSaveMessage = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, saved: !msg.saved } : msg
      )
    );
    // Here you would also send this to your API
    console.log(`Toggled save for ${messageId}`);
  };

  const clearChat = async () => {
     // Add confirmation dialog later if needed
     setMessages([]);
     setShowEmptyState(true);
     setError(null);
     // Here you would also call an API endpoint to clear the chat
     console.log("Clearing chat...");
     // Example API call (replace with actual endpoint)
     // try {
     //   await fetch('/api/chat/clear', { method: 'POST' });
     // } catch (err) {
     //   console.error("Failed to clear chat on server:", err);
     //   setError("Failed to clear chat history.");
     // }
   };

  const suggestedPrompts = [
    "How can mindfulness help with anxiety?",
    "What are some quick stress relief techniques?",
    "Can you suggest a morning meditation routine?",
    "How do I start practicing self-compassion?"
  ];

  return (
    // Use theme background implicitly from layout
    <div className="flex flex-col h-[calc(100vh-var(--header-height,4rem))]"> {/* Adjust height based on actual header */}
      {/* Header */}
      <header className="bg-background/90 backdrop-blur-sm border-b border-border/60 p-3 shadow-sm flex justify-between items-center sticky top-0 z-10 h-[var(--header-height,4rem)]">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border shadow-sm"> {/* Slightly smaller avatar */}
            <AvatarImage src="/mindmate-logo.png" alt="Mindmate AI" /> {/* Add actual logo */}
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
              MM
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-foreground">MindMate</h1> {/* Updated name */}
            <div className="flex items-center gap-1.5"> {/* Increased gap */}
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> {/* Added pulse */}
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1"> {/* Reduced gap */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Use updated Button style */}
                <Button variant="ghost" size="icon" onClick={clearChat} className="h-9 w-9">
                  <RefreshCw size={17} /> {/* Slightly smaller icon */}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                New Conversation
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical size={17} />
              </Button>
            </DropdownMenuTrigger>
             {/* Use updated Dropdown style */}
            <DropdownMenuContent align="end" className="bg-background/90 backdrop-blur-sm border-border/50 shadow-lg rounded-md w-56">
              <DropdownMenuItem className="focus:bg-accent/50 cursor-pointer mx-1 rounded px-2 py-1.5 text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Conversation History</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-accent/50 cursor-pointer mx-1 rounded px-2 py-1.5 text-sm">
                <Share2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Share Conversation</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearChat} className="focus:bg-accent/50 cursor-pointer mx-1 rounded px-2 py-1.5 text-sm">
                <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Clear Chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main chat area */}
      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto"> {/* Increased max-width */}
          {/* Error notification */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 mb-4 flex items-center gap-3 mx-auto"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm flex-grow">{error}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/20" onClick={() => setError(null)}>
                  <X size={16} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          <AnimatePresence>
            {showEmptyState && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                  className="bg-primary/10 p-5 rounded-full mb-6 shadow-inner"
                >
                  <Sparkles className="h-10 w-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-semibold mb-3 text-foreground">Welcome to MindMate</h2>
                <p className="text-muted-foreground max-w-md mb-8 text-base">
                  Your AI companion for mental wellness. How can I help you today?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestedPrompts.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      {/* Use updated Button style */}
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3 px-4 text-sm hover:bg-accent/70 hover:border-primary/30"
                        onClick={() => handleSendMessage(prompt)} // Send message directly on click
                      >
                        <span>{prompt}</span>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator for initial load */}
          {isLoading && messages.length === 0 && !error && (
            <div className="flex flex-col gap-4 max-w-4xl mx-auto pt-10">
              {/* Simplified skeleton */}
              <div className="flex items-start gap-3 animate-pulse">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-56" />
                </div>
              </div>
              <div className="flex items-start gap-3 justify-end animate-pulse">
                <div className="flex flex-col gap-2 items-end">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-40" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          )}

          {/* Message list */}
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout // Enable layout animation
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`group flex items-start gap-3 ${ // Reduced gap
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* AI message */}
                {message.sender === "ai" && (
                  <>
                    <Avatar className="h-9 w-9 border shadow-sm flex-shrink-0"> {/* Smaller avatar */}
                      <AvatarImage src="/mindmate-logo.png" alt="Mindmate AI" />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        MM
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start max-w-[85%]"> {/* Increased max-width slightly */}
                      {/* Styled bubble */}
                      <div className="relative flex flex-col rounded-xl rounded-tl-sm bg-card/80 backdrop-blur-sm border border-border/50 p-3 shadow-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground">
                          {message.text}
                          {/* Blinking cursor for typing effect */}
                          {typingEffect &&
                            messages[messages.length - 1].id === message.id && (
                              <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse"></span>
                            )}
                        </p>
                      </div>
                      {/* Actions on hover */}
                      <div className="flex items-center mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-0.5 mr-2"> {/* Reduced gap */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  onClick={() => handleFeedback(message.id, "like")}
                                >
                                  <ThumbsUp size={14} className={message.feedback === 'like' ? 'text-primary fill-primary/50' : ''} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">Like</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleFeedback(message.id, "dislike")}
                                >
                                  <ThumbsDown size={14} className={message.feedback === 'dislike' ? 'text-destructive fill-destructive/50' : ''} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">Dislike</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-0.5">
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                   onClick={() => toggleSaveMessage(message.id)}
                                 >
                                   <Bookmark size={14} className={message.saved ? 'text-primary fill-primary/50' : ''} />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent side="bottom" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">{message.saved ? 'Unsave' : 'Save'}</TooltipContent>
                             </Tooltip>
                             {/* Removed invalid buttonSize prop */}
                             <VoiceInteraction textToSpeak={message.text} />
                             <Dialog>
                               <Tooltip>
                                 <TooltipTrigger asChild>
                                   <DialogTrigger asChild>
                                     <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                       <Share2 size={14} />
                                     </Button>
                                   </DialogTrigger>
                                 </TooltipTrigger>
                                 <TooltipContent side="bottom" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">Share</TooltipContent>
                               </Tooltip>
                               <DialogContent>
                                 <DialogHeader>
                                   <DialogTitle>Share this message</DialogTitle>
                                   <DialogDescription>
                                     Copy this message or share it with someone.
                                   </DialogDescription>
                                 </DialogHeader>
                                 <div className="bg-muted p-4 rounded-md text-sm my-4 max-h-60 overflow-y-auto">
                                   {message.text}
                                 </div>
                                 <Button variant="gradient" className="w-full" onClick={() => navigator.clipboard.writeText(message.text)}>Copy to clipboard</Button>
                               </DialogContent>
                             </Dialog>
                           </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* User message */}
                {message.sender === "user" && (
                  <>
                    <div className="flex flex-col items-end max-w-[85%]">
                      {/* Styled bubble */}
                      <div className="flex flex-col rounded-xl rounded-tr-sm bg-primary/90 text-primary-foreground p-3 shadow-sm border border-primary/20">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </p>
                      </div>
                      <time className="text-xs text-muted-foreground/80 mt-1 mr-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <Avatar className="h-9 w-9 border shadow-sm flex-shrink-0"> {/* Smaller avatar */}
                      {/* Add user avatar image if available */}
                      <AvatarFallback className="bg-muted font-semibold">
                        You
                      </AvatarFallback>
                    </Avatar>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'user' && !typingEffect && (
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
             >
               <Avatar className="h-9 w-9 border shadow-sm flex-shrink-0">
                 <AvatarImage src="/mindmate-logo.png" alt="Mindmate AI" />
                 <AvatarFallback className="bg-primary/20 text-primary font-semibold">MM</AvatarFallback>
               </Avatar>
               {/* Loading dots */}
               <div className="flex items-center space-x-1.5 rounded-xl rounded-tl-sm bg-card/80 border border-border/50 p-3 shadow-sm">
                 <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></div>
               </div>
             </motion.div>
          )}

          {/* This div is to help with scrolling to the bottom */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </ScrollArea>

      {/* Message input area */}
      <footer className="p-3 border-t border-border/60 bg-background/95 backdrop-blur-sm sticky bottom-0">
        {/* Selected file display */}
        {selectedFile && (
          <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between bg-muted/50 border border-border/30 rounded-lg px-3 py-1.5 text-sm">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={16} className="text-muted-foreground flex-shrink-0" />
              <span className="text-foreground truncate" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <span className="text-muted-foreground text-xs flex-shrink-0">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
              onClick={removeSelectedFile}
              aria-label="Remove attached file"
            >
              <XCircle size={16} />
            </Button>
          </div>
        )}

        {/* Styled input container */}
        <div className="flex items-center gap-2 max-w-4xl mx-auto rounded-xl border border-input bg-background/80 shadow-sm px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:border-primary/50 transition-all duration-200 ease-in-out">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            // Add accept attribute if you want to limit file types
            // accept=".pdf,.doc,.docx,.txt"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  aria-label="Attach file"
                  onClick={triggerFileInput} // Trigger file input click
                >
                  <Paperclip size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">Attach File</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Input field with minimal styling */}
          <Input
            type="text"
            placeholder="Send a message..." // Updated placeholder
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-grow border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-9 text-sm" // Adjusted padding/height
            disabled={isLoading && !typingEffect} // Disable only when AI is truly busy
          />

          <div className="flex items-center gap-1">
             {/* Removed invalid buttonSize prop */}
             <VoiceInteraction
               onTranscript={(t) => setInputMessage(t)} // Update input on transcript
             />

            {/* Send Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => handleSendMessage()}
                    // Disable if loading OR (input empty AND no file selected)
                    disabled={ (isLoading && !typingEffect) || (inputMessage.trim() === '' && !selectedFile)}
                    size="icon"
                    variant="gradient" // Use gradient for send
                    className="h-8 w-8 rounded-lg flex-shrink-0" // Adjusted size/rounding
                  >
                    <Send size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">Send Message</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex justify-center mt-2 px-4">
          <p className="text-xs text-muted-foreground/80 text-center">
            MindMate is an AI assistant. Please consult a professional for medical or therapeutic advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
