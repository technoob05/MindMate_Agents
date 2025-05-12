'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { Input } from '@/components/ui/input';

// Define the structure of our chat messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  reasoning?: string;
  analysisSteps?: AnalysisStep[];
}

// Define the structure for analysis steps
interface AnalysisStep {
  type: 'observation' | 'thinking' | 'question' | 'conclusion';
  content: string;
}

// Define the structure of our script steps
interface ScriptStep {
  type: 'bot' | 'user';
  message: string;
  reasoning?: string;
  analysisSteps?: AnalysisStep[];
  userOptions?: string[];
}

// Parse the script from script.txt
const parseScript = (): ScriptStep[] => {
  const scriptSteps: ScriptStep[] = [
    {
      type: 'bot',
      message: "Hello! I'm a chatbot here to support your mental well-being and listen to what's on your mind. How are you feeling about your mental health right now? Is there anything worrying you or something you'd like to share?",
      analysisSteps: [
        { type: 'observation', content: "Starting with an open-ended question to establish rapport" },
        { type: 'thinking', content: "Creating a safe space for the user to express their concerns" }
      ]
    },
    {
      type: 'user',
      message: "Lately, I've been feeling quite tired, anxious, and finding it hard to focus on work. I'm not sure why I'm feeling this way.",
      userOptions: [
        "Lately, I've been feeling quite tired, anxious, and finding it hard to focus on work. I'm not sure why I'm feeling this way.",
        "I'm doing fine, just wanted to check in.",
        "I've been dealing with some stress lately."
      ]
    },
    {
      type: 'bot',
      message: "Thank you for sharing. It sounds like you're going through a challenging time. To understand better, could you describe your anxiety a bit more? For example, how often does it happen, or are there specific situations that trigger it?",
      reasoning: "User shows signs of anxiety and fatigue, needs more information",
      analysisSteps: [
        { type: 'observation', content: "User reported fatigue, anxiety, and difficulty focusing - key symptoms of stress or anxiety disorders" },
        { type: 'thinking', content: "Need to understand the frequency, intensity, and triggers of the anxiety to assess its severity" },
        { type: 'question', content: "Asking about specific triggers to identify potential stressors in their environment" }
      ]
    },
    {
      type: 'user',
      message: "I feel anxious almost every day, especially at night. I keep thinking about work, deadlines, and worrying that I'm not doing well enough. Sometimes I can't sleep because I'm overthinking.",
      userOptions: [
        "I feel anxious almost every day, especially at night. I keep thinking about work, deadlines, and worrying that I'm not doing well enough. Sometimes I can't sleep because I'm overthinking.",
        "It's not that bad, just occasional worry.",
        "I'm mostly worried about specific work projects."
      ]
    },
    {
      type: 'bot',
      message: "I can understand how those thoughts about work can feel overwhelming, especially at night. Could you share more about your sleep? For instance, how many hours do you sleep each night, and do you often wake up during the night? Also, have you tried anything to ease this pressure, like talking to someone or doing a relaxing activity?",
      reasoning: "User shows signs of work-related anxiety and possible sleep issues",
      analysisSteps: [
        { type: 'observation', content: "Daily anxiety with notable intensification at night suggests chronic stress" },
        { type: 'thinking', content: "Persistent work-related worries and overthinking indicate rumination patterns" },
        { type: 'observation', content: "Sleep disruption mentioned - important to assess sleep quality as it affects mental health" },
        { type: 'thinking', content: "Exploring coping mechanisms will reveal existing support systems and strategies" },
        { type: 'question', content: "Asking about sleep patterns and coping strategies to understand full impact and current management approaches" }
      ]
    },
    {
      type: 'user',
      message: "I sleep about 4-5 hours a night and often wake up in the middle of the night, finding it hard to fall back asleep. I haven't tried much, just working more to avoid thinking, but it's not helping.",
      userOptions: [
        "I sleep about 4-5 hours a night and often wake up in the middle of the night, finding it hard to fall back asleep. I haven't tried much, just working more to avoid thinking, but it's not helping.",
        "My sleep is okay, usually 7-8 hours.",
        "I've tried meditation but it hasn't helped much."
      ]
    },
    {
      type: 'bot',
      message: "Thank you for sharing more—it really helps me get a clearer picture. It sounds like your sleep is being significantly affected, and trying to work more might be exhausting you further. One more thing: outside of work, do you have time for yourself, like exercising, reading, or doing something you enjoy? And do you feel comfortable sharing these feelings with friends or family?",
      reasoning: "User has sleep disturbances likely tied to anxiety; overworking is counterproductive",
      analysisSteps: [
        { type: 'observation', content: "Severe sleep insufficiency (4-5 hours vs. recommended 7-9) indicates clinical sleep disruption" },
        { type: 'thinking', content: "Maintenance insomnia (waking up and not falling back asleep) is common with anxiety and rumination" },
        { type: 'observation', content: "Using work as avoidance behavior may be reinforcing anxiety cycle" },
        { type: 'thinking', content: "Need to assess work-life balance and social support systems" },
        { type: 'question', content: "Exploring self-care activities and social support to identify potential intervention points" }
      ]
    },
    {
      type: 'user',
      message: "I barely have time for myself because work takes up most of my day. I don't want to talk to friends or family about this because I'm afraid they'll think I'm weak or I'll burden them.",
      userOptions: [
        "I barely have time for myself because work takes up most of my day. I don't want to talk to friends or family about this because I'm afraid they'll think I'm weak or I'll burden them.",
        "I do have some hobbies I enjoy on weekends.",
        "I've talked to a few close friends about it."
      ]
    },
    {
      type: 'bot',
      message: "I really appreciate your openness. From what you've shared, it seems like you're under a lot of pressure from work, and not having time for yourself or feeling comfortable sharing your emotions might be making things feel heavier. Symptoms like frequent anxiety, trouble sleeping, and feeling tired are signs that your mind and body need more care.\n\nI'd like to suggest some ways to help you feel lighter, but first, is there a specific issue you'd like to focus on? For example, improving sleep, reducing anxiety, or finding balance between work and life?",
      reasoning: "User is overwhelmed by work, lacks self-care time, and tends to suppress emotions, contributing to anxiety and sleep issues",
      analysisSteps: [
        { type: 'observation', content: "Work-life imbalance with minimal time for self-care activities" },
        { type: 'thinking', content: "Fear of judgment and being perceived as 'weak' suggests potential stigma beliefs about mental health" },
        { type: 'observation', content: "Reluctance to seek social support reduces available coping resources" },
        { type: 'thinking', content: "Pattern identified: work overload → reduced self-care → sleep disruption → increased anxiety → more work as avoidance → cycle continues" },
        { type: 'conclusion', content: "Multiple interconnected issues present: sleep disruption, anxiety, work-life imbalance, and limited support system" }
      ]
    },
    {
      type: 'user',
      message: "I'd like to improve my sleep first because I think if I sleep better, I'll feel less tired and anxious.",
      userOptions: [
        "I'd like to improve my sleep first because I think if I sleep better, I'll feel less tired and anxious.",
        "I want to reduce my anxiety first.",
        "I need better work-life balance."
      ]
    },
    {
      type: 'bot',
      message: "That's a great choice to prioritize! Sleep is crucial for feeling better physically and mentally. Based on your situation, here are a few small steps you can try to improve your sleep:\n\nCreate a Pre-Sleep Routine:\n\n- Avoid using your phone or computer at least 30 minutes before bed, as blue light can make it harder to fall asleep. Instead, try reading a light book or listening to calming music.\n\n- Practice a simple breathing exercise: inhale for 4 seconds, hold for 4 seconds, exhale for 6 seconds, and repeat 5-10 times to relax your body.\n\nSet Up an Ideal Sleep Environment:\n\n- Keep your bedroom cool, dark, and quiet. If possible, use blackout curtains or an eye mask to block out light.\n\n- Stick to a consistent bedtime, like 10-11 PM, to help your body adjust to a regular sleep rhythm.\n\nReduce Overthinking Before Bed:\n\n- If work thoughts keep you awake, try writing down your worries on paper before bed. This can help \"unload\" those thoughts and make you feel lighter.\n\n- A short 5-10 minute meditation focusing on your breath or visualizing a peaceful place can also help you relax.\n\nSince you're under a lot of work pressure, I also suggest carving out 10-15 minutes daily for something you enjoy, like a walk or listening to music, to gradually regain balance. If your sleep or anxiety doesn't improve after a while, you might consider talking to a mental health professional for deeper support.\n\nWhat do you think about these suggestions? Is there anything you'd like to try right away, or would you like me to explain any step further?",
      reasoning: "Synthesizing and Offering Advice",
      analysisSteps: [
        { type: 'thinking', content: "Sleep improvement as entry point can create positive cascading effects on other symptoms" },
        { type: 'thinking', content: "Need multi-faceted approach: sleep hygiene, cognitive techniques for rumination, and relaxation methods" },
        { type: 'observation', content: "User likely experiencing hyperarousal at bedtime due to work rumination" },
        { type: 'thinking', content: "Small, achievable changes more likely to be implemented than complete lifestyle overhaul" },
        { type: 'conclusion', content: "Recommended evidence-based interventions across three domains: pre-sleep routine, sleep environment, and cognitive techniques" }
      ]
    },
    {
      type: 'user',
      message: "Thank you, these suggestions are really helpful. I think I'll try the breathing exercise and writing down my thoughts first. I feel a bit relieved after talking to you.",
      userOptions: [
        "Thank you, these suggestions are really helpful. I think I'll try the breathing exercise and writing down my thoughts first. I feel a bit relieved after talking to you.",
        "These sound complicated. Do you have simpler suggestions?",
        "I'll try the sleep environment changes first."
      ]
    },
    {
      type: 'bot',
      message: "I'm so glad to hear that! Give those small steps a try and see how they work for you. I'm always here if you want to chat more or share how things are going. Wishing you a restful sleep tonight!",
      analysisSteps: [
        { type: 'observation', content: "User expressing openness to try specific techniques (breathing exercise and thought journaling)" },
        { type: 'thinking', content: "User's report of feeling 'relieved' indicates conversation has provided emotional validation" },
        { type: 'conclusion', content: "Positive engagement suggests readiness for change and benefit from supportive conversation" }
      ]
    }
  ];
  
  return scriptSteps;
};

