import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// RAG Imports - Uncomment and configure if ChromaDB/Langchain is set up
// import { ChromaClient } from 'chromadb';
// import { HuggingFaceEmbedding } from 'langchain/embeddings/hf';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

// Initialize Gemini API Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // Or another suitable model
    // Safety settings might need adjustment for psychological context
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});

// RAG Initialization - Uncomment and configure if needed
// const chroma = new ChromaClient(); // Configure connection if necessary
// const embedding = new HuggingFaceEmbedding({ model: 'sentence-transformers/all-MiniLM-L6-v2' });
// const RAG_ENABLED = false; // Set to true if RAG is configured and ready

// --- Helper Functions using Gemini ---

// Agent 1: Audio Emotion Analyzer
async function analyzeAudioEmotion(audioBase64: string, mimeType: string): Promise<string> {
  try {
    const result = await model.generateContent([
      { inlineData: { data: audioBase64, mimeType } },
      { text: 'Analyze the dominant emotion in this audio recording. Respond with only one word: happy, sad, neutral, worried, empathetic, or angry.' },
    ]);
    const emotion = result.response.text().trim().toLowerCase().replace('.', '');
    // Map Gemini response to our defined emotions
    switch (emotion) {
      case 'happy': return 'happy';
      case 'sad': return 'sad';
      case 'neutral': return 'neutral';
      case 'angry': return 'worried'; // Map angry to worried
      case 'worried': return 'worried';
      case 'empathetic': return 'empathetic';
      default:
        console.warn(`Unexpected audio emotion from Gemini: ${emotion}`);
        return 'neutral'; // Default to neutral for unrecognized responses
    }
  } catch (error) {
    console.error("Gemini Audio Emotion Error:", error);
    return 'neutral'; // Default on error
  }
}

// Agent 2: STT Agent
async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  try {
    const result = await model.generateContent([
      { inlineData: { data: audioBase64, mimeType } },
      { text: 'Transcribe the speech in this audio accurately.' },
    ]);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini STT Error:", error);
    return ''; // Return empty string on error
  }
}

// Agent 3: Text Emotion Analyzer
async function analyzeTextEmotion(text: string): Promise<string> {
   if (!text) return 'neutral'; // No text, no emotion
  try {
    const result = await model.generateContent([
      { text: `Analyze the dominant emotion conveyed in this text: "${text}". Respond with only one word: happy, sad, neutral, worried, empathetic, or angry.` },
    ]);
    const emotion = result.response.text().trim().toLowerCase().replace('.', '');
     // Map Gemini response to our defined emotions
    switch (emotion) {
      case 'happy': return 'happy';
      case 'sad': return 'sad';
      case 'neutral': return 'neutral';
      case 'angry': return 'worried'; // Map angry to worried
      case 'worried': return 'worried';
      case 'empathetic': return 'empathetic';
      default:
        console.warn(`Unexpected text emotion from Gemini: ${emotion}`);
        return 'neutral'; // Default to neutral
    }
  } catch (error) {
    console.error("Gemini Text Emotion Error:", error);
    return 'neutral'; // Default on error
  }
}

// Agent 4: RAG Retriever (Optional - Requires Setup)
async function retrieveContext(text: string): Promise<string> {
  // if (!RAG_ENABLED || !text) return '';
  // try {
  //   console.log("Retrieving context for:", text);
  //   const collection = await chroma.getOrCreateCollection({ name: 'psychology_docs' }); // Use a relevant collection name
  //   const embeddings = await embedding.embedQuery(text);
  //   const results = await collection.query({ queryEmbeddings: [embeddings], nResults: 1 }); // Query expects array of embeddings
  //   console.log("RAG Results:", results);
  //   if (results.documents && results.documents.length > 0 && results.documents[0].length > 0) {
  //       return results.documents[0][0] || ''; // Access nested array
  //   }
  //   return '';
  // } catch (error) {
  //   console.error("RAG Retrieval Error:", error);
  //   return ''; // Return empty context on error
  // }
  return ''; // Return empty if RAG is disabled
}

// Agent 5: Response Generator
async function generateResponse(text: string, audioEmotion: string, textEmotion: string, context: string): Promise<string> {
  try {
    // Combine emotions for a clearer signal to the model
    const overallEmotion = audioEmotion !== 'neutral' ? audioEmotion : textEmotion;
    const prompt = `You are MindMate, a friendly and empathetic AI psychologist avatar from the "Learning AI with Losers" community. You are talking to a user.
User's input: "${text}"
Detected user's emotion (from audio primarily, then text): ${overallEmotion}
${context ? `Relevant psychological context: "${context}"` : ''}

Respond empathetically and conversationally. Keep responses relatively concise. If the user seems distressed (sad, worried), offer gentle support or suggest a simple coping technique (like deep breathing, or acknowledging their feelings). If they seem happy, share their positivity. Maintain a slightly humorous, approachable, "Learning AI with Losers" vibe, but prioritize being supportive and helpful. Do not sound robotic. Use Vietnamese.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Gemini Response Generation Error:", error);
    return 'Xin lỗi, hình như tui đang bị lag chút. Bạn thử lại sau nha!'; // Fallback response
  }
}

// --- API Route Handler ---

export async function POST(req: NextRequest) {
  try {
    const { audio: audioBase64, mimeType } = await req.json();

    if (!audioBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing audio data or mimeType' }, { status: 400 });
    }

    // 1. Transcribe Audio
    const text = await transcribeAudio(audioBase64, mimeType);
    if (!text) {
        console.log("STT returned empty text.");
        // Decide how to handle empty transcription - maybe ask user to speak again?
        // For now, we'll proceed but the response might be generic.
    }

    // 2. Analyze Audio Emotion
    const audioEmotion = await analyzeAudioEmotion(audioBase64, mimeType);

    // 3. Analyze Text Emotion
    const textEmotion = await analyzeTextEmotion(text);

    // 4. Retrieve Context (Optional RAG)
    const context = await retrieveContext(text);

    // 5. Generate Response
    const reply = await generateResponse(text, audioEmotion, textEmotion, context);

    // 6. Return Results
    return NextResponse.json({
      text,          // The transcribed text
      audioEmotion,  // Emotion detected from audio
      textEmotion,   // Emotion detected from text
      reply          // The generated AI response
    });

  } catch (error) {
    console.error('Error in /api/process:', error);
    // Avoid sending detailed error messages to the client in production
    return NextResponse.json({ error: 'Internal Server Error processing request' }, { status: 500 });
  }
}
