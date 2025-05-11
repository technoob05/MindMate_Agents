'use client';
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
          
          // Kiểm tra xem người dùng đã hoàn thành onboarding chưa
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
          
          // Nếu chưa hoàn thành onboarding, chuyển hướng đến trang onboarding
          if (!hasCompletedOnboarding) {
            console.log('Login Page: User has not completed onboarding, redirecting to onboarding page');
            router.push('/onboarding');
            return;
          }
          
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
      console.log('Login successful, checking onboarding status');
      
      // Add a longer delay to ensure localStorage is properly updated
      setTimeout(() => {
        // First clear any potential redirect loop counters
        localStorage.removeItem('redirectCount');
        
        try {
          // Kiểm tra xem người dùng đã hoàn thành onboarding chưa
          const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
          
          // Nếu chưa hoàn thành onboarding, chuyển hướng đến trang onboarding
          if (!hasCompletedOnboarding) {
            console.log('Login successful, user has not completed onboarding, redirecting to onboarding page');
            router.push('/onboarding');
            return;
          }
          
          // Nếu đã hoàn thành onboarding, chuyển hướng về trang chủ hoặc trang được chỉ định trong tham số redirect
          console.log('Login successful, user has completed onboarding, redirecting to home page or specified redirect');
          const redirectPath = searchParams.get('redirect') || '/';
          router.push(redirectPath);
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
    // Change the main container to include the background and animations
    <main className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* CSS Animations - Gradient Orbs */}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
      <div className="gradient-orb orb-4"></div>
      
      {/* CSS Animations - Light Beams */}
      <div className="light-beam beam-1"></div>
      <div className="light-beam beam-2"></div>
      <div className="light-beam beam-3"></div>
      <div className="light-beam beam-4"></div>
      
      {/* CSS Animations - Floating Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`floating-particle particle-${i % 5}`} style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${Math.random() * 10 + 10}s`,
        }}></div>
      ))}
      
      {/* Animate the card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md z-50" // Add z-index to ensure card is above animations
      >
        {/* Update Card styling to match onboarding style */}
        <Card className="border-none shadow-xl bg-white/75 backdrop-blur-md rounded-2xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">
              Welcome Back!
            </CardTitle>
            <CardDescription>
              Sign in to your MindMate account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
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
                  className="bg-white/80 border-gray-200/70"
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
                  autoComplete="current-password"
                  className="bg-white/80 border-gray-200/70"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                type="submit"
                variant="gradient"
                className="w-full py-3 rounded-xl transition-all duration-300 hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4 text-sm pt-4">
            <div className="w-full text-center">
              <p className="text-muted-foreground mb-2">
                Don't have an account?
              </p>
              <Button 
                variant="outline" 
                onClick={goToRegister} 
                className="w-full rounded-xl border-gray-200/70 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white/90"
              >
                Register here
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
      
      {/* CSS for animations */}
      <style jsx>{`
        /* Base Animation Classes */
        .gradient-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          z-index: 1;
        }
        
        .light-beam {
          position: fixed;
          height: 80px;
          width: 100%;
          opacity: 0.15;
          z-index: 2;
          transform: rotate(-1deg);
        }
        
        .floating-particle {
          position: fixed;
          border-radius: 50%;
          width: 6px;
          height: 6px;
          z-index: 1;
          animation: float 15s ease-in-out infinite;
        }
        
        /* Orb Styles */
        .orb-1 {
          top: 10%;
          left: 10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle at center, rgba(139, 92, 246, 0.3), rgba(76, 29, 149, 0.1));
          animation: pulse 15s ease-in-out infinite alternate;
        }
        
        .orb-2 {
          top: 60%;
          right: 5%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle at center, rgba(250, 204, 21, 0.2), rgba(234, 179, 8, 0.05));
          animation: pulse 12s ease-in-out infinite alternate-reverse;
        }
        
        .orb-3 {
          bottom: 5%;
          left: 20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(236, 72, 153, 0.2), rgba(190, 24, 93, 0.05));
          animation: pulse 18s ease-in-out infinite alternate;
        }
        
        .orb-4 {
          top: 30%;
          right: 30%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.2), rgba(3, 105, 161, 0.05));
          animation: pulse 14s ease-in-out infinite alternate-reverse;
        }
        
        /* Light Beam Styles */
        .beam-1 {
          top: 15%;
          background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.2), transparent);
          animation: beam-move 20s ease-in-out infinite;
        }
        
        .beam-2 {
          top: 35%;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.25), transparent);
          animation: beam-move 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .beam-3 {
          top: 60%;
          background: linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.2), transparent);
          animation: beam-move 18s ease-in-out infinite;
          animation-delay: -10s;
        }
        
        .beam-4 {
          top: 80%;
          background: linear-gradient(90deg, transparent, rgba(76, 29, 149, 0.15), transparent);
          animation: beam-move 22s ease-in-out infinite;
          animation-delay: -15s;
        }
        
        /* Particle Colors */
        .particle-0 {
          background-color: rgba(139, 92, 246, 0.6); /* Violet */
        }
        
        .particle-1 {
          background-color: rgba(236, 72, 153, 0.6); /* Pink */
        }
        
        .particle-2 {
          background-color: rgba(14, 165, 233, 0.6); /* Sky */
        }
        
        .particle-3 {
          background-color: rgba(20, 184, 166, 0.6); /* Teal */
        }
        
        .particle-4 {
          background-color: rgba(217, 70, 239, 0.6); /* Fuchsia */
        }
        
        /* Animations */
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.2;
          }
        }
        
        @keyframes beam-move {
          0% {
            transform: translateY(-50px) rotate(-1deg);
          }
          50% {
            transform: translateY(50px) rotate(0.5deg);
          }
          100% {
            transform: translateY(-50px) rotate(-1deg);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px) translateX(20px);
            opacity: 0.7;
          }
          75% {
            transform: translateY(10px) translateX(-10px);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
        }
      `}</style>
    </main>
  );
};

export default LoginPage;