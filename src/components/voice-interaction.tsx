'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';

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
            {isSpeechRecognitionSupported && onTranscript && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleListening}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                    title={isListening ? 'Stop listening' : 'Start listening'}
                    disabled={!recognitionInstance} // Disable if instance isn't ready
                >
                    {isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                </Button>
            )}
            {/* TTS Button: Show only if supported AND textToSpeak is provided AND not speaking on mount */}
            {isSpeechSynthesisSupported && textToSpeak && !speakOnMount && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speakText(textToSpeak)}
                    aria-label="Speak text"
                    title="Speak text"
                >
                    <Volume2 className="h-5 w-5" />
                </Button>
            )}
        </div>
    );
};

export default VoiceInteraction;
