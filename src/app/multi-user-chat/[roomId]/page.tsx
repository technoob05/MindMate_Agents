'use client';

import React from 'react';
import GeneralChat from '@/components/chat-rooms/general-chat';
import SeekingAdvice from '@/components/chat-rooms/seeking-advice';
import SmallWins from '@/components/chat-rooms/small-wins';
import StressManagement from '@/components/chat-rooms/stress-management';
import { useParams } from 'next/navigation';

export default function MultiUserChatPage() {
  const params = useParams();
  const roomId = params?.roomId as string | undefined; // Ensure roomId is treated as string or undefined

  if (!roomId) {
    return <div>Error: Room ID not found.</div>;
  }

  let chatRoomComponent;
  switch (roomId) {
    case 'general':
      chatRoomComponent = <GeneralChat />;
      break;
    case 'stress-management':
      chatRoomComponent = <StressManagement />;
      break;
    case 'small-wins':
      chatRoomComponent = <SmallWins />;
      break;
    case 'advice':
      chatRoomComponent = <SeekingAdvice />;
      break;
    default:
      chatRoomComponent = <div>Error: Invalid Room ID</div>;
  }

  return (
    <div>
      {chatRoomComponent}
    </div>
  );
}
