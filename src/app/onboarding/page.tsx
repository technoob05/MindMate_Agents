'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import Image from 'next/image';
// Import from json file to avoid TypeScript errors
import questionData from '../../../question.json';

// Định nghĩa kiểu dữ liệu cho questionData
interface QuestionGroup {
  id: string;
  name: string;
}

interface Question {
  id: string;
  groupId: string;
  title: string;
  description: string;
  quote: string;
  type: 'select' | 'multiselect';
  options: string[];
}

interface QuestionData {
  questionGroups: QuestionGroup[];
  questions: Question[];
}

const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const router = useRouter();

  // Lấy dữ liệu từ file JSON với kiểu dữ liệu đã định nghĩa
  const { questionGroups, questions } = questionData as QuestionData;

  // Kiểm tra trạng thái đăng nhập và onboarding
  useEffect(() => {
    const checkLoginStatus = async () => {
    const user = localStorage.getItem('user');
      const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
    
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    if (!user) {
        console.log('Onboarding: User not logged in, redirecting to login');
      router.push('/login');
      return;
    }

      // Nếu đã hoàn thành onboarding, chuyển hướng về trang chủ
      if (hasCompletedOnboarding) {
        console.log('Onboarding: User already completed onboarding, redirecting to home');
      router.push('/');
        return;
      }
      
      // Nếu đăng nhập lần đầu và chưa hoàn thành onboarding, hiển thị trang onboarding
      console.log('Onboarding: First login or onboarding not completed, showing onboarding page');
      setIsFirstLogin(true);
    };
    
    checkLoginStatus();
  }, [router]);

  const handleNext = () => {
    console.log('Next button clicked');
    if (currentStep < questions.length - 1) {
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
    const question = questions[currentStep];
    if (question.type === 'multiselect') {
      // Đối với câu hỏi đa lựa chọn
      setAnswers(prev => {
        const currentValues = prev[question.id] || [];
        const updatedValues = currentValues.includes(value)
          ? currentValues.filter((item: string) => item !== value)
          : [...currentValues, value];
        console.log('Updated answers:', { ...prev, [question.id]: updatedValues });
          return {
            ...prev,
          [question.id]: updatedValues
          };
      });
    } else {
      // Đối với câu hỏi một lựa chọn
      setAnswers(prev => ({
        ...prev,
        [question.id]: value
      }));
      
      // Tự động chuyển đến câu hỏi tiếp theo đối với câu hỏi một lựa chọn
      if (currentStep < questions.length - 1) {
        setTimeout(() => setCurrentStep(currentStep + 1), 300);
      } else {
        // Nếu là câu hỏi cuối cùng, tự động submit sau một khoảng thời gian
        setTimeout(() => handleSubmit(), 500);
      }
    }
  };

  const isOptionSelected = (value: string) => {
    const question = questions[currentStep];
    if (question.type === 'multiselect') {
      const currentValues = answers[question.id] || [];
      return currentValues.includes(value);
    } else {
      return answers[question.id] === value;
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Lưu trữ câu trả lời onboarding
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      
      if (userData && userData.id) {
        // Ghi log câu trả lời
        console.log('Onboarding answers:', {
          userId: userData.id,
          answers
        });
        
        // Gửi dữ liệu lên server
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
          } else {
            console.log('Onboarding data saved successfully');
          }
        } catch (error) {
          console.warn('Error saving onboarding data to server, but continuing...', error);
        }
        
        // Đánh dấu đã hoàn thành onboarding
        localStorage.setItem('onboardingCompleted', 'true');
        Cookies.set('onboardingCompleted', 'true', { expires: 365 }); // Hết hạn sau 1 năm
        
        // Chuyển hướng về trang chủ
        console.log('Onboarding completed, redirecting to homepage');
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

  const question = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const currentGroupId = question ? question.groupId : '';

  // Tìm chỉ số của nhóm hiện tại cho thanh tiến trình
  const currentGroupIndex = questionGroups.findIndex(group => group.id === currentGroupId);

  // Hiển thị trang loading trong khi kiểm tra trạng thái đăng nhập
  if (!isFirstLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-center text-muted-foreground">Đang kiểm tra thông tin...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* CSS Animations - Gradient Orbs */}
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      <div className="gradient-orb orb-3"></div>
      <div className="gradient-orb orb-4"></div>
      
      {/* CSS Animations - Light Beams */}
      <div className="light-beam beam-1"></div>
      <div className="light-beam beam-2"></div>
      <div className="light-beam beam-3"></div>
      <div className="light-beam beam-4"></div>
      
      {/* CSS Animations - Floating Particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className={`floating-particle particle-${i % 5}`} style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${Math.random() * 10 + 10}s`,
        }}></div>
      ))}
      
      {/* Thanh tiến trình tuyến tính */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Modernized Header with bicolor MindMate logo */}
      <div className="fixed top-6 left-0 right-0 flex flex-col items-center z-50">
        <div className="text-3xl font-bold mb-2 flex items-center">
          <span className="text-primary">Mind</span>
          <span className="text-emerald-500">Mate</span>
          <span className="ml-1 text-sm bg-emerald-500 text-white px-1 rounded-sm">AI</span>
        </div>
        <div className="text-base text-center text-muted-foreground max-w-md px-4 mb-8 whitespace-nowrap">
          Personalizing your mental wellness journey
        </div>
      </div>
      
      {/* Improved Category Progress Indicators - more cohesive and modern */}
      <div className="fixed top-32 left-0 right-0 flex justify-center z-50">
        <div className="flex items-center bg-card/30 backdrop-blur-sm rounded-full shadow-sm px-3 py-1.5">
          {questionGroups.map((group: QuestionGroup, index: number) => (
            <div key={group.id} className="relative flex flex-col items-center">
              {/* Connecting line between circles */}
              {index > 0 && (
                <div className={`absolute top-[10px] -left-3 w-6 h-0.5 ${
                  index <= currentGroupIndex ? 'bg-primary' : 'bg-muted'
                } transition-colors duration-300`}/>
              )}
              
              {/* Circle indicator */}
              <div className="flex flex-col items-center mx-2">
                <div 
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index < currentGroupIndex 
                      ? 'bg-primary text-white' 
                      : index === currentGroupIndex 
                        ? 'bg-primary/90 text-white ring-2 ring-primary ring-offset-1 scale-125' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentGroupIndex ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span className="text-[10px]">{index + 1}</span>
                  )}
                </div>
                
                {/* Category name - only shows for active or completed */}
                <span className={`text-xs mt-1 whitespace-nowrap transition-all duration-300 ${
                  index === currentGroupIndex 
                    ? 'opacity-100 text-primary font-medium' 
                    : 'opacity-0 text-muted-foreground'
                } ${index === currentGroupIndex ? 'max-h-5' : 'max-h-0'}`}>
                  {group.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Nút Quay lại */}
      {currentStep > 0 && (
        <button 
          onClick={handlePrevious}
          className="fixed top-5 left-5 flex items-center text-muted-foreground hover:text-foreground transition-colors z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          <span className="text-sm">Previous Question</span>
        </button>
      )}
      
      {/* Nội dung câu hỏi */}
      <div className="mt-48 w-full max-w-[90%] max-w-6xl relative z-50 pointer-events-auto">
      <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
          className="w-full z-50 pointer-events-auto"
        >
          {question && question.type === 'multiselect' ? (
            // Custom container for multiselect questions
            <div className="w-full rounded-2xl bg-white/75 backdrop-blur-md shadow-xl border border-white/30 p-6 lg:p-8 transition-all duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">{question.title}</h2>
                <p className="text-muted-foreground">{question.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {question.options.map((option) => {
                  const isSelected = (answers[question.id] || []).includes(option);
                  
                  return (
                    <div 
                      key={option}
                      onClick={() => {
                        console.log(`Clicking option: ${option}`);
                        setAnswers(prev => {
                          const currentValues = prev[question.id] || [];
                          if (currentValues.includes(option)) {
                            return {
                              ...prev,
                              [question.id]: currentValues.filter((item: string) => item !== option)
                            };
                          } else {
                            return {
                              ...prev,
                              [question.id]: [...currentValues, option]
                            };
                          }
                        });
                      }}
                      className={`p-5 rounded-xl border transition-all duration-300 transform ${
                        isSelected 
                          ? 'bg-primary/85 text-white border-primary/20 shadow-md scale-[1.02]' 
                          : 'bg-white/65 text-gray-800 border-gray-200/50 hover:border-gray-300 hover:bg-white/75 hover:scale-[1.01] hover:shadow-sm'
                      } cursor-pointer flex items-center backdrop-blur-sm`}
                    >
                      <div className={`w-5 h-5 rounded-md mr-3 flex items-center justify-center transition-all duration-300 ${
                        isSelected ? 'bg-white' : 'border border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M5 13l4 4L19 7" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-base font-medium">{option}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Button above quote */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    console.log(`Next button clicked for question: ${question.id}`);
                    setCurrentStep(currentStep + 1);
                  }}
                  className="w-full py-3.5 bg-black/85 text-white rounded-xl font-medium cursor-pointer transition-all duration-300 hover:bg-black hover:shadow-md"
                >
                  Continue
                </button>
              </div>
              
              {/* Quote box below button */}
              {question.quote && (
                <div className="mt-6 p-5 bg-secondary/10 rounded-xl border border-primary/10 backdrop-blur-md">
                  <p className="text-sm italic text-muted-foreground">{question.quote}</p>
                </div>
              )}
            </div>
          ) : (
            // Regular card for single select questions
            <Card className="border-none shadow-xl z-50 pointer-events-auto max-w-md mx-auto bg-white/70 backdrop-blur-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {question ? question.title : 'Complete'}
            </CardTitle>
            <CardDescription>
                  {question ? question.description : 'Thank you for completing the questionnaire.'}
            </CardDescription>
          </CardHeader>
          
              <CardContent className="space-y-4 z-50 pointer-events-auto">
                {question && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={isOptionSelected(option) ? "default" : "outline"}
                        className={`w-full justify-start text-left h-auto py-3.5 px-4 transition-all duration-300 rounded-xl ${
                          isOptionSelected(option)
                            ? 'bg-primary/85 text-primary-foreground shadow-sm'
                            : 'bg-white/65 hover:bg-white/75 hover:shadow-sm'
                        }`}
                        onClick={() => handleSelect(option)}
                      >
                        {option}
                      </Button>
                    ))}
                </div>
                )}
                
                {/* Quote box - below options */}
                {question && question.quote && (
                  <div className="mt-6 p-5 bg-secondary/10 rounded-xl border border-primary/10 backdrop-blur-md">
                    <p className="text-sm italic text-muted-foreground">"{question.quote}"</p>
              </div>
            )}
          </CardContent>
          
              <CardFooter className="flex justify-end space-x-2">
                {!question && (
              <Button 
                    onClick={handleSubmit}
                disabled={isLoading}
                    className="w-full transition-all duration-300 rounded-xl py-3"
              >
                    {isLoading ? 'Processing...' : 'Start using MindMate'}
              </Button>
            )}
          </CardFooter>
        </Card>
          )}
      </motion.div>
      </AnimatePresence>
      </div>
      
      {/* Footer with gradient text */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center text-xs z-50">
        <p>Helping you connect with <span className="bg-gradient-to-r from-primary to-emerald-500 text-transparent bg-clip-text font-medium">the best experience for you</span></p>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        /* Base Animation Classes */
        .gradient-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.25;
          z-index: 1;
        }
        
        .light-beam {
          position: fixed;
          height: 80px;
          width: 100%;
          opacity: 0.15;
          z-index: 2;
          transform: rotate(-1deg);
        }
        
        .floating-particle {
          position: fixed;
          border-radius: 50%;
          width: 6px;
          height: 6px;
          z-index: 1;
          animation: float 15s ease-in-out infinite;
        }
        
        /* Orb Styles */
        .orb-1 {
          top: 10%;
          left: 10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle at center, rgba(139, 92, 246, 0.3), rgba(76, 29, 149, 0.1));
          animation: pulse 15s ease-in-out infinite alternate;
        }
        
        .orb-2 {
          top: 60%;
          right: 5%;
          width: 350px;
          height: 350px;
          background: radial-gradient(circle at center, rgba(250, 204, 21, 0.2), rgba(234, 179, 8, 0.05));
          animation: pulse 12s ease-in-out infinite alternate-reverse;
        }
        
        .orb-3 {
          bottom: 5%;
          left: 20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle at center, rgba(236, 72, 153, 0.2), rgba(190, 24, 93, 0.05));
          animation: pulse 18s ease-in-out infinite alternate;
        }
        
        .orb-4 {
          top: 30%;
          right: 30%;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.2), rgba(3, 105, 161, 0.05));
          animation: pulse 14s ease-in-out infinite alternate-reverse;
        }
        
        /* Light Beam Styles */
        .beam-1 {
          top: 15%;
          background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.2), transparent);
          animation: beam-move 20s ease-in-out infinite;
        }
        
        .beam-2 {
          top: 35%;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.25), transparent);
          animation: beam-move 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .beam-3 {
          top: 60%;
          background: linear-gradient(90deg, transparent, rgba(217, 70, 239, 0.2), transparent);
          animation: beam-move 18s ease-in-out infinite;
          animation-delay: -10s;
        }
        
        .beam-4 {
          top: 80%;
          background: linear-gradient(90deg, transparent, rgba(76, 29, 149, 0.15), transparent);
          animation: beam-move 22s ease-in-out infinite;
          animation-delay: -15s;
        }
        
        /* Particle Colors */
        .particle-0 {
          background-color: rgba(139, 92, 246, 0.6); /* Violet */
        }
        
        .particle-1 {
          background-color: rgba(236, 72, 153, 0.6); /* Pink */
        }
        
        .particle-2 {
          background-color: rgba(14, 165, 233, 0.6); /* Sky */
        }
        
        .particle-3 {
          background-color: rgba(20, 184, 166, 0.6); /* Teal */
        }
        
        .particle-4 {
          background-color: rgba(217, 70, 239, 0.6); /* Fuchsia */
        }
        
        /* Animations */
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.2;
          }
        }
        
        @keyframes beam-move {
          0% {
            transform: translateY(-50px) rotate(-1deg);
          }
          50% {
            transform: translateY(50px) rotate(0.5deg);
          }
          100% {
            transform: translateY(-50px) rotate(-1deg);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-10px) translateX(20px);
            opacity: 0.7;
          }
          75% {
            transform: translateY(10px) translateX(-10px);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.7;
          }
        }
      `}</style>
    </main>
  );
};

export default OnboardingPage; 