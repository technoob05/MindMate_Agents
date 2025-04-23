'use client';
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
import { motion } from "framer-motion"; // Import motion
import { getAuth, signInWithEmailAndPassword } from "firebase/auth"; // Import Firebase Auth functions
import { app } from '@/lib/firebase/config'; // Đảm bảo đường dẫn này đúng

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear previous errors
    const auth = getAuth(app); // Get Firebase Auth instance

    try {
      // Sử dụng Firebase để đăng nhập
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Login successful
      console.log('Login successful:', user);
      // TODO: Implement proper session management if needed beyond Firebase's handling
      router.push('/'); // Redirect to the home/root page on successful login

    } catch (err: any) {
      // console.error('Login failed:', err); // Commented out to prevent console logging
      // Xử lý các lỗi cụ thể của Firebase
      let errorMessage = 'An unexpected error occurred.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setPassword(''); // Clear password field on error
    } finally {
      setLoading(false);
    }
  };

  // ... Rest of the component remains the same ...

  return (
    // Use flex container, remove custom background, adjust padding
    <div className="flex items-center justify-center min-h-screen p-4">
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
          <CardFooter className="flex flex-col items-center space-y-2 text-sm pt-4"> {/* Added padding-top */}
            <p className="text-muted-foreground"> {/* Use muted foreground color */}
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline underline-offset-4" // Use primary color, standard underline
              >
                Register here
              </Link>
            </p>
            {/* Optional: Add anonymous/pseudonym login later if needed */}
            {/*
           <p className="text-gray-500 dark:text-gray-500">or</p>
           <Button variant="outline" className="w-full" onClick={() => alert('Anonymous login TBD')}>
             Continue Anonymously
           </Button>
           */}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;