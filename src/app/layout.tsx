import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Import Inter
import "./globals.css";
import { initializeApp } from "firebase/app";
import { ThemeProvider } from "next-themes"; // Import ThemeProvider from next-themes
import { cn } from "@/lib/utils"; // Import cn utility
import AppLayout from "@/components/layout/app-layout";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (Keep this part)
const app = initializeApp(firebaseConfig);

// Setup Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans", // Use standard --font-sans variable
});

export const metadata: Metadata = {
  title: "MindMate Agents",
  description: "Your AI-powered mental wellness companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-radial from-background via-background/95 to-background/90`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppLayout>
            <main className="relative min-h-screen backdrop-blur-sm">
              {/* Decorative elements */}
              <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-conic from-primary/10 via-primary/5 to-primary/10 animate-slow-spin" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-conic from-secondary/10 via-secondary/5 to-secondary/10 animate-slow-spin-reverse" />
              </div>
              
              {/* Main content */}
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