// AI response generator for free-form questions (not in script)
const generateResponse = (question: string): { message: string, analysisSteps: AnalysisStep[] } => {
  // Focus on stress-related responses 
  const lowercaseQuestion = question.toLowerCase();
  
  // Check for stress-related keywords
  if (lowercaseQuestion.includes('stress') || lowercaseQuestion.includes('pressure') || 
      lowercaseQuestion.includes('overwhelmed') || lowercaseQuestion.includes('burnout')) {
    return {
      message: "It sounds like you're experiencing significant stress. Chronic stress can affect both your mental and physical health in many ways. Could you tell me more about what's causing your stress, and how long you've been feeling this way? Understanding the sources and duration can help us find appropriate strategies to manage it.",
      analysisSteps: [
        { type: 'observation', content: "User mentions stress-related concerns" },
        { type: 'thinking', content: "Need to understand stress sources, duration, and intensity to properly assess" },
        { type: 'question', content: "Asking about specific stressors and timeline to contextualize the experience" }
      ]
    };
  }
  
  // Check for sleep-related keywords
  if (lowercaseQuestion.includes('sleep') || lowercaseQuestion.includes('insomnia') || 
      lowercaseQuestion.includes('tired') || lowercaseQuestion.includes('fatigue') || 
      lowercaseQuestion.includes('rest')) {
    return {
      message: "Sleep difficulties can significantly impact your mental well-being. I'm curious about your sleep patterns - are you having trouble falling asleep, staying asleep, or waking up too early? Also, have you noticed any changes in your bedtime routine or sleep environment recently? Understanding these details will help us identify targeted strategies to improve your sleep quality.",
      analysisSteps: [
        { type: 'observation', content: "User expresses concerns about sleep" },
        { type: 'thinking', content: "Different types of insomnia require different approaches" },
        { type: 'thinking', content: "Sleep environment and routine are key modifiable factors" },
        { type: 'question', content: "Asking about specific sleep issues and context to determine appropriate interventions" }
      ]
    };
  }
  
  // Check for anxiety-related keywords
  if (lowercaseQuestion.includes('anxiety') || lowercaseQuestion.includes('worry') || 
      lowercaseQuestion.includes('nervous') || lowercaseQuestion.includes('panic') || 
      lowercaseQuestion.includes('fear')) {
    return {
      message: "Anxiety can be challenging to deal with, and you're not alone in experiencing these feelings. To better understand your situation, could you describe what your anxiety feels like physically and emotionally? And are there specific situations or thoughts that tend to trigger or worsen your anxiety? This information will help us identify effective coping strategies tailored to your experience.",
      analysisSteps: [
        { type: 'observation', content: "User mentions anxiety symptoms" },
        { type: 'thinking', content: "Physical and cognitive manifestations of anxiety provide clues to its nature" },
        { type: 'thinking', content: "Identifying triggers is essential for targeted interventions" },
        { type: 'question', content: "Asking about physical symptoms and triggers to develop appropriate coping strategies" }
      ]
    };
  }
  
  // Check for work-related keywords
  if (lowercaseQuestion.includes('work') || lowercaseQuestion.includes('job') || 
      lowercaseQuestion.includes('career') || lowercaseQuestion.includes('boss') || 
      lowercaseQuestion.includes('workplace')) {
    return {
      message: "Work-related challenges can significantly impact our mental health. Could you tell me more about what aspects of work are most difficult for you right now? Is it workload, relationships with colleagues, performance pressure, or something else? Also, have you been able to maintain boundaries between work and personal life? Understanding these details will help us identify strategies to improve your work-life balance.",
      analysisSteps: [
        { type: 'observation', content: "User indicates workplace concerns" },
        { type: 'thinking', content: "Different work stressors require different approaches (interpersonal vs. workload vs. meaning)" },
        { type: 'thinking', content: "Work-life boundaries are crucial for mental health maintenance" },
        { type: 'question', content: "Asking about specific workplace challenges to determine targeted support strategies" }
      ]
    };
  }
  
  // Default response for other topics
  return {
    message: "Thank you for sharing that with me. To provide you with the most helpful support, I'd like to understand more about what you're experiencing. Could you tell me more about how this has been affecting your daily life, emotions, and overall well-being? The more specific you can be, the better I can tailor my guidance to your situation.",
    analysisSteps: [
      { type: 'observation', content: "User has shared a concern that requires further exploration" },
      { type: 'thinking', content: "Need more context about impact on functioning to assess severity" },
      { type: 'question', content: "Asking open-ended question to encourage elaboration and understand lived experience" }
    ]
  };
};

