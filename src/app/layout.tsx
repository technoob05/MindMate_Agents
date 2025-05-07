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
                {children}
          </AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
