'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hash, Pin, PinOff, Users, Plus } from 'lucide-react'; // Added Plus
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion'; // Import motion

// Define the type for a room, adding an icon component
interface ChatRoom {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType; // Use React.ElementType for component type
}

// Correctly define CHAT_ROOMS data
const CHAT_ROOMS: ChatRoom[] = [
  { id: 'general', name: 'General Chat', description: 'Open discussion, daily sharing.', icon: Hash },
  { id: 'stress-management', name: 'Stress Management', description: 'Share coping strategies, find empathy.', icon: Users },
  { id: 'small-wins', name: 'Small Wins', description: 'Celebrate small achievements together.', icon: Hash },
  { id: 'advice', name: 'Seeking Advice', description: 'Ask for and share non-professional experiences.', icon: Hash },
];

// Define the type for a room, adding an icon component (This was duplicated, removing)
interface ChatRoom {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType; // Use React.ElementType for component type
}

const STORAGE_KEY = 'pinnedCommunityRooms';

export default function CommunityHubPage() {
  const [pinnedRooms, setPinnedRooms] = useState<Set<string>>(new Set());

  // Load pinned rooms from local storage on mount
  useEffect(() => {
    const storedPins = localStorage.getItem(STORAGE_KEY);
    if (storedPins) {
      try {
        const parsedPins = JSON.parse(storedPins);
        if (Array.isArray(parsedPins)) {
          setPinnedRooms(new Set(parsedPins));
        }
      } catch (e) {
        console.error("Failed to parse pinned rooms from localStorage", e);
        localStorage.removeItem(STORAGE_KEY); // Clear invalid data
      }
    }
  }, []);

  // Update local storage when pinned rooms change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(pinnedRooms)));
  }, [pinnedRooms]);

  const togglePin = (roomId: string) => {
    setPinnedRooms(prev => {
      const newPins = new Set(prev);
      if (newPins.has(roomId)) {
        newPins.delete(roomId);
      } else {
        newPins.add(roomId);
      }
      return newPins;
    });
  };

  // Sort rooms: pinned first, then alphabetically
  const sortedRooms = [...CHAT_ROOMS].sort((a, b) => {
    const aIsPinned = pinnedRooms.has(a.id);
    const bIsPinned = pinnedRooms.has(b.id);
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return a.name.localeCompare(b.name); // Alphabetical for same pin status
  });

  return (
    <TooltipProvider delayDuration={100}>
      {/* Use theme background implicitly, adjust padding */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            MindMate Community
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover chat rooms, connect, and share experiences.
          </p>
        </header>

        {/* Responsive Grid for Room Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sortedRooms.map((room) => {
            const isPinned = pinnedRooms.has(room.id);
            const RoomIcon = room.icon;

            return (
              // Wrap Card in motion.div for animation
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex" // Ensure motion div takes flex context
              >
                {/* Use themed Card */}
                <Card className={`flex flex-col w-full transition-all duration-200 ease-in-out ${isPinned ? 'border-primary/60 border-2 shadow-lg' : 'shadow-md'}`}>
                  <CardHeader className="flex flex-row items-start gap-3 pb-3"> {/* Use gap instead of space-x */}
                    <RoomIcon className="h-5 w-5 text-primary mt-1 flex-shrink-0" /> {/* Use primary color */}
                    <div className="flex-grow">
                      <CardTitle className="text-base font-semibold">{room.name}</CardTitle> {/* Adjusted size */}
                    </div>
                    {/* Pin Button - Use themed Button and Tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 rounded-full flex-shrink-0 ${isPinned ? 'text-primary hover:text-primary/80 hover:bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                          onClick={(e) => {
                              e.preventDefault();
                              togglePin(room.id);
                          }}
                          aria-label={isPinned ? 'Unpin Room' : 'Pin Room'}
                        >
                          {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                        {isPinned ? 'Unpin Room' : 'Pin Room'}
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0 pb-4"> {/* Adjusted padding */}
                    <CardDescription className="text-sm">{room.description}</CardDescription>
                    {/* Placeholder for online users count */}
                    {/* <p className="text-xs text-muted-foreground mt-2 flex items-center">
                      <Users className="h-3 w-3 mr-1" /> 5 Active
                    </p> */}
                  </CardContent>
                  <CardFooter className="pt-0"> {/* Removed top padding */}
                    {/* Use themed Button */}
                    <Button asChild variant="gradient" size="sm" className="w-full">
                      <Link href={`/multi-user-chat/${room.id}`}>Join Room</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}

          {/* Placeholder for "Create Community" - Use themed Card and Button */}
          {/*
          <Card className="flex flex-col items-center justify-center border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle>Tạo Cộng đồng Mới</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Bắt đầu
              </Button>
            </CardContent>
            <CardFooter>
              <CardDescription>Chia sẻ chủ đề của riêng bạn.</CardDescription>
            </CardFooter>
          </Card>
          */}
        </div>
      </div>
    </TooltipProvider>
  );
}
