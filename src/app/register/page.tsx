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
      
      // Ensure onboarding flag is NOT set, so user will be directed to onboarding after first login
      localStorage.removeItem('onboardingCompleted');
      
      // Show success message mentioning the onboarding process
      alert('Registration successful! Please log in to complete your personalized onboarding.');
      
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
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md z-50"
      >
        <Card className="border-none shadow-xl bg-white/75 backdrop-blur-md rounded-2xl">
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
                  className="bg-white/80 border-gray-200/70"
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
                  autoComplete="new-password"
                  className="bg-white/80 border-gray-200/70"
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
                className="w-full rounded-xl border-gray-200/70 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white/90"
              >
                Sign in here
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              After registration, you'll complete a short questionnaire to personalize your experience.
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

export default RegisterPage;