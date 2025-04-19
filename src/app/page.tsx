'use client';

import React from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-center mb-8">
        Welcome to Mindful Hub!
      </h1>
      <p className="text-lg text-center text-gray-600 mb-8">
        Start your journey to a better state of mind.
      </p>
      <Button onClick={() => router.push('/chat')}>
        Chat with AI
      </Button>
    </main>
  );
}
