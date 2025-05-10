'use client';

// Force this page to be dynamically rendered (not statically generated at build time)
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pseudonym, setPseudonym] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Use the API route instead of Firebase
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          pseudonym: pseudonym || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      console.log('Registration successful:', data);
      alert('Registration successful! Please log in.');
      router.push('/login');

    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  // Navigate to login page
  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">
              Join MindMate
            </CardTitle>
            <CardDescription>
              Create your account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pseudonym">Pseudonym (Optional)</Label>
                <Input
                  id="pseudonym"
                  type="text"
                  placeholder="Your anonymous name"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4 text-sm pt-4">
            <div className="w-full text-center">
              <p className="text-muted-foreground mb-2">
                Already have an account?
              </p>
              <Button 
                variant="outline" 
                onClick={goToLogin} 
                className="w-full"
              >
                Sign in here
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
};

export default RegisterPage;