// Follow-up question generator based on user's response
const generateFollowUp = (userMessage: string): { message: string, analysisSteps: AnalysisStep[] } => {
  const lowercaseMessage = userMessage.toLowerCase();
  
  // If they mention sleep problems
  if (lowercaseMessage.includes('sleep') || lowercaseMessage.includes('insomnia') || 
      lowercaseMessage.includes('tired') || lowercaseMessage.includes('bed') || 
      lowercaseMessage.includes('night')) {
    return {
      message: "Sleep issues can significantly impact your mental health. I'd like to understand your sleep patterns better. Approximately how many hours do you sleep each night? Do you have difficulty falling asleep, staying asleep, or waking up too early? And have you noticed any patterns or triggers that seem to affect your sleep quality?",
      analysisSteps: [
        { type: 'observation', content: "User mentioned sleep difficulties" },
        { type: 'thinking', content: "Duration, type of insomnia, and triggers are key diagnostic information" },
        { type: 'thinking', content: "Sleep problems often have bidirectional relationship with mental health concerns" },
        { type: 'question', content: "Gathering detailed sleep information to assess severity and identify appropriate interventions" }
      ]
    };
  }
  
  // If they mention work stress
  if (lowercaseMessage.includes('work') || lowercaseMessage.includes('job') || 
      lowercaseMessage.includes('career') || lowercaseMessage.includes('boss')) {
    return {
      message: "I hear that work is a significant source of stress for you. To understand better, could you tell me more about what specifically causes you the most stress at work? Is it workload, deadlines, relationships with colleagues, performance expectations, or something else? Also, has this been an ongoing issue or has something changed recently?",
      analysisSteps: [
        { type: 'observation', content: "User indicated work-related stress" },
        { type: 'thinking', content: "Different workplace stressors require different intervention approaches" },
        { type: 'thinking', content: "Recent changes may provide insight into triggering factors" },
        { type: 'question', content: "Exploring specific work stressors and their timeline to develop targeted strategies" }
      ]
    };
  }
  
  // If they mention anxiety
  if (lowercaseMessage.includes('anxiety') || lowercaseMessage.includes('worry') || 
      lowercaseMessage.includes('overthinking') || lowercaseMessage.includes('stress')) {
    return {
      message: "Thank you for sharing about your anxiety. To get a better picture, could you describe how this anxiety typically manifests for you? For example, do you experience physical symptoms like rapid heartbeat or tension, or is it more about racing thoughts? Also, have you noticed specific situations or thoughts that tend to trigger or worsen your anxiety?",
      analysisSteps: [
        { type: 'observation', content: "User described anxiety symptoms" },
        { type: 'thinking', content: "Somatic vs. cognitive symptoms may suggest different treatment approaches" },
        { type: 'thinking', content: "Identifying triggers is essential for cognitive-behavioral interventions" },
        { type: 'question', content: "Gathering information about symptom manifestation and triggers to formulate appropriate strategies" }
      ]
    };
  }
  
  // Default follow-up for other topics
  return {
    message: "I appreciate you sharing that with me. To help me understand your situation better, could you tell me how long you've been experiencing these feelings, and what impact they've had on your daily life, relationships, and overall well-being? Also, have you found anything that helps, even temporarily?",
    analysisSteps: [
      { type: 'observation', content: "User shared personal experience that needs further context" },
      { type: 'thinking', content: "Duration and functional impact help assess severity" },
      { type: 'thinking', content: "Existing coping strategies can be built upon in recommendations" },
      { type: 'question', content: "Exploring timeline, impact, and current coping to develop comprehensive understanding" }
    ]
  };
};

