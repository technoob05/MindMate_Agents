'use client'; // Required for framer-motion animations

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
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

  const tourSteps: Step[] = [
    {
      target: '#welcome-header',
      content: 'Welcome to MindMate! Your AI companion for mental wellness.',
      disableBeacon: true, // Start without a beacon
      placement: 'bottom',
    },
    {
      target: '#chat-card',
      content: 'Start a private 1-on-1 chat with your AI assistant for personalized guidance.',
      placement: 'bottom',
    },
    {
      target: '#ai-team-card',
      content: 'Explore the AI Team Chat to collaborate with specialized AI agents for multi-faceted support.',
      placement: 'bottom',
    },
    {
      target: '#community-card',
      content: 'Join Community Chat rooms to connect, share experiences, and learn with others.',
      placement: 'bottom',
    },
    {
      target: '#ai-avatar-card',
      content: 'Create and interact with your personalized AI Avatar here.',
      placement: 'bottom',
    },
    {
      target: '#ai-explainer-card',
      content: 'Use the AI Explainer to understand complex topics simply.',
      placement: 'bottom',
    },
    {
      target: '#news-card',
      content: 'Stay updated with curated news on wellness and personal growth.',
      placement: 'bottom',
    },
    {
      target: '#theme-switcher', // Assuming you have a theme switcher with this ID in your layout
      content: 'Finally, you can switch between light and dark themes here.', // Added "Finally"
      placement: 'bottom',
    },
  ];

  useEffect(() => {
    // Start the tour only on the first visit
    const hasVisited = localStorage.getItem('mindmateOnboardingComplete');
    if (!hasVisited) {
      setRunTour(true);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('mindmateOnboardingComplete', 'true'); // Mark onboarding as complete
    }
  };


  return (
    // Removed page-specific gradient, adjusted padding
    <div className="flex flex-col items-center min-h-screen px-4 pt-16 pb-10 md:px-8 md:pt-24">
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
              <CardDescription>Private conversation with your AI assistant.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <p className="text-sm text-muted-foreground mb-6">
                Receive personalized guidance, explore thoughts, and get support in a secure, confidential space.
              </p>
              <Link href="/chat" passHref legacyBehavior>
                {/* Use gradient button for primary action */}
                <Button variant="gradient" className="w-full mt-auto">
                  Start Chatting
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
                Engage a team of AIs (Listener, Goal Setter, Resource Finder) for multi-faceted support.
              </p>
              {/* Using variant="secondary" for visual distinction */}
              <Link href="/ai-team-chat" passHref legacyBehavior>
                <Button variant="secondary" className="w-full mt-auto">
                  Explore AI Team
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
