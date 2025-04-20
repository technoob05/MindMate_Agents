'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea for multi-line
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Add ScrollBar
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Add AvatarImage
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Add CardDescription
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Flag, SendHorizonal, Users, Hash, AlertCircle, Mic, Loader2, LifeBuoy, BookOpen, ShieldAlert, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import VoiceInteraction from "@/components/voice-interaction";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Import motion

// --- Constants ---
// TODO: Replace with actual user authentication later
// Fetch this from context or auth hook ideally
const CURRENT_USER_ID = `User_${Math.random().toString(36).substring(2, 7)}`;
const CURRENT_USER_NAME = CURRENT_USER_ID; // Use ID as name for now
const CURRENT_USER_AVATAR = `https://api.dicebear.com/7.x/bottts/svg?seed=${CURRENT_USER_ID}`; // Example avatar

interface MultiUserMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string; // Add avatar URL
  timestamp: number;
  roomId: string; // Make roomId mandatory for messages
  isModerated?: boolean;
  moderationAction?: string;
}

// --- Static Data (Consider moving/fetching) ---
const CHAT_ROOM_DETAILS: { [key: string]: { name: string } } = {
  general: { name: "General Chat" },
  "stress-management": { name: "Stress Management" },
  "small-wins": { name: "Small Wins" },
  advice: { name: "Seeking Advice" },
};

const EMERGENCY_CONTACTS = [
  { name: "Crisis Text Line", phone: "Text HOME to 741741", description: "24/7 Crisis Support (US/Canada)" },
  { name: "National Suicide Prevention Lifeline", phone: "988", description: "24/7 Support (US)" },
  // Add more relevant international or local contacts as needed
];

