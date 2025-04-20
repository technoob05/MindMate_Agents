"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Settings, Send, BrainCircuit } from "lucide-react"; // Added BrainCircuit
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip components

// Agent 1: Face Emotion Analyzer
class FaceEmotionAgent { // Restore class definition
  async analyze(video: HTMLVideoElement): Promise<string> {
    try {
      // Ensure models are loaded before detecting
      if (!faceapi.nets.tinyFaceDetector.params || !faceapi.nets.faceExpressionNet.params) {
        console.warn("FaceAPI models not fully loaded yet.");
        return 'neutral';
      }
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      if (!detections) return 'neutral';

      const expressions = detections.expressions;
      const maxExpression = Object.entries(expressions).reduce((a, b) => (b[1] > a[1] ? b : a), ['neutral', 0])[0];

      switch (maxExpression) {
        case 'happy': return 'happy';
        case 'sad': return 'sad';
        case 'neutral': return 'neutral';
        case 'angry': return 'worried';
        case 'surprised': return 'empathetic';
        case 'fearful': return 'worried';
        default: return 'neutral';
      }
    } catch (error) {
      console.error("Face analysis error:", error);
      return 'neutral';
    }
  }
}

// Agent 2: TTS Agent
class TTSAgent {
  private currentAudio: HTMLAudioElement | null = null;
  private onEndCallback: (() => void) | null = null;

  stopSpeaking() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.onended = null; // Remove listener to prevent callback on manual stop
      this.currentAudio = null;
    }
    window.speechSynthesis.cancel();
    if (this.onEndCallback) {
        // Call the callback immediately if stopped manually
        // to ensure state like isSpeaking is reset
        // this.onEndCallback();
        // this.onEndCallback = null;
        // Correction: Don't call onEndCallback on manual stop,
        // the calling code should handle the state change immediately.
    }
  }

  async speak(text: string, emotion: string, useGoogleCloud: boolean, onEnd: () => void): Promise<void> {
    this.stopSpeaking();
    this.onEndCallback = onEnd; // Store the callback

    if (useGoogleCloud) {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, emotion }),
        });

        if (!response.ok) {
          throw new Error(`TTS API request failed with status ${response.status}`);
        }

        const audioData = await response.arrayBuffer();
        const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.play().catch(e => {
            console.error("Error playing Google Cloud audio:", e);
            if (this.onEndCallback) this.onEndCallback(); // Call callback on error too
        });
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          if (this.onEndCallback) this.onEndCallback(); // Call callback when finished
          this.onEndCallback = null;
        };
      } catch (error) {
        console.error('Error fetching or playing Google Cloud TTS:', error);
        if (this.onEndCallback) this.onEndCallback(); // Call callback on error
        this.onEndCallback = null;
      }
    } else {
      // Web Speech API
      let modifiedText = text;
      if (emotion === 'happy') modifiedText = `${text} Thật tuyệt! 😄`;
      if (emotion === 'sad') modifiedText = `${text}... hmmm.`;
      if (emotion === 'empathetic') modifiedText = `Ồ, ${text}`;
      if (emotion === 'worried') modifiedText = `${text}? Có chuyện gì sao?`;

      const utterance = new SpeechSynthesisUtterance(modifiedText);
      utterance.pitch = emotion === 'happy' ? 1.2 : emotion === 'sad' ? 0.8 : emotion === 'worried' ? 1.1 : 1.0;
      utterance.rate = emotion === 'happy' ? 1.1 : emotion === 'sad' ? 0.9 : emotion === 'empathetic' ? 0.8 : 1.0;

      // Ensure voices are loaded before selecting
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
          // Voices might load asynchronously, wait for them
          window.speechSynthesis.onvoiceschanged = () => {
              const updatedVoices = window.speechSynthesis.getVoices();
              this.selectVoiceAndSpeak(utterance, updatedVoices);
          };
      } else {
          this.selectVoiceAndSpeak(utterance, voices);
      }

      utterance.onend = () => {
          if (this.onEndCallback) this.onEndCallback(); // Call callback when finished
          this.onEndCallback = null;
      };
      utterance.onerror = (event) => {
          console.error("Web Speech synthesis error:", event.error);
          if (this.onEndCallback) this.onEndCallback(); // Call callback on error
          this.onEndCallback = null;
      };
    }
  }

  // Helper to select voice and speak for Web Speech API
  private selectVoiceAndSpeak(utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]) {
      let selectedVoice = voices.find((v) => v.lang === 'vi-VN');
      if (!selectedVoice) {
        selectedVoice = voices.find((v) => v.lang.startsWith('en-'));
      }
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log("Using voice:", selectedVoice.name, selectedVoice.lang);
      } else {
        console.warn("No suitable Web Speech voice found.");
      }
      window.speechSynthesis.speak(utterance);
  }
}

