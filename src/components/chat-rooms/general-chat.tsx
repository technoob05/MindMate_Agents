// src/components/chat-rooms/general-chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

interface Message {
  text: string;
  sender: string;
}

const GeneralChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage) {
      setMessages([...messages, { text: newMessage, sender: 'You' }]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-background/90 backdrop-blur-sm border-b border-border/60 p-3 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-foreground">General Chat</h1>
      </div>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-2">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg shadow-sm ${message.sender === 'You' ? 'bg-primary/90 text-primary-foreground rounded-tr-none' : 'bg-card/80 border border-border/50 rounded-tl-none'}`}>
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border/60 bg-background/95 backdrop-blur-sm sticky bottom-0">
        <div className="flex items-center gap-2">
          <Input type="text" placeholder="Type your message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-grow" onKeyPress={handleKeyPress} />
          <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralChat;
