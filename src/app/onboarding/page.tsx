'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';

// Define question groups
const questionGroups = [
  { id: 'personal', name: 'Personal Information' },
  { id: 'preferences', name: 'Preferences' },
  { id: 'goals', name: 'Goals' },
  { id: 'habits', name: 'Habits' },
  { id: 'history', name: 'History' },
  { id: 'therapy', name: 'Therapy' },
  { id: 'content', name: 'Content' },
  { id: 'final', name: 'Final' }
];

// Define the questionnaire steps
const steps = [
  {
    id: 'country',
    groupId: 'personal',
    title: 'Which country are you in?',
    description: 'This helps us personalize your experience.',
    options: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Vietnam', 'Other'],
  },
  {
    id: 'gender',
    groupId: 'personal',
    title: 'What is your gender identity?',
    description: 'Gender plays an important role in shaping personal identity and experiences. This information will help create a more personalized approach.',
    options: ['Woman', 'Man', 'Non-binary', 'Prefer not to say', 'Other'],
  },
  {
    id: 'age',
    groupId: 'personal',
    title: 'How old are you?',
    description: 'Your age helps us understand your needs better.',
    ageGroups: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
    didYouKnow: 'Almost a fifth of older adults in the United States have experienced depression. (Geriatric Mental Health Foundation, 2008)',
  },
  {
    id: 'goals',
    groupId: 'goals',
    title: 'What are your main goals for using MindMate?',
    description: 'This helps us tailor your experience.',
    options: ['Manage anxiety', 'Improve sleep', 'Deal with depression', 'Work on relationships', 'Career growth', 'Other'],
    multiSelect: true,
  },
  {
    id: 'preferences',
    groupId: 'content',
    title: 'What type of content do you prefer?',
    description: "We'll show you more of what you like.",
    options: ['Articles', 'Videos', 'Interactive exercises', 'Guided meditations', 'Journaling prompts'],
    multiSelect: true,
  },
];

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const router = useRouter();

  // Check if this is first login
  useEffect(() => {
    const user = localStorage.getItem('user');
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    if (!user) {
      // No user logged in, redirect to login
      router.push('/login');
      return;
    }

    if (hasCompletedOnboarding === 'true') {
      // User has already completed onboarding, redirect to home
      router.push('/');
    } else {
      setIsFirstLogin(true);
    }
  }, [router]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelect = (value: string) => {
    const step = steps[currentStep];
    if (step.multiSelect) {
      // For multi-select questions
      setAnswers(prev => {
        const currentValues = prev[step.id] || [];
        if (currentValues.includes(value)) {
          return {
            ...prev,
            [step.id]: currentValues.filter((item: string) => item !== value)
          };
        } else {
          return {
            ...prev,
            [step.id]: [...currentValues, value]
          };
        }
      });
    } else {
      // For single-select questions
      setAnswers(prev => ({
        ...prev,
        [step.id]: value
      }));
      
      // Auto-proceed to next question for single-select
      if (currentStep < steps.length - 1) {
        setTimeout(() => setCurrentStep(currentStep + 1), 300);
      }
    }
  };

  const isOptionSelected = (value: string) => {
    const step = steps[currentStep];
    if (step.multiSelect) {
      const currentValues = answers[step.id] || [];
      return currentValues.includes(value);
    } else {
      return answers[step.id] === value;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Store onboarding answers (would be sent to graph database in full implementation)
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      
      if (userData && userData.id) {
        // Simulate API call to store onboarding data
        console.log('Onboarding answers:', {
          userId: userData.id,
          answers
        });
        
        // Store onboarding data to server (in a real implementation)
        try {
          const response = await fetch('/api/onboarding/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userData.id,
              answers
            }),
          });
          
          if (!response.ok) {
            console.warn('Failed to save onboarding data to server, but continuing...');
          }
        } catch (error) {
          console.warn('Error saving onboarding data to server, but continuing...', error);
        }
        
        // Mark onboarding as completed in both localStorage and cookies
        localStorage.setItem('onboardingCompleted', 'true');
        Cookies.set('onboardingCompleted', 'true', { expires: 365 }); // Expires in 1 year
        
        // Redirect to home page
        router.push('/');
      } else {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentGroupId = step.groupId;

  // Find current group index for the progress indicator
  const currentGroupIndex = questionGroups.findIndex(group => group.id === currentGroupId);

  if (!isFirstLogin) {
    return null; // Don't render until we've checked login status
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      {/* Progress indicators - horizontal segments */}
      <div className="fixed top-16 left-0 right-0 flex justify-center">
        <div className="flex space-x-1">
          {questionGroups.map((group, index) => (
            <div 
              key={group.id}
              className={`h-1 w-16 rounded-full ${
                index === currentGroupIndex 
                  ? 'bg-primary' 
                  : index < currentGroupIndex 
                    ? 'bg-primary/60' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Linear progress indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {currentStep > 0 && (
        <button 
          onClick={handlePrevious}
          className="fixed top-5 left-5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Previous question
        </button>
      )}
      
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Help us match you to the right experience
            </CardTitle>
            <CardDescription>
              {step.description}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <h3 className="text-xl font-semibold mb-6">{step.title}</h3>
            
            {step.id === 'age' ? (
              <>
                <div className="mb-6">
                  <select
                    className="w-full p-3 bg-background border rounded-md focus:ring-2 focus:ring-primary"
                    onChange={(e) => handleSelect(e.target.value)}
                    value={answers[step.id] || ''}
                  >
                    <option value="" disabled>Select your age</option>
                    {step.ageGroups?.map((age) => (
                      <option key={age} value={age}>{age}</option>
                    ))}
                  </select>
                </div>
                
                {/* Did you know box */}
                {step.didYouKnow && (
                  <div className="bg-secondary/30 p-4 rounded-md flex items-start space-x-3 mt-4">
                    <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center text-primary flex-shrink-0">
                      i
                    </div>
                    <div>
                      <p className="font-medium">Did you know?</p>
                      <p className="text-sm text-muted-foreground">{step.didYouKnow}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                {step.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`w-full p-3 text-left rounded-md transition-colors ${
                      isOptionSelected(option)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/50 hover:bg-secondary/80'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {(step.multiSelect || currentStep === steps.length - 1) && (
              <Button 
                variant="gradient" 
                onClick={handleNext}
                disabled={isLoading}
                className="w-full"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </main>
  );
};

export default OnboardingPage; 