// Wave Animation Component
// Wave Animation Component - Use Primary Color
const WaveAnimation = ({ isActive }: { isActive: boolean }) => {
  const bars = 5;
  return (
    <div className="flex items-end justify-center h-8 space-x-1 mx-auto my-2">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full" // Use bg-primary
          initial={{ height: 4 }}
          animate={{
            height: isActive ? [4, Math.random() * 20 + 10, 4] : 4,
          }}
          transition={{
            duration: 0.6,
            repeat: isActive ? Infinity : 0,
            repeatType: "loop",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

// Animated Avatar Component - Refined
const EmotiveAvatar = ({ emotion }: { emotion: string }) => {
  // Updated emotionMap with explicit left/right eyebrows and adjusted positions
  const emotionMap: {
    [key: string]: {
      color: string;
      eyebrows: { left: string; right: string };
      mouth: string;
      eyes: { cy: number; r: number[] };
    }
  } = {
    happy: {
      color: '#38bdf8', // Sky Blue
      eyebrows: { left: 'M18,28 Q25,23 32,28', right: 'M38,28 Q45,23 52,28' }, // Arched up
      mouth: 'M25,50 Q35,58 45,50', // Wide smile
      eyes: { cy: 38, r: [5.5, 5.5] }
    },
    sad: {
      color: '#3b82f6', // Blue
      eyebrows: { left: 'M18,30 Q25,35 32,30', right: 'M38,30 Q45,35 52,30' }, // Arched down
      mouth: 'M25,52 Q35,47 45,52', // Frown
      eyes: { cy: 40, r: [5, 5] }
    },
    empathetic: {
      color: '#f59e0b', // Amber
      eyebrows: { left: 'M18,28 Q25,26 32,28', right: 'M38,28 Q45,26 52,28' }, // Slightly raised inner
      mouth: 'M28,50 Q35,52 42,50', // Gentle curve
      eyes: { cy: 38, r: [5.5, 5.5] }
    },
    worried: {
      color: '#f43f5e', // Rose
      eyebrows: { left: 'M18,30 Q25,25 32,30', right: 'M38,30 Q45,25 52,30' }, // Raised, slightly furrowed
      mouth: 'M30,50 Q35,48 40,50', // Slightly downturned, smaller
      eyes: { cy: 39, r: [5, 5] }
    },
    neutral: {
      color: '#64748b', // Slate Gray
      eyebrows: { left: 'M18,30 Q25,30 32,30', right: 'M38,30 Q45,30 52,30' }, // Straight
      mouth: 'M25,50 Q35,50 45,50', // Straight line
      eyes: { cy: 38, r: [5, 5] }
    }
  };

  const currentEmotion = emotionMap[emotion] || emotionMap.neutral;
  const svgViewBox = "0 0 70 70";

  return (
    <motion.div
      className="relative w-40 h-40"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-lg opacity-60 z-0" // Slightly increased blur and opacity
        style={{ backgroundColor: currentEmotion.color }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }} // Adjusted scale and opacity animation
        transition={{ repeat: Infinity, duration: 3 }}
      />

      {/* Avatar SVG */}
      <svg viewBox={svgViewBox} className="absolute inset-0 z-10">
        {/* Face */}
        <motion.circle
          cx="35" // Center X
          cy="35" // Center Y
          r="30"  // Radius
          fill="white"
          stroke={currentEmotion.color}
          strokeWidth="2"
          animate={{ fill: ['white', '#f8fafc', 'white'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Eyebrows - Using explicit paths */}
        <motion.path
          d={currentEmotion.eyebrows.left}
          stroke={currentEmotion.color}
          strokeWidth="2"
          fill="none"
          animate={{ d: currentEmotion.eyebrows.left }}
          transition={{ duration: 0.4 }} // Slightly faster transition
        />
        <motion.path
          d={currentEmotion.eyebrows.right}
          stroke={currentEmotion.color}
          strokeWidth="2"
          fill="none"
          animate={{ d: currentEmotion.eyebrows.right }}
          transition={{ duration: 0.4 }}
        />

        {/* Eyes - Using adjusted positions from map */}
        <motion.circle
          cx="25" // Left eye X
          cy={currentEmotion.eyes.cy} // Use cy from map
          r={currentEmotion.eyes.r[0]} // Use r from map
          fill={currentEmotion.color}
          animate={{
            r: [currentEmotion.eyes.r[0], currentEmotion.eyes.r[0]-1, currentEmotion.eyes.r[0]],
            opacity: [1, 0.8, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="45" // Right eye X
          cy={currentEmotion.eyes.cy} // Use cy from map
          r={currentEmotion.eyes.r[1]} // Use r from map
          fill={currentEmotion.color}
          animate={{
            r: [currentEmotion.eyes.r[1], currentEmotion.eyes.r[1]-1, currentEmotion.eyes.r[1]],
            opacity: [1, 0.8, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Mouth - Using adjusted positions */}
        <motion.path
          d={currentEmotion.mouth}
          stroke={currentEmotion.color}
          strokeWidth="2.5"
          fill="none"
          animate={{ d: currentEmotion.mouth }}
          transition={{ duration: 0.4 }} // Slightly faster transition
        />

        {/* Removed Digital circuit patterns and Particle effects */}
      </svg>
    </motion.div>
  );
};

// Main component for the AI psychologist
const ModernAiPsychologistPage: React.FC = () => {
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [responseText, setResponseText] = useState<string>('Chào bạn, mình là AI tâm lý. Mình có thể giúp gì cho bạn hôm nay?');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [useGoogleCloud, setUseGoogleCloud] = useState<boolean>(true); // Keep this setting
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  // Removed darkMode state
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // Ref for scrolling

  // Chat history
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string; emotion?: string }[]>([
    {
      role: 'assistant',
      content: 'Chào bạn, mình là AI tâm lý. Mình có thể giúp gì cho bạn hôm nay?',
      emotion: 'empathetic'
    }
  ]);

  // Instantiate agents (using useRef to ensure stable instances)
  const faceAgentRef = useRef(new FaceEmotionAgent());
  const ttsAgentRef = useRef(new TTSAgent());

  // Load Models and Setup Webcam
  useEffect(() => {
    async function setup() {
      setIsInitializing(true);
      try {
        console.log("Loading FaceAPI models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        console.log("FaceAPI models loaded.");

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          console.log("Requesting media stream...");
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log("Media stream acquired.");

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
                console.log("Webcam stream started.");
              }
            };
          }

          // Initialize MediaRecorder
          try {
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chosenMimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
            console.log("Using MediaRecorder mimeType:", chosenMimeType);

            mediaRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };

            mediaRecorderRef.current.onstop = async () => {
              setIsRecording(false); // Update state first
              setIsLoading(true);     // Set loading for processing
              console.log("Recording stopped. Processing audio...");
              const audioBlob = new Blob(audioChunksRef.current, { type: chosenMimeType });
              audioChunksRef.current = []; // Clear chunks immediately
              await handleAudioInput(audioBlob, chosenMimeType);
              // setIsLoading(false); // Loading is set to false inside handleAudioInput's finally block
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                // Type assertion needed because the event type is generic
                const errorEvent = event as unknown as { error: DOMException };
                addMessage('assistant', `Lỗi ghi âm: ${errorEvent.error.message}. Hãy thử lại hoặc kiểm tra quyền microphone.`, 'worried');
                setIsRecording(false);
                setIsLoading(false);
            };

          } catch (recorderError) {
            console.error("MediaRecorder initialization error:", recorderError);
            addMessage('assistant', 'Có vấn đề với việc ghi âm trên trình duyệt này. Vui lòng kiểm tra quyền truy cập microphone.', 'worried');
          }
        } else {
          console.error("getUserMedia not supported");
          addMessage('assistant', 'Trình duyệt không hỗ trợ camera/mic hoặc bạn chưa cấp quyền.', 'worried');
        }
      } catch (error) {
        console.error("Setup failed:", error);
        let message = 'Lỗi khi khởi tạo. Vui lòng tải lại trang và cho phép truy cập camera/mic.';
        if (error instanceof Error) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                message = 'Bạn chưa cấp quyền truy cập camera/mic. Vui lòng cho phép và tải lại trang.';
            } else if (error.message.includes('Requested device not found')) {
                message = 'Không tìm thấy camera hoặc microphone. Vui lòng kiểm tra thiết bị của bạn.';
            }
        }
        addMessage('assistant', message, 'worried');
      } finally {
        setIsInitializing(false);
      }
    }
    setup();

    // Cleanup function
    return () => {
      console.log("Cleaning up component...");
      ttsAgentRef.current.stopSpeaking();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        console.log("Media stream stopped.");
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        // Remove event listeners before stopping to prevent potential errors on unmount
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        try {
            mediaRecorderRef.current.stop();
            console.log("MediaRecorder stopped.");
        } catch (e) {
            console.warn("Error stopping MediaRecorder during cleanup:", e);
        }
      }
      // Clear interval if face analysis interval is running (added below)
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Face Emotion Analysis Interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (!isInitializing) { // Only start analyzing after setup is complete
        intervalId = setInterval(async () => {
            if (videoRef.current && !videoRef.current.paused && videoRef.current.readyState >= 3) { // Check readyState
                const faceEmotion = await faceAgentRef.current.analyze(videoRef.current);
                // Update emotion only if it's different and not neutral,
                // or if the current emotion IS neutral and a new non-neutral one is detected.
                // Avoid constant flickering back to neutral if face is temporarily lost.
                if (faceEmotion !== 'neutral' && faceEmotion !== currentEmotion) {
                    setCurrentEmotion(faceEmotion);
                }
            }
        }, 1500); // Analyze every 1.5 seconds
        console.log("Started face analysis interval.");
    }

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            console.log("Cleared face analysis interval.");
        }
    };
  }, [currentEmotion, isInitializing]); // Re-run if currentEmotion or isInitializing changes

  // Scroll to bottom of chat on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Helper function for adding messages to chat
  const addMessage = (role: 'user' | 'assistant', content: string, emotion: string = 'neutral') => {
    setChatHistory(prev => [...prev, { role, content, emotion }]);
    if (role === 'assistant') {
      setResponseText(content); // Update the main response text display (optional redundancy)
      setCurrentEmotion(emotion); // Update avatar emotion based on response
      // Auto-speak assistant messages
      setIsSpeaking(true); // Set speaking state immediately
      ttsAgentRef.current.speak(content, emotion, useGoogleCloud, () => {
          setIsSpeaking(false); // Callback to reset speaking state when TTS finishes or errors
      }).catch(e => {
          console.error("Error initiating speak:", e);
          setIsSpeaking(false); // Ensure state is reset even if speak promise rejects immediately
      });
    }
  };

  // Function to handle the processed audio blob
  async function handleAudioInput(audioBlob: Blob, mimeType: string) {
    if (audioBlob.size === 0) {
      console.warn("Empty audio blob received.");
      addMessage("assistant", "Hmm, I didn't catch that. Could you try again?", "empathetic"); // Updated message
      setIsLoading(false); // Reset loading state
      return;
    }

    // Set loading true specifically for API processing
    setIsLoading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const base64Audio = await base64Promise;
      const base64Data = base64Audio.split(',')[1]; // Get base64 part

      console.log("Sending audio data to /api/process...");
      const serverResponse = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Data, mimeType: mimeType }),
      });

      if (!serverResponse.ok) {
        const errorBody = await serverResponse.text();
        console.error("Server API error response:", errorBody);
        throw new Error(`Server API request failed with status ${serverResponse.status}`);
      }

      const result = await serverResponse.json();
      console.log("Server response:", result);

      // Add user's recognized text to chat (if any)
      if (result.recognizedText && result.recognizedText.trim()) {
        addMessage('user', result.recognizedText);
      } else {
        // Optional: Handle case where STT failed but processing might continue
        console.log("No recognized text from server.");
        // Maybe add a placeholder or skip user message?
        // addMessage('user', '[không nhận dạng được giọng nói]');
      }

      // Determine final emotion (prioritize audio, then face, then text)
      const finalEmotion = result.audioEmotion && result.audioEmotion !== 'neutral' ? result.audioEmotion
                         : (currentEmotion !== 'neutral' ? currentEmotion : (result.textEmotion || 'neutral'));

      // Add assistant response
      addMessage('assistant', result.reply || "Mình chưa biết trả lời sao nữa.", finalEmotion);

    } catch (error) {
      console.error('Error processing audio or getting response:', error);
      addMessage("assistant", "Oops, there was an error processing that. Could you try again? 😅", "worried"); // Updated message
    } finally {
      setIsLoading(false); // Ensure loading state is reset
    }
  }

  // Function to start/stop recording
  function toggleRecording() {
    if (isInitializing || !mediaRecorderRef.current) {
      addMessage("assistant", "Hold on, I'm still getting ready...", "worried"); // Updated message
      return;
    }

    if (isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        console.log("Stopping recording...");
        mediaRecorderRef.current.stop();
        // State changes (isRecording=false, isLoading=true) happen in onstop handler
      } else {
        console.warn("Recorder state mismatch (expected 'recording'), resetting.");
        setIsRecording(false); // Force reset state if mismatch
        setIsLoading(false);
      }
    } else {
      if (mediaRecorderRef.current.state === 'inactive') {
        ttsAgentRef.current.stopSpeaking(); // Stop any ongoing TTS
        setIsSpeaking(false);
        audioChunksRef.current = []; // Clear previous chunks
        try {
            mediaRecorderRef.current.start();
            console.log("Started recording...");
            setIsRecording(true);
        } catch (e) {
            console.error("Error starting MediaRecorder:", e);
            addMessage("assistant", "Couldn't start recording. Please check microphone permissions.", "worried"); // Updated message
        }
      } else {
        console.warn(`Cannot start recording, state is: ${mediaRecorderRef.current.state}`);
        // Maybe try to stop it first if it's in a weird state?
        if (mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume(); // Or stop? Depends on desired behavior
        }
      }
    }
  }

  // Handle TTS engine switch
  const handleSwitchChange = (checked: boolean) => {
    ttsAgentRef.current.stopSpeaking();
    setIsSpeaking(false);
    setUseGoogleCloud(checked);
    // Add a message to confirm the change, but don't speak it automatically
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Switched to ${checked ? "Google Cloud TTS" : "Web Speech API"}.`, // Updated message
        emotion: "neutral",
      },
    ]);
  };

  // Toggle speaking the *last* response manually
  const toggleSpeaking = () => {
    if (isSpeaking) {
      ttsAgentRef.current.stopSpeaking();
      setIsSpeaking(false);
    } else {
      // Find the last assistant message to speak
      const lastAssistantMessage = [...chatHistory].reverse().find(msg => msg.role === 'assistant');
      if (lastAssistantMessage) {
          setIsSpeaking(true);
          ttsAgentRef.current.speak(lastAssistantMessage.content, lastAssistantMessage.emotion || 'neutral', useGoogleCloud, () => {
              setIsSpeaking(false);
          }).catch(e => {
              console.error("Error initiating speak:", e);
              setIsSpeaking(false);
          });
      }
    }
  };

  // Removed toggleDarkMode and related useEffect

  return (
    // Use theme background implicitly
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar - Use themed styles */}
      <nav className="bg-background/90 backdrop-blur-sm border-b border-border/60 px-4 py-2 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Use a themed icon/logo representation */}
           <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow">
             <BrainCircuit size={16} className="text-primary-foreground" />
           </div>
          <h1 className="text-lg font-semibold text-foreground">MindMate AI Avatar</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Button - Use themed Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-9 w-9"
                  aria-label="Toggle Settings"
                >
                  <Settings size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                Settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme Switcher */}
          <ThemeSwitcher />
        </div>
      </nav>

      {/* Settings Panel - Use themed styles */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/80 backdrop-blur-sm border-b border-border/60 shadow-sm overflow-hidden"
          >
            <div className="max-w-4xl mx-auto p-4">
              <h3 className="font-semibold mb-3 text-base text-foreground">Settings</h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {/* TTS Engine Toggle - Use themed components */}
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background/50">
                  <Label htmlFor="tts-switch" className={`text-sm ${!useGoogleCloud ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    Web Speech
                  </Label>
                  <Switch
                    id="tts-switch"
                    checked={useGoogleCloud}
                    onCheckedChange={handleSwitchChange}
                    aria-label="Switch TTS Engine"
                  />
                  <Label htmlFor="tts-switch" className={`text-sm ${useGoogleCloud ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                    Google Cloud
                  </Label>
                </div>

                {/* Sound Toggle - Use themed Button */}
                <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background/50">
                  <Label htmlFor="sound-toggle-button" className="text-sm text-foreground">
                    Playback Audio
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          id="sound-toggle-button"
                          variant="outline"
                          size="icon"
                          onClick={toggleSpeaking}
                          className="h-8 w-8"
                          aria-label={isSpeaking ? "Stop Playback" : "Replay Last Response"}
                        >
                          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background/80 backdrop-blur-sm border-border/50 text-foreground px-2 py-1 rounded text-xs">
                        {isSpeaking ? "Stop Playback" : "Replay Last Response"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden video for face detection */}
      <video ref={videoRef} width="320" height="240" muted playsInline className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none" />

      {/* Main Content Area - Use themed styles */}
      <div className="flex-grow flex flex-col md:flex-row max-w-6xl mx-auto w-full p-4 gap-4 overflow-hidden">

        {/* Left Panel: Avatar & Controls - Use themed styles */}
        <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 bg-card/80 backdrop-blur-sm rounded-xl shadow-md p-5 flex flex-col items-center justify-start border border-border/60">
          <div className="mb-4 relative w-full flex justify-center">
            {/* Status indicator - Use themed styles */}
            <div className={`absolute top-1 right-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-background/70 border border-border/50 ${isInitializing ? "animate-pulse" : ""}`}>
              {isInitializing ? (
                 <Loader2 size={12} className="animate-spin text-muted-foreground"/>
              ) : (
                 <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-green-500'}`}></div>
              )}
              <span className="text-muted-foreground text-xs">
                {isInitializing ? 'Initializing...' : (isRecording ? 'Recording' : (isLoading ? 'Processing...' : 'Ready'))}
              </span>
            </div>
            {/* Avatar display */}
            <EmotiveAvatar emotion={currentEmotion} />
          </div>

          <h2 className="text-lg font-semibold mb-1 text-center text-foreground">Dr. MindMate</h2>
          <p className="text-sm text-muted-foreground text-center mb-5">
            AI Emotional Companion
          </p>

          {/* Audio visualizer */}
          <WaveAnimation isActive={isRecording || isSpeaking} />

          {/* Record button - Use themed Button */}
          <Button
            onClick={toggleRecording}
            disabled={isLoading || isInitializing}
            variant={isRecording ? "destructive" : "gradient"} // Use destructive variant when recording
            size="lg" // Make button larger
            className="w-full mt-2 rounded-xl shadow-lg flex items-center justify-center gap-2"
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isRecording ? (
              <MicOff size={20} />
            ) : (
              <Mic size={20} />
            )}
            <span>
              {isLoading ? 'Processing...' : (isRecording ? 'Stop Recording' : 'Start Speaking')}
            </span>
          </Button>
           {/* Initialization Loader Text */}
           {isInitializing && (
                <div className="text-xs text-center mt-2 text-muted-foreground">
                    Preparing camera and AI...
                </div>
            )}
        </div>

        {/* Right Panel: Chat Interface - Use themed styles */}
        <div className="flex-grow bg-card/70 backdrop-blur-sm rounded-xl shadow-md flex flex-col overflow-hidden border border-border/60">
          {/* Chat Messages Area */}
          <ScrollArea className="flex-grow p-4 space-y-4">
            {chatHistory.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Styled chat bubble */}
                <div
                  className={`max-w-[85%] p-3 rounded-lg shadow ${
                    message.role === 'user'
                      ? "bg-primary/90 text-primary-foreground rounded-tr-none" // User bubble style
                      : "bg-background/80 text-foreground border border-border/50 rounded-tl-none" // Assistant bubble style
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {/* Dummy div to ensure scrolling to bottom */}
            <div ref={messagesEndRef} />
          </ScrollArea>
          {/* Input area removed as interaction is primarily voice */}
        </div>
      </div>
    </div>
  );
};

export default ModernAiPsychologistPage;