export default function ScriptChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [isInScript, setIsInScript] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const script = parseScript();
  
  // Start the chat with the first bot message
  useEffect(() => {
    if (script.length > 0 && messages.length === 0) {
      const firstStep = script[0];
      if (firstStep.type === 'bot') {
        simulateTypingAndAddMessage(firstStep.message, 'ai', firstStep.reasoning, firstStep.analysisSteps);
      }
    }
  }, []);

  // Scroll to bottom effect
  useEffect(() => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  }, [messages, isTyping, showAnalysis]);

  // Simulate typing effect for AI messages
  const simulateTypingAndAddMessage = (text: string, sender: 'user' | 'ai', reasoning?: string, analysisSteps?: AnalysisStep[]) => {
    // If it's a user message, add it immediately
    if (sender === 'user') {
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        text,
        sender,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      if (isInScript) {
        // Move to the next step (which would be a bot response)
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        
        // If there's a next bot message, start typing it after a delay
        if (nextIndex < script.length && script[nextIndex].type === 'bot') {
          setTimeout(() => {
            setShowAnalysis(!!script[nextIndex].analysisSteps?.length);
            simulateTypingAndAddMessage(
              script[nextIndex].message, 
              'ai', 
              script[nextIndex].reasoning,
              script[nextIndex].analysisSteps
            );
          }, 1000);
        }
      } else {
        // For free-form responses, generate a follow-up based on user's message
        setTimeout(() => {
          const followUp = generateFollowUp(text);
          setShowAnalysis(true);
          simulateTypingAndAddMessage(
            followUp.message,
            'ai',
            undefined,
            followUp.analysisSteps
          );
        }, 1000);
      }
      return;
    }
    
    // For AI messages, simulate typing
    setIsTyping(true);
    
    // Show analysis if available
    if (analysisSteps && analysisSteps.length > 0) {
      setShowAnalysis(true);
    }
    
    let displayText = '';
    let charIndex = 0;
    
    const typingInterval = setInterval(() => {
      if (charIndex < text.length) {
        displayText += text.charAt(charIndex);
        setPendingMessage(displayText);
        charIndex++;
      } else {
        clearInterval(typingInterval);
        finishTyping(text, reasoning, analysisSteps);
      }
    }, 15); // Adjust speed as needed
    
    return () => clearInterval(typingInterval);
  };
  
  const finishTyping = (text: string, reasoning?: string, analysisSteps?: AnalysisStep[]) => {
    setIsTyping(false);
    setPendingMessage('');
    
    const botMessage: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender: 'ai',
      timestamp: Date.now(),
      reasoning,
      analysisSteps
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    if (isInScript) {
      // Move to the next step
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      
      // If next step is user response, show options
      if (nextIndex < script.length && script[nextIndex].type === 'user') {
        setTimeout(() => {
          setShowOptions(true);
        }, 500);
      }
    }
  };
  
  const handleUserChoice = (option: string) => {
    setShowOptions(false);
    setShowAnalysis(false);
    
    // Add the user's message to the chat
    simulateTypingAndAddMessage(option, 'user');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };
  
  const handleSendMessage = () => {
    if (inputMessage.trim() === '' || isTyping) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    
    // Check if this matches the next scripted user message
    if (isInScript && currentStepIndex < script.length && script[currentStepIndex].type === 'user') {
      // Continue with the script
      simulateTypingAndAddMessage(message, 'user');
    } else {
      // Exit script mode if we were in it
      if (isInScript) {
        setIsInScript(false);
        setShowOptions(false);
      }
      
      // Handle as a free-form message
      simulateTypingAndAddMessage(message, 'user');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Mental Health Chatbot Demo</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}>
            Reset Chat
          </Button>
        </div>
      </header>
      
      <main className="flex-grow overflow-hidden relative">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4 pb-20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                } items-start gap-2 max-w-[80%] ${
                  message.sender === 'user' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {message.sender === 'ai' && (
                  <Avatar className="w-8 h-8 mt-0.5">
                    <AvatarImage src="/bot-avatar.png" alt="AI Assistant" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.text}</div>
                </div>
                {message.sender === 'user' && (
                  <Avatar className="w-8 h-8 mt-0.5">
                    <AvatarImage src="/user-avatar.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start items-start gap-2 max-w-[80%]">
                <Avatar className="w-8 h-8 mt-0.5">
                  <AvatarImage src="/bot-avatar.png" alt="AI Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <div className="whitespace-pre-wrap">{pendingMessage}</div>
                  <div className="mt-1 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Analysis process */}
            {showAnalysis && 
             (isInScript ? 
               (currentStepIndex < script.length && script[currentStepIndex].analysisSteps) : 
               (messages.length > 0 && messages[messages.length - 1].analysisSteps)
             ) && (
              <div className="flex justify-center w-full my-2">
                <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3 w-full max-w-xl">
                  <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-200">
                    <Sparkles className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">AI Analysis Process</h3>
                  </div>
                  <div className="space-y-2">
                    {isInScript && currentStepIndex < script.length && script[currentStepIndex].analysisSteps ? (
                      script[currentStepIndex].analysisSteps?.map((step, index) => (
                        <div key={index} className="pl-4 border-l-2 border-amber-200 dark:border-amber-800">
                          <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0.5">
                            {step.type === 'observation' ? '👁️ Observation' : 
                             step.type === 'thinking' ? '🧠 Thinking' : 
                             step.type === 'question' ? '❓ Question' : 
                             '🎯 Conclusion'}
                          </div>
                          <div className="text-sm text-amber-800 dark:text-amber-200">{step.content}</div>
                        </div>
                      ))
                    ) : (
                      messages.length > 0 && messages[messages.length - 1].analysisSteps?.map((step, index) => (
                        <div key={index} className="pl-4 border-l-2 border-amber-200 dark:border-amber-800">
                          <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0.5">
                            {step.type === 'observation' ? '👁️ Observation' : 
                             step.type === 'thinking' ? '🧠 Thinking' : 
                             step.type === 'question' ? '❓ Question' : 
                             '🎯 Conclusion'}
                          </div>
                          <div className="text-sm text-amber-800 dark:text-amber-200">{step.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Text input bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={inputMessage.trim() === '' || isTyping}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* User response options */}
        <AnimatePresence>
          {showOptions && isInScript && currentStepIndex < script.length && script[currentStepIndex].userOptions && (
            <motion.div 
              className="absolute bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-2">
                <div className="text-sm text-muted-foreground mb-1">Suggested responses:</div>
                {script[currentStepIndex].userOptions?.map((option, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="justify-start text-left h-auto py-2"
                    onClick={() => handleUserChoice(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
} 