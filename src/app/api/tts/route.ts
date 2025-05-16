import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import { Credentials, JWTInput } from 'google-auth-library'; // Import Credentials & JWTInput types

// Flag to track if TTS is available
let ttsAvailable = false;
let ttsClient: TextToSpeechClient | null = null;

// Try to initialize the TTS client, but don't fail if credentials are missing
try {
  // Construct the path to the credentials file relative to the project root
  const credentialsPath = path.resolve(process.cwd(), 'google-credentials.json');
  
  if (fs.existsSync(credentialsPath)) {
    const credentialsFileContent = fs.readFileSync(credentialsPath, 'utf-8');
    const credentialsJson = JSON.parse(credentialsFileContent);
    
    // Initialize Google Cloud TTS Client with explicit credentials
    ttsClient = new TextToSpeechClient({ credentials: credentialsJson as JWTInput });
    ttsAvailable = true;
    console.log('Google TTS initialized successfully');
  } else {
    console.warn('Google credentials file not found. TTS functionality will be disabled.');
  }
} catch (error) {
  console.error('Error initializing Google TTS:', error);
  // Don't throw, just log the error and continue with disabled TTS
}

export async function POST(req: NextRequest) {
  // If TTS is not available, return a friendly error
  if (!ttsAvailable || !ttsClient) {
    return NextResponse.json({ 
      error: 'Text-to-Speech service is not available. Missing Google credentials.',
      fallbackText: 'TTS is disabled in this environment. Please configure Google credentials to enable this feature.'
    }, { status: 503 });  // 503 Service Unavailable
  }

  try {
    const { text, emotion } = await req.json();

    if (!text || !emotion) {
      return NextResponse.json({ error: 'Missing text or emotion' }, { status: 400 });
    }

    // Configure SSML based on emotion
    let ssml = `<speak>${text}</speak>`;
    // Adjust pitch and rate based on emotion for a more expressive voice
    // These values might need tuning based on the specific voice and desired effect
    switch (emotion) {
      case 'happy':
        ssml = `<speak><prosody pitch="+2st" rate="1.1">${text}</prosody></speak>`;
        break;
      case 'sad':
        ssml = `<speak><prosody pitch="-2st" rate="0.9">${text}</prosody></speak>`;
        break;
      case 'empathetic':
        ssml = `<speak><prosody pitch="-1st" rate="0.8">${text}</prosody></speak>`;
        break;
      case 'worried':
        // Slightly higher pitch, normal rate for worried/concerned tone
        ssml = `<speak><prosody pitch="+1st" rate="1.0">${text}</prosody></speak>`;
        break;
      // Add more cases or refine existing ones as needed
      default: // neutral or other emotions
        ssml = `<speak>${text}</speak>`;
    }

    const request = {
      input: { ssml },
      // Using a Vietnamese Neural2 voice. Change languageCode and name for other languages/voices.
      // Example: { languageCode: 'en-US', name: 'en-US-Neural2-C' } for English
      voice: { languageCode: 'vi-VN', name: 'vi-VN-Neural2-A' },
      audioConfig: { audioEncoding: 'MP3' }, // MP3 is widely compatible
    };

    // @ts-ignore - Type mismatch in the library, but the request is valid
    const [response] = await ttsClient.synthesizeSpeech(request);

    if (!response.audioContent) {
      return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 });
    }

    // Return the audio content as MP3
    return new NextResponse(response.audioContent, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mp3',
      },
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during TTS synthesis' }, { status: 500 });
  }
}
