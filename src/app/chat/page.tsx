'use client';
import React, {useState, useEffect, useRef} from 'react';
import {useAuthState} from 'react-firebase-hooks/auth';
import {getAuth, signOut} from 'firebase/auth';
import {useRouter} from 'next/navigation';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {ScrollArea} from '@/components/ui/scroll-area';
import {chatWithAi} from '@/ai/flows/chat-with-ai'; // Import the Genkit flow

const ChatPage = () => {
  const [user] = useAuthState(getAuth());
  const router = useRouter();
  const [messages, setMessages] = useState<
    {sender: string; text: string}[]
  >([]);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    // Scroll to the bottom of the chat on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    // Display user message immediately
    setMessages([...messages, {sender: 'user', text: newMessage }]);
    const userMessage = newMessage;
    setNewMessage('');

    // Call Genkit flow for AI response
    try {
      const aiResponse = await chatWithAi({ message: userMessage });
      setMessages(prevMessages => [...prevMessages, { sender: 'AI', text: aiResponse.response }]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      // Display an error message to the user if the AI call fails
      setMessages(prevMessages => [...prevMessages, { sender: 'AI', text: 'Sorry, I am having trouble connecting. Please try again later.' }]);
    }
  };

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-secondary p-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">1-1 Chat with AI</h1>
        <Button variant="outline" size="sm" onClick={() => signOut(getAuth())}>
          Sign Out
        </Button>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div ref={chatContainerRef} className="flex flex-col space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start space-x-2 ${
                msg.sender === 'user' ? 'self-end' : 'self-start'
              }`}
            >
              <Avatar>
                <AvatarImage src="https://picsum.photos/50/50" alt={msg.sender} />
                <AvatarFallback>{msg.sender.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm text-muted-foreground">{msg.sender}</div>
                <div className="rounded-md p-2 bg-muted">{msg.text}</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 bg-secondary/50">
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
