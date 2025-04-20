'use client'; // Required for framer-motion animations

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, MessageSquare, Users, BrainCircuit, Sparkles } from 'lucide-react'; // Added Sparkles
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
  return (
    // Removed page-specific gradient, adjusted padding
    <div className="flex flex-col items-center min-h-screen px-4 pt-16 pb-10 md:px-8 md:pt-24">

      {/* Animated Hero Section */}
      <motion.header
        className="text-center mb-16 md:mb-20 max-w-3xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
        <motion.div variants={itemVariants} className="flex"> {/* Wrap Card in motion.div and add flex */}
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
        <motion.div variants={itemVariants} className="flex">
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
        <motion.div variants={itemVariants} className="flex">
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
