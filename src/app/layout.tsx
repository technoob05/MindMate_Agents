import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Import Inter
import "./globals.css";
import { initializeApp } from "firebase/app";
import { AppLayout } from "@/components/layout/app-layout"; // Import the new layout
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import { cn } from "@/lib/utils"; // Import cn utility

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

// Keep Geist Mono for code if needed, or remove if not used extensively
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: "MindMate", // Update title to MindMate
  description: "Your AI companion for mental wellness and support.", // Updated description slightly
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Apply Inter font variable and antialiasing */}
      <body
        className={cn(
          "font-sans antialiased", // Base font style
          inter.variable // Apply Inter font variable
          // geistMono.variable // Add mono font if kept
        )}
      >
        {/* Use props compatible with the custom ThemeProvider */}
        <ThemeProvider
          defaultTheme="light" // Revert to compatible default
          storageKey="mindmate-theme" // Keep updated storage key
        >
          {/* Wrap children with the AppLayout */}
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
