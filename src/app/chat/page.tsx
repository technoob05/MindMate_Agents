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
import {initializeApp, getApps} from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const CHAT_STORAGE_KEY = 'mindful_hub_chat_messages';

const ChatPage = () => {
  // Initialize Firebase if it hasn't been already
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    return (
      <div>
        <p>
          Please set the <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> environment
          variable.
        </p>
        <p>
          See the{' '}
          <a href="https://firebase.google.com/docs/web/setup" target="_blank">
            Firebase documentation
          </a>{' '}
          for more information.
        </p>
      </div>
    );
  }

  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }

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
    // Load messages from local storage on component mount
    const storedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

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
    const updatedMessages = [...messages, {sender: 'user', text: newMessage }];
    setMessages(updatedMessages);
    // Save messages to local storage
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages));

    const userMessage = newMessage;
    setNewMessage('');

    // Call Genkit flow for AI response
    try {
      const aiResponse = await chatWithAi({message: userMessage});
      const aiMessage = {sender: 'AI', text: aiResponse.response};
      const updatedMessagesWithAI = [...updatedMessages, aiMessage];
      setMessages(updatedMessagesWithAI);
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(updatedMessagesWithAI)
      );
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Display an error message to the user if the AI call fails
      const aiErrorMessage = {
        sender: 'AI',
        text: 'Sorry, I am having trouble connecting. Please try again later.',
      };
      const updatedMessagesWithError = [...updatedMessages, aiErrorMessage];
      setMessages(updatedMessagesWithError);
      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(updatedMessagesWithError)
      );
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
            onChange={e => setNewMessage(e.target.value)}
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
