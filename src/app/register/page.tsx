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
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { app } from '@/lib/firebase/config'; // Đảm bảo đường dẫn này đúng

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pseudonym, setPseudonym] = useState(""); // Optional pseudonym
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
    const auth = getAuth(app);

    try {
      // Sử dụng Firebase để tạo người dùng
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // (Tùy chọn) Cập nhật hồ sơ người dùng với pseudonym
      if (pseudonym && user) {
        await updateProfile(user, {
          displayName: pseudonym,
        });
      }

      console.log('Registration successful:', user);
      alert('Registration successful! Please log in.'); // Hoặc thông báo tốt hơn
      router.push('/login'); // Chuyển hướng đến trang đăng nhập

    } catch (err: any) {
      console.error('Registration failed:', err);
      // Xử lý các lỗi cụ thể của Firebase
      let errorMessage = 'An unexpected error occurred.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      // Xóa các trường mật khẩu bất kể kết quả
      setPassword('');
      setConfirmPassword('');
      // Tùy chọn xóa email/pseudonym khi có lỗi hoặc để lại để sửa
      // if (!error) { setEmail(''); setPseudonym(''); }
    }
  };

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
              Join MindMate
            </CardTitle>
            {/* Use standard CardDescription */}
            <CardDescription>
              Create your account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Reduced space-y slightly for tighter form */}
            <form onSubmit={handleRegister} className="space-y-4">
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
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pseudonym">Pseudonym (Optional)</Label>
                 {/* Use default Input styling */}
                <Input
                  id="pseudonym"
                  type="text"
                  placeholder="Your anonymous name"
                  value={pseudonym}
                  onChange={(e) => setPseudonym(e.target.value)}
                  autoComplete="username" // Or "nickname"
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
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                 {/* Use default Input styling */}
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
                <p className="text-sm text-destructive">{error}</p> // Use destructive color
              )}
              {/* Use gradient Button variant */}
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
          <CardFooter className="flex flex-col items-center space-y-2 text-sm pt-4"> {/* Added padding-top */}
            <p className="text-muted-foreground"> {/* Use muted foreground color */}
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline underline-offset-4" // Use primary color, standard underline
              >
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;