// --- Helper Function for Timestamps ---
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// --- Main Component ---
export default function MultiUserChatPage() {
  const [messages, setMessages] = useState<MultiUserMessage[]>([]); // Keep the first set
  const [inputMessage, setInputMessage] = useState(''); // Keep the first set
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const roomId = params?.roomId as string | undefined; // Ensure roomId is treated as string or undefined
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Fetch Messages for Current Room ---
  useEffect(() => {
    // Only fetch if roomId is available from params
    if (!roomId) {
        setError("Không tìm thấy phòng chat hợp lệ.");
        setIsLoadingHistory(false);
        return;
    }

    const fetchMessages = async (currentRoomId: string) => {
      setIsLoadingHistory(true);
      setError(null);
      setMessages([]); // Clear messages when loading a room
      console.log(`Fetching messages for room: ${currentRoomId}`);
      try {
        // ACTUAL API CALL:
        const response = await fetch(`/api/multi-user-chat?roomId=${currentRoomId}`);

        // --- MOCK IMPLEMENTATION (REMOVE/COMMENT OUT WHEN USING ACTUAL API) ---
        // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        // const mockMessages: MultiUserMessage[] = [];
        // if (currentRoomId === 'stress-management') {
        //      mockMessages.push({ id: 'msg1', text: 'Feeling overwhelmed today...', senderId: 'User_abc', senderName: 'Alex', timestamp: Date.now() - 60000, roomId: currentRoomId, senderAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Alex`});
        //      mockMessages.push({ id: 'msg2', text: 'Hang in there, Alex! Deep breaths.', senderId: 'User_def', senderName: 'Ben', timestamp: Date.now() - 30000, roomId: currentRoomId, senderAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Ben`});
        // } else if (currentRoomId === 'small-wins') {
        //      mockMessages.push({ id: 'msg3', text: 'Finished my workout!', senderId: 'User_ghi', senderName: 'Casey', timestamp: Date.now() - 120000, roomId: currentRoomId, senderAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Casey`});
        // }
        // const mockResponse = { ok: true, status: 200, json: async () => mockMessages };
        // const response = mockResponse; // Use mock response if uncommented
        // --- END MOCK ---

        if (!response.ok) {
          // Try to get a more specific error message if possible
          let errorMsg = `Failed to load messages (Status: ${response.status})`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (e) { /* Ignore if response body is not JSON */ }
          throw new Error(errorMsg);
        }

        const data: MultiUserMessage[] = await response.json(); // Declare data once

        // Ensure avatar and roomId are present
        const processedMessages = data.map(msg => ({
            ...msg, // Spread original message
            senderAvatar: msg.senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.senderId}`,
            roomId: msg.roomId || currentRoomId,
        }));
        setMessages(processedMessages);
      } catch (err: any) {
        console.error(`Failed to fetch messages for room ${roomId}:`, err);
        setError(`Could not load chat history. ${err.message}. Please try refreshing.`);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchMessages(roomId);

    // TODO: Implement WebSocket connection here for real-time updates
    // - Should connect/subscribe based on roomId from params
    // const ws = new WebSocket(`wss://your-websocket-url?roomId=${roomId}`);
    // ... (rest of WebSocket logic) ...
    // return () => { ws.close(); };

  }, [roomId]); // Re-run fetch/WS connection when roomId changes

  // --- Scroll to Bottom ---
  useEffect(() => {
    // Access the viewport element through the ScrollArea ref
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
    if (viewport) {
      // Scroll down smoothly only if near the bottom or initially loading
      const isScrolledToBottom = viewport.scrollHeight - viewport.scrollTop <= viewport.clientHeight + 100; // Add tolerance
      if (isScrolledToBottom || isLoadingHistory) {
         viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isLoadingHistory]); // Trigger on messages change and initial load finish

  // --- Send Message Handler ---
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = inputMessage.trim();
    if (trimmedMessage === '' || isSending || !roomId) return;

    setInputMessage('');
    setIsSending(true);
    setError(null);

    textareaRef.current?.focus();

    // Prepare message data (ensure only one declaration)
    const messageData = {
      text: trimmedMessage,
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      senderAvatar: CURRENT_USER_AVATAR,
      timestamp: Date.now(),
      roomId: roomId
    };

    // --- OPTIONAL: Optimistic Update ---
    const optimisticId = `optimistic_${Date.now()}`;
    const optimisticMessage: MultiUserMessage = { ...messageData, id: optimisticId };
    setMessages(prev => [...prev, optimisticMessage]);
    // ----------------------------------

    try {
      // MOCK API CALL (REMOVE/REPLACE)
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      const response = { ok: true, status: 201, json: async () => ({ ...messageData, id: optimisticId }) }; // Simulate success
      // END MOCK

      // const response = await fetch('/api/multi-user-chat', { // Actual API call
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(messageData),
      // });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error
        // Safely access message property
        const message = typeof errorData === 'object' && errorData !== null && 'message' in errorData
                        ? errorData.message
                        : `Failed to send (Status: ${response.status})`;
        throw new Error(message as string);
      }

      // If using WebSockets, the server broadcast handles adding the message.
      // If NOT using WebSockets OR for confirmation/replacement of optimistic update:
      if (!/* WebSocket is active */ true) { // Assume WS is active for now
          const savedMessage: MultiUserMessage = await response.json();
          // Replace optimistic message with confirmed one
          setMessages(prev => prev.map(msg => msg.id === optimisticId ? { ...savedMessage, senderAvatar: savedMessage.senderAvatar || messageData.senderAvatar } : msg));
      } else {
          // If WS is active, we might just remove the optimistic message here,
          // or wait for the WS message to replace it (depends on implementation)
          // For simplicity now, let's assume WS replaces it or confirms it quickly.
          // If optimistic UI is used, ensure the final message from WS has the correct ID.
      }

    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(`Failed to send: ${err.message}`);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      setInputMessage(trimmedMessage); // Restore input on failure
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, isSending, roomId]);

  // --- Report Message Handler ---
  const handleReportMessage = useCallback(async (messageId: string, roomId: string) => {
    // Find the message to ensure we have the correct roomId (though selectedRoomId should match)
    const messageToReport = messages.find(msg => msg.id === messageId);
    if (!messageToReport || messageToReport.roomId !== roomId) {
        console.error("Mismatch or message not found when reporting.");
        setError("Could not report message: Internal error."); // Show error to user
        return;
    }

    console.log(`Reporting message ID: ${messageId} in room ${roomId} by user ${CURRENT_USER_ID}`);
    alert(`Reporting message ${messageId} (functionality TBC)`); // Placeholder alert

    // --- TODO: Implement actual API call ---
    // try {
    //     const response = await fetch('/api/multi-user-chat/report', { /* ... */ });
    //     // ... handle response ...
    // } catch (err: any) {
    //     setError(`Failed to report: ${err.message}`);
    // }
    // -----------------------------------------

  }, [messages, roomId]);

  // --- Input Change Handler ---
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(event.target.value);
    // Auto-resize textarea (optional, requires some CSS or a library)
    // event.target.style.height = 'auto';
    // event.target.style.height = `${event.target.scrollHeight}px`;
  };

  // --- Voice Input Handler ---
  const handleTranscript = useCallback((transcript: string) => {
    setInputMessage(prev => prev + transcript); // Append transcript
    textareaRef.current?.focus();
  }, []);

  // --- Enter Key Handler ---
  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent newline
      handleSendMessage();
    }
  };

  // --- Render Loading Skeletons ---
  const renderSkeletons = () => (
    <>
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex items-start space-x-3 my-4 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          <div className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
            <Skeleton className={`h-4 w-20 mb-1 ${i % 2 === 0 ? '' : 'hidden'}`} /> {/* Sender Name */}
            <Skeleton className="h-10 w-48 rounded-lg" /> {/* Message Bubble */}
          </div>
          {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
        </div>
      ))}
    </>
  );

  // --- Render Message ---
  const renderMessage = (message: MultiUserMessage) => {
    const isCurrentUser = message.senderId === CURRENT_USER_ID;
    const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
    const bubbleClasses = isCurrentUser
      ? "bg-primary/90 text-primary-foreground rounded-tr-none" // User bubble style
      : "bg-card/80 border border-border/50 rounded-tl-none"; // Other user bubble style

    return (
      // Use motion.div for animation
      <motion.div
        key={message.id}
        layout // Enable layout animation
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`group/message flex items-start gap-2.5 my-1 ${alignment}`} // Use gap, add group
      >
        {/* Avatar (Other Users) */}
        {!isCurrentUser && (
          <Avatar className="h-7 w-7 border flex-shrink-0"> {/* Slightly smaller */}
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback className="text-xs">
              {message.senderName?.substring(0, 1) || "?"}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Content & Actions */}
        <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
          {/* Sender Name (Only for others) */}
          {!isCurrentUser && (
            <span className="text-xs text-muted-foreground mb-0.5 px-1">
              {message.senderName}
            </span>
          )}

          {/* Bubble */}
          <div className={`relative px-3 py-1.5 rounded-lg shadow-sm ${bubbleClasses}`}>
             {/* Message Actions (Report Button) */}
             {!isCurrentUser && (
                <div className="absolute -top-2 right-1 opacity-0 group-hover/message:opacity-100 focus-within/message:opacity-100 transition-opacity duration-150 z-10">
                    <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon" // Make it icon size
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleReportMessage(message.id, message.roomId)}
                                aria-label="Report message"
                            >
                                <Flag className="h-3.5 w-3.5" /> {/* Slightly smaller icon */}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                            Report message
                        </TooltipContent>
                    </Tooltip>
                </div>
             )}

            {/* Message Text */}
            <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

            {/* Timestamp & Moderation Flag */}
            <div className="flex items-center justify-end gap-1 mt-1">
               {message.moderationAction === 'flagged' && (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger>
                      <Flag className="h-3 w-3 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                      Flagged for review
                    </TooltipContent>
                  </Tooltip>
                )}
              <span className="text-[10px] text-muted-foreground/80"> {/* Smaller timestamp */}
                {formatTimestamp(message.timestamp)}
              </span>
            </div>

             {/* TTS Button */}
             <div className="absolute -bottom-5 right-1 opacity-0 group-hover/message:opacity-100 focus-within/message:opacity-100 transition-opacity duration-150">
                <VoiceInteraction textToSpeak={message.text} /> {/* Removed invalid prop */}
             </div>
          </div>
        </div>

        {/* Avatar (Current User) */}
        {isCurrentUser && (
          <Avatar className="h-7 w-7 border flex-shrink-0">
             <AvatarImage src={CURRENT_USER_AVATAR} alt="My Avatar" />
            <AvatarFallback className="text-xs bg-muted">Me</AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    );
  };


  // --- Component Return ---
  return (
    <TooltipProvider delayDuration={100}>
      {/* Use theme background implicitly */}
      <div className="flex h-[calc(100vh-var(--header-height,4rem))]">

        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow overflow-hidden">
          {/* Header - Use themed styles */}
          <header className="bg-background/90 backdrop-blur-sm border-b border-border/60 p-3 shadow-sm flex justify-between items-center sticky top-0 z-10 h-14 flex-shrink-0">
            <h1 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                {roomId ? (CHAT_ROOM_DETAILS[roomId]?.name || `Room ${roomId}`) : 'Loading...'}
            </h1>
            {/* User Info - Can be enhanced later */}
            {/* <span className="text-xs text-muted-foreground hidden sm:inline">
              Logged in as: {CURRENT_USER_NAME}
            </span> */}
          </header>

          {/* Message List - Use themed ScrollArea */}
          <ScrollArea className="flex-grow bg-background/50" ref={scrollAreaRef}>
             <div className="p-3 md:p-4 space-y-1"> {/* Reduced vertical space */}
               {isLoadingHistory ? (
                  renderSkeletons()
               ) : error && messages.length === 0 ? ( // Show error only if no messages loaded
                  <Alert variant="destructive" className="m-4">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Error Loading Messages</AlertTitle>
                     <AlertDescription>{error}</AlertDescription>
                  </Alert>
               ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10 text-sm">No messages yet. Start the conversation!</p>
               ) : (
                  <AnimatePresence initial={false}>
                     {messages.map(renderMessage)}
                  </AnimatePresence>
               )}
               {/* TODO: Add Typing Indicator Area */}
             </div>
             <ScrollBar orientation="vertical" />
          </ScrollArea>

          {/* Input Footer - Use themed styles */}
          <footer className="p-3 border-t border-border/60 bg-background/95 backdrop-blur-sm sticky bottom-0">
             {/* Error Display for Sending */}
            {error && !isLoadingHistory && (
              <Alert variant="destructive" className="mb-2 text-xs p-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-medium">Send Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                 <Button variant="ghost" size="sm" className="absolute top-1 right-1 h-auto px-1 py-0.5 text-xs" onClick={() => setError(null)}>Close</Button>
              </Alert>
            )}
            {/* Input Container - Styled like chat input */}
            <div className="flex items-end gap-2 rounded-xl border border-input bg-background/80 shadow-sm px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 focus-within:border-primary/50 transition-all duration-200 ease-in-out">
              {/* Voice Input Button */}
               <Tooltip>
                  <TooltipTrigger asChild>
                     <VoiceInteraction onTranscript={handleTranscript} /> {/* Removed invalid prop */}
                  </TooltipTrigger>
                  <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                     Voice Input
                  </TooltipContent>
               </Tooltip>

              {/* Text Input - Use themed Textarea */}
              <Textarea
                ref={textareaRef}
                placeholder="Share your thoughts respectfully..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-grow resize-none max-h-28 min-h-[24px] text-sm bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-1 self-center" // Adjusted padding/height
                rows={1}
                disabled={isSending || isLoadingHistory}
                aria-label="Chat message input"
              />

              {/* Send Button - Use themed Button */}
              <Button
                onClick={handleSendMessage}
                disabled={isSending || inputMessage.trim() === '' || isLoadingHistory}
                size="icon"
                variant="gradient" // Use gradient for send
                className="h-8 w-8 rounded-lg flex-shrink-0 self-end mb-0.5" // Align with textarea bottom
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </div>
             <p className="text-[11px] text-muted-foreground/80 mt-1.5 pl-10">Shift+Enter for newline. See <Link href="/guidelines" className="underline hover:text-primary">Community Guidelines</Link>.</p>
          </footer>
        </div>

        {/* Sidebar - Use themed styles */}
        <aside className="w-64 border-l border-border/60 bg-background/90 backdrop-blur-sm p-4 hidden lg:flex flex-col shrink-0 space-y-4 overflow-y-auto">

           {/* Back to Hub Link - Use themed Button */}
           <Button variant="outline" size="sm" asChild className="mb-2">
                <Link href="/multi-user-chat" className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-1.5"/> Back to Rooms
                </Link>
           </Button>

           {/* Community Rules Link - Use themed Card */}
           <Card className="bg-card/80 border-border/60 shadow-sm">
                <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium flex items-center"><BookOpen className="h-4 w-4 mr-2 text-muted-foreground"/> Community Rules</CardTitle>
                </CardHeader>
                <CardContent className="text-xs px-3 pb-3 text-muted-foreground">
                    Please read the <Link href="/guidelines" className="underline hover:text-primary font-medium">code of conduct</Link> before participating.
                </CardContent>
           </Card>

           {/* Emergency Support - Use themed Card */}
           <Card className="bg-card/80 border-border/60 shadow-sm">
                <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium flex items-center"><LifeBuoy className="h-4 w-4 mr-2 text-destructive"/> Emergency Support</CardTitle>
                </CardHeader>
                <CardContent className="text-xs px-3 pb-3 space-y-1.5">
                    <p className="text-muted-foreground mb-1">If you need immediate help:</p>
                    {EMERGENCY_CONTACTS.map(contact => (
                        <div key={contact.name}>
                            <span className="font-semibold text-foreground">{contact.name}:</span>{' '}
                            <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="underline hover:text-primary">{contact.phone}</a>
                            <p className="text-muted-foreground text-[11px]">{contact.description}</p>
                        </div>
                    ))}
                </CardContent>
           </Card>

            {/* Disclaimers - Use themed Card */}
           <Card className="bg-yellow-500/10 border-yellow-500/20 dark:bg-yellow-950 dark:border-yellow-800">
                <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium flex items-center text-yellow-700 dark:text-yellow-300"><ShieldAlert className="h-4 w-4 mr-2"/> Important Note</CardTitle>
                </CardHeader>
                <CardContent className="text-xs px-3 pb-3 text-yellow-600 dark:text-yellow-400 space-y-1">
                   <p>This is a peer support space, not professional therapy.</p>
                   <p>Respect privacy and confidentiality.</p>
                   <p>Content is user-generated; use discretion.</p>
                </CardContent>
           </Card>

           {/* Online Users (Placeholder) */}
           {/* <Card className="mt-auto bg-card/80 border-border/60 shadow-sm">
             <CardHeader className="p-3">
               <CardTitle className="text-sm font-medium flex items-center"><Users className="h-4 w-4 mr-2 text-muted-foreground"/> Active Now (1)</CardTitle>
             </CardHeader>
             <CardContent className="px-3 pb-3">
                 <div className="flex items-center gap-2 p-1 rounded hover:bg-muted/50">
                     <Avatar className="h-6 w-6 border">
                         <AvatarImage src={CURRENT_USER_AVATAR} />
                         <AvatarFallback className="text-xs">Me</AvatarFallback>
                     </Avatar>
                     <span className="text-xs truncate font-medium">{CURRENT_USER_NAME} (You)</span>
                 </div>
             </CardContent>
           </Card> */}
        </aside>
      </div>
    </TooltipProvider>
  );
}
