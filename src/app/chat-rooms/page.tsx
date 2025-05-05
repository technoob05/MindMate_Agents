// src/app/chat-rooms/page.tsx
import React from 'react';
import GeneralChat from '@/components/chat-rooms/general-chat';
import SeekingAdvice from '@/components/chat-rooms/seeking-advice';
import SmallWins from '@/components/chat-rooms/small-wins';
import StressManagement from '@/components/chat-rooms/stress-management';

const ChatRoomsPage = () => {
  return (
    <div>
      <h1>Chat Rooms</h1>
      <GeneralChat />
      <SeekingAdvice />
      <SmallWins />
      <StressManagement />
    </div>
  );
};

export default ChatRoomsPage;
