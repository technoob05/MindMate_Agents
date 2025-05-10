'use client';

// Force this page to be dynamically rendered (not statically generated at build time)
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we're already logged in on component mount
  useEffect(() => {
    // Reset any redirect counters
    localStorage.removeItem('redirectCount');
    console.log('Login page mounted. Pathname:', window.location.pathname + window.location.search);
    
    try {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          console.log('Login Page: User already in localStorage:', parsedUser.email || parsedUser.id);
          
          // Get redirect URL or use the home page (/) as default
          const redirectPath = searchParams.get('redirect') || '/';
          console.log('Login Page: Redirecting to (already logged in):', redirectPath);
          router.push(redirectPath);
        } catch (e) {
          console.error('Login Page: Invalid user data in storage, clearing:', e);
          localStorage.removeItem('user');
        }
      } else {
        console.log('Login Page: No user in localStorage, showing login form.');
      }
    } catch (e) {
      console.error('Login Page: Error checking localStorage:', e);
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('Login attempt with email:', email);

    // Reset redirect counter
    localStorage.removeItem('redirectCount');
    
    try {
      // Gửi yêu cầu đăng nhập đến API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.user || !data.user.id) {
        throw new Error('Invalid user data received from server');
      }

      // Lưu thông tin người dùng vào localStorage
      console.log('Storing user data in localStorage:', data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Also store authentication time to help with validation
      localStorage.setItem('lastAuthTime', Date.now().toString());
      
      // IMPROVED: More robust navigation with proper delays
      console.log('Login successful, redirecting to home page');
      
      // Add a longer delay to ensure localStorage is properly updated
      setTimeout(() => {
        // First clear any potential redirect loop counters
        localStorage.removeItem('redirectCount');
        
        try {
          // Try to navigate using Next.js router first
          router.push('/');
          
          // Fallback to direct location change after a short delay if router doesn't work
          setTimeout(() => {
            console.log('Fallback navigation to home page');
            window.location.href = '/';
          }, 500);
        } catch (e) {
          console.error('Navigation error:', e);
          // Direct fallback if router throws an error
          window.location.href = '/';
        }
      }, 300);  // Increased delay for more reliable localStorage updates
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to register page
  const goToRegister = () => {
    // Get current redirect URL if any and pass it to the register page
    const redirectParam = searchParams.get('redirect');
    const registerUrl = redirectParam ? `/register?redirect=${redirectParam}` : '/register';
    router.push(registerUrl);
  };

  return (
    // Add a main container to take the full screen height
    <main className="min-h-screen flex items-center justify-center p-4">
      {/* Animate the card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md" // Apply width constraints here
      >
        {/* Use default Card styling */}
        <Card>
          <CardHeader className="text-center space-y-2"> {/* Added space-y */}
            {/* Use standard CardTitle, adjust size */}
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">
              Welcome Back!
            </CardTitle>
            {/* Use standard CardDescription */}
            <CardDescription>
              Sign in to your MindMate account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {/* Use default Input styling */}
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email" // Add autocomplete
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                 {/* Use default Input styling */}
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password" // Add autocomplete
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p> // Use destructive color
              )}
              {/* Use gradient Button variant */}
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4 text-sm pt-4"> {/* Added padding-top */}
            <div className="w-full text-center">
              <p className="text-muted-foreground mb-2"> {/* Use muted foreground color */}
                Don't have an account?
              </p>
              <Button 
                variant="outline" 
                onClick={goToRegister} 
                className="w-full"
              >
                Register here
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
};

export default LoginPage;