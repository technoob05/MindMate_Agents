'use client'; // Required for framer-motion animations

// Force this page to be dynamically rendered (not statically generated at build time)
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Temporarily removing Joyride due to compatibility issues
// import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, MessageSquare, Users, BrainCircuit, Sparkles, UserCircle, Lightbulb, Newspaper } from 'lucide-react'; // Added Sparkles, UserCircle, Lightbulb, Newspaper
import { motion } from 'framer-motion'; // Import motion

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Stagger animation for children
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function HomePage() {
  const [runTour, setRunTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Chỉ chạy một lần
    if (authChecked) return;
    setAuthChecked(true);
    
    try {
      // Kiểm tra xem người dùng đã đăng nhập chưa
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      
      if (storedUser) {
        try {
          // Phân tích dữ liệu người dùng
          const parsedUser = JSON.parse(storedUser);
          console.log('Found user:', parsedUser.email || parsedUser.id);
          
          // FIXED: Accept any user object with some meaningful data
          if (parsedUser && (parsedUser.id || parsedUser.email || parsedUser.pseudonym)) {
            // Kiểm tra xem người dùng đã hoàn thành onboarding chưa
            const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
            
            // Nếu chưa hoàn thành onboarding, chuyển hướng đến trang onboarding
            if (!hasCompletedOnboarding) {
              console.log('Home Page: User has not completed onboarding, redirecting to onboarding page');
              router.push('/onboarding');
              return;
            }
            
            setUser(parsedUser);
            setIsLoading(false);
            
            // Hiển thị tour giới thiệu nếu là lần đầu
            const hasVisited = localStorage.getItem('mindmateOnboardingComplete');
            if (!hasVisited) {
              console.log('First visit, starting onboarding tour');
              // Temporarily disabled
              // setRunTour(true);
            }
            
            // Ensure we have lastAuthTime set
            if (!localStorage.getItem('lastAuthTime')) {
              localStorage.setItem('lastAuthTime', Date.now().toString());
            }
            
            // Reset any redirect counters
            localStorage.removeItem('redirectCount');
            return;
          }
          
          // If we reach here, the user data was invalid
          console.error('Invalid user data format');
          localStorage.removeItem('user');
          router.push('/login');
        } catch (e) {
          console.error('Error parsing user data:', e);
          localStorage.removeItem('user');
          router.push('/login');
        }
      } else {
        console.log('No user found, redirecting to login');
        router.push('/login');
      }
    } catch (e) {
      console.error('Home page error:', e);
      setIsLoading(false);
    }
  }, [authChecked, router]);

  // Temporarily commented out for compatibility
  /* 
  const tourSteps: Step[] = [
    {
      target: '#welcome-header',
      content: 'Welcome to MindMate! Your AI companion for mental wellness.',
      disableBeacon: true, // Start without a beacon
      placement: 'bottom',
    },
    // ... other steps ...
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('mindmateOnboardingComplete', 'true'); // Mark onboarding as complete
    }
  };
  */

  // If we're still checking authentication or not authenticated, show loading
  if (isLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen">
      <p className="text-center text-muted-foreground">Loading homepage...</p>
    </div>;
  }

  return (
    // Removed page-specific gradient, adjusted padding
    <div className="flex flex-col items-center min-h-screen px-4 pt-16 pb-10 md:px-8 md:pt-24">
      {/* Temporarily commented out Joyride
      <Joyride
        steps={tourSteps}
        run={runTour}
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        styles={{
          options: {
            zIndex: 10000, // Ensure it's above other elements
            primaryColor: '#8B5CF6', // Example primary color (Tailwind purple-500)
            textColor: '#1F2937', // Example text color (Tailwind gray-800)
          },
          tooltip: {
            backgroundColor: '#FFFFFF', // White background
            borderRadius: '8px',
          },
          buttonNext: {
            backgroundColor: '#8B5CF6', // Match primary color
            borderRadius: '4px',
          },
          buttonBack: {
             color: '#6B7280', // Example secondary text color (Tailwind gray-500)
          },
           buttonSkip: {
             color: '#6B7280',
          }
        }}
      />
      */}

      {/* Animated Hero Section */}
      <motion.header
        className="text-center mb-16 md:mb-20 max-w-3xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        id="welcome-header" // Added ID for Joyride step 1
      >
        <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary animate-pulse" /> {/* Added icon */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-4">
          Welcome to <span className="text-primary">MindMate</span> {/* Corrected name */}
        </h1>
        <p className="text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto"> {/* Constrained width */}
          Your AI companion for mental wellness, community support, and personal growth.
        </p>
      </motion.header>

      {/* Animated Feature Cards Section */}
      <motion.main
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >

        {/* Card 1: 1-on-1 Chat */}
        <motion.div variants={itemVariants} className="flex" id="chat-card"> {/* Added ID for Joyride step 2 */}
          <Card className="flex flex-col w-full"> {/* Ensure card takes full width of motion div */}
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>1-on-1 Chat</CardTitle> {/* Use default CardTitle size */}
                <MessageSquare className="h-5 w-5 text-primary" /> {/* Slightly smaller icon */}
              </div>
              <CardDescription className="line-clamp-2"> {/* Limit height for consistent card sizing */}
                Chat privately with your AI mental health assistant. Ask questions, seek guidance, or just talk.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end"> {/* Push button to bottom */}
              <Button asChild className="w-full mt-2 group">
                <Link href="/chat">
                  Start Chatting <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* New Card: Scripted Chat Demo */}
        <motion.div variants={itemVariants} className="flex" id="script-chat-card">
          <Card className="flex flex-col w-full">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Mental Health Demo</CardTitle>
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <CardDescription className="line-clamp-2">
                Experience a guided mental health consultation with predefined conversation flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <Link href="/script-chat" passHref legacyBehavior>
                <Button variant="gradient" className="w-full mt-auto">
                  Try Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: AI Team Chat */}
        <motion.div variants={itemVariants} className="flex" id="ai-team-card"> {/* Added ID for Joyride step 3 */}
          <Card className="flex flex-col w-full">
            <CardHeader>
               <div className="flex items-center justify-between mb-2">
                 <CardTitle>AI Team Chat</CardTitle>
                 <BrainCircuit className="h-5 w-5 text-primary" /> {/* Or use Bot icon */}
               </div>
              <CardDescription>Collaborate with specialized AI agents.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-6">
                Consult with a team of AI experts specialized in different areas of mental wellness for comprehensive support.
              </p>
              <Link href="/ai-team-chat" passHref legacyBehavior>
                <Button variant="gradient" className="w-full mt-auto">
                  Talk with Team
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: Multi-User Chat */}
        <motion.div variants={itemVariants} className="flex" id="community-card"> {/* Added ID for Joyride step 4 */}
          <Card className="flex flex-col w-full">
            <CardHeader>
               <div className="flex items-center justify-between mb-2">
                 <CardTitle>Community Chat</CardTitle>
                 <Users className="h-5 w-5 text-primary" />
               </div>
              <CardDescription>Connect and share with others.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-6">
                Join moderated group discussions to share experiences, offer support, and learn together.
              </p>
              {/* Using variant="outline" */}
              <Link href="/multi-user-chat" passHref legacyBehavior>
                <Button variant="outline" className="w-full mt-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"> {/* Softer border */}
                  Join the Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 4: AI Avatar */}
        <motion.div variants={itemVariants} className="flex" id="ai-avatar-card"> {/* Added ID */}
          <Card className="flex flex-col w-full">
            <CardHeader>
               <div className="flex items-center justify-between mb-2">
                 <CardTitle>AI Avatar</CardTitle>
                 <UserCircle className="h-5 w-5 text-primary" />
               </div>
              <CardDescription>Create and interact with your AI Avatar.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-6">
                Personalize your AI companion's appearance and interact in a unique way.
              </p>
              <Link href="/ai-avatar" passHref legacyBehavior>
                <Button variant="gradient" className="w-full mt-auto">
                  Meet Your Avatar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 5: AI Explainer */}
        <motion.div variants={itemVariants} className="flex" id="ai-explainer-card"> {/* Added ID */}
          <Card className="flex flex-col w-full">
            <CardHeader>
               <div className="flex items-center justify-between mb-2">
                 <CardTitle>AI Explainer</CardTitle>
                 <Lightbulb className="h-5 w-5 text-primary" />
               </div>
              <CardDescription>Understand complex topics easily.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-6">
                Get clear, concise explanations on various subjects from your AI assistant.
              </p>
              <Link href="/ai-explainer" passHref legacyBehavior>
                <Button variant="secondary" className="w-full mt-auto">
                  Learn Something New
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 6: News */}
        <motion.div variants={itemVariants} className="flex" id="news-card"> {/* Added ID */}
          <Card className="flex flex-col w-full">
            <CardHeader>
               <div className="flex items-center justify-between mb-2">
                 <CardTitle>News Feed</CardTitle>
                 <Newspaper className="h-5 w-5 text-primary" />
               </div>
              <CardDescription>Stay updated with relevant news.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-6">
                Access curated news articles related to mental wellness and personal growth.
              </p>
              <Link href="/news" passHref legacyBehavior>
                <Button variant="outline" className="w-full mt-auto border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                  Read Latest News
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

      </motion.main>

      {/* Footer */}
      <footer className="mt-20 md:mt-24 text-center text-muted-foreground text-xs">
        © {new Date().getFullYear()} MindMate - Nurturing mental well-being, together. {/* Updated name */}
        {/* Optional: Add links to Privacy Policy, Terms of Service */}
        {/* <div className="mt-2">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="mx-2">|</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div> */}
      </footer>
    </div>
  );
}
