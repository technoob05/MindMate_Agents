'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Helper types for Web Speech API ---
// (Keep the type definitions as they were correctly defined before)
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: DOMException['name'];
    readonly message: string;
}
interface SpeechRecognition extends EventTarget {
    grammars: SpeechGrammarList;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    abort(): void;
    start(): void;
    stop(): void;
}
interface SpeechRecognitionStatic {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
}
interface SpeechGrammarList {
    readonly length: number;
    item(index: number): SpeechGrammar;
    [index: number]: SpeechGrammar;
    addFromString(string: string, weight?: number): void;
    addFromURI(src: string, weight?: number): void;
}
interface SpeechGrammar {
    src: string;
    weight: number;
}
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionStatic;
        webkitSpeechRecognition: SpeechRecognitionStatic;
    }
}
// --- End Helper Types ---


interface VoiceInteractionProps {
    onTranscript?: (transcript: string) => void; // Optional callback for STT result
    textToSpeak?: string;                       // Optional text for TTS
    speakOnMount?: boolean;                     // Optional: Speak text when component mounts/text changes
}

// Check for API availability (run only once on module load)
const isSpeechRecognitionSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
    onTranscript,
    textToSpeak,
    speakOnMount = false,
}) => {
    const [isListening, setIsListening] = useState(false);
    // Use state for the recognition instance to manage its lifecycle
    const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognition | null>(null);

    // --- Speech-to-Text (STT) Setup ---
    useEffect(() => {
        // Only setup if STT is supported AND the onTranscript callback is provided
        if (!isSpeechRecognitionSupported || !onTranscript) {
            setRecognitionInstance(null); // Ensure no instance exists if not needed
            return;
        }

        // Use the correct constructor type from the global declaration
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const instance = new SpeechRecognitionAPI();
        instance.continuous = false;
        instance.interimResults = false;
        instance.lang = 'vi-VN';

        instance.onresult = (event: SpeechRecognitionEvent) => {
            const lastResultIndex = event.results.length - 1;
            if (lastResultIndex >= 0 && event.results[lastResultIndex]?.[0]) {
                const transcript = event.results[lastResultIndex][0].transcript.trim();
                console.log('Transcript:', transcript);
                onTranscript(transcript); // Call the provided callback
            } else {
                 console.warn("No speech recognized in the final result.");
            }
            setIsListening(false); // Stop listening visually after result
        };

        instance.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error, event.message);
            setIsListening(false); // Stop listening visually on error
        };

        instance.onend = () => {
            // This event fires when recognition stops (naturally or via stop())
            // Ensure the visual state matches the actual state
             if (isListening) { // Check internal state first
                 setIsListening(false);
             }
        };

        setRecognitionInstance(instance); // Store the instance in state

        // Cleanup function: Stop recognition if component unmounts while listening
        return () => {
            instance?.stop();
            // console.log("STT Cleanup: Recognition stopped");
        };
    // IMPORTANT: Only depend on onTranscript. isListening should not be a dependency here
    // as it would cause the effect to re-run every time listening starts/stops.
    }, [onTranscript]);

    // --- STT Toggle Function ---
    const toggleListening = useCallback(() => {
        if (!recognitionInstance || !onTranscript) {
             console.warn("STT not available or no handler provided.");
             return; // Guard against missing instance or handler
        }

        if (isListening) {
            recognitionInstance.stop();
            // onend handler will set isListening to false
            // setIsListening(false); // Let onend handle this for consistency
            // console.log("STT: Stopping listening");
        } else {
            try {
                recognitionInstance.start();
                setIsListening(true);
                // console.log("STT: Started listening");
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                setIsListening(false); // Ensure state is correct if start fails
            }
        }
    }, [recognitionInstance, isListening, onTranscript]);


    // --- Text-to-Speech (TTS) Logic ---
    const speakText = useCallback((text: string | undefined) => {
        if (!isSpeechSynthesisSupported || !text) {
            if (!isSpeechSynthesisSupported) console.warn('Speech Synthesis API is not supported.');
            return;
        }
        // Cancel any ongoing speech before starting new one
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = 1;
        utterance.pitch = 1;
        // Optional: Find a specific Vietnamese voice if needed
        // const voices = window.speechSynthesis.getVoices();
        // utterance.voice = voices.find(voice => voice.lang === 'vi-VN' && voice.localService) || voices.find(voice => voice.lang === 'vi-VN') || null;

        window.speechSynthesis.speak(utterance);
    }, []);

    // --- TTS Speak on Mount/Change Effect ---
    useEffect(() => {
        if (textToSpeak && speakOnMount) {
            speakText(textToSpeak);
        }
        // Cleanup for TTS: Cancel speech if component unmounts or text changes while speaking
        return () => {
            if (speakOnMount) { // Only cancel if it might have been auto-started
                 window.speechSynthesis.cancel();
            }
        };
    }, [textToSpeak, speakOnMount, speakText]);

    // --- Render Component ---
    return (
        <div className="flex items-center gap-1">
            {/* STT Button: Show only if supported AND onTranscript is provided */}
            <AnimatePresence mode="wait">
                {isSpeechRecognitionSupported && onTranscript && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleListening}
                                        className={`relative h-8 w-8 rounded-lg transition-all duration-200 ${
                                            isListening 
                                                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                                                : 'hover:bg-primary/10 hover:text-primary'
                                        }`}
                                        disabled={!recognitionInstance}
                                    >
                                        {isListening && (
                                            <motion.div 
                                                className="absolute inset-0 rounded-lg bg-destructive/5"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.5, 0.2, 0.5]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        )}
                                        {isListening ? (
                                            <MicOff className="h-4 w-4 relative z-10" />
                                        ) : (
                                            <Mic className="h-4 w-4 relative z-10" />
                                        )}
                                    </Button>
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="glass-morphism">
                                {isListening ? 'Stop listening' : 'Start voice input'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </AnimatePresence>

            {/* TTS Button: Show only if supported AND textToSpeak is provided AND not speaking on mount */}
            <AnimatePresence mode="wait">
                {isSpeechSynthesisSupported && textToSpeak && !speakOnMount && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => speakText(textToSpeak)}
                                        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                    >
                                        <Volume2 className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="glass-morphism">
                                Read message aloud
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceInteraction;
