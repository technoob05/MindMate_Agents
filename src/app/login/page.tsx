'use client';
import React, {useEffect} from 'react';
import {getAuth, signInAnonymously} from 'firebase/auth';
import {useAuthState} from 'react-firebase-hooks/auth';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';

const LoginPage = () => {
  const auth = getAuth();
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/chat');
    }
  }, [user, router]);

  const signIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error: any) {
      alert('Error signing in:' + error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Login to Mindful Hub</h1>
      <Button onClick={signIn}>Sign In Anonymously</Button>
    </div>
  );
};

export default LoginPage;
