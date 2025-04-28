import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { processFileForRag, getEnhancedPrompt } from '@/ai/rag/vector-store';

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  userId?: string; // Add userId to associate messages with specific users
  chatId?: string; // Optional: To group messages belonging to the same conversation
  sourceDocs?: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
}

interface DbData {
  users: any[]; // Define user structure later if needed
  chats: {
    one_on_one: Message[];
    ai_team: any[]; // Define later
    multi_user: any[]; // Define later
  };
}

// Helper function to read the database file
async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data) as DbData;
  } catch (error: any) {
    // If the file doesn't exist or is empty, return a default structure
    if (error.code === 'ENOENT') {
      const defaultData: DbData = { users: [], chats: { one_on_one: [], ai_team: [], multi_user: [] } };
      await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    console.error('Error reading database file:', error);
    // In a real app, handle errors more robustly
    throw new Error('Could not read database');
  }
}

// Helper function to write to the database file
async function writeDb(data: DbData): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
    // In a real app, handle errors more robustly
    throw new Error('Could not write to database');
  }
}

// GET handler to fetch 1-on-1 chat messages for the current user
export async function GET(request: Request) {
  try {
    // Extract user ID from the query parameter
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // If no user ID provided, return empty array
    if (!userId) {
      return NextResponse.json([]);
    }

    const db = await readDb();
    
    // Filter messages to only return those belonging to the current user
    const userMessages = db.chats.one_on_one.filter(message => 
      !message.userId || message.userId === userId
    );
    
    return NextResponse.json(userMessages);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching messages' }, { status: 500 });
  }
}

// Initialize the Gemini model
// Ensure GOOGLE_GENAI_API_KEY is set in your .env file
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // Corrected property name from modelName to model
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_GENAI_API_KEY, // Use the correct env variable name
});

// POST handler to add a new 1-on-1 chat message and get AI response
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const text = formData.get('text') as string | null;
    const sender = formData.get('sender') as string | null;
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    // Basic validation
    if (sender !== 'user') {
      return NextResponse.json({ message: 'Invalid sender' }, { status: 400 });
    }
    if (!text && !file) {
        return NextResponse.json({ message: 'No text or file provided' }, { status: 400 });
    }

    let userMessageText = text || ""; // Use empty string if no text but file exists
    let fileProcessed = false;
    let fileMetadata: {
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      chunksStored?: number;
    } = {};

    // 1. Process File (if exists) - Add to vector database
    if (file) {
      console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      try {
        // Process file for RAG - this now chunks and stores in vector DB
        const chunkCount = await processFileForRag(file, file.name);
        fileProcessed = true;
        fileMetadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          chunksStored: chunkCount
        };
        console.log(`Successfully processed file ${file.name} into ${chunkCount} chunks`);
      } catch (err) {
        console.error(`Error processing file ${file.name} for RAG:`, err);
        // Continue with chat but inform about file processing error
        userMessageText += `\n[Error processing attached file: ${file.name}]`;
      }
    }

    const db = await readDb();

    // 2. Save User Message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: userMessageText, // Save the original text message
      sender: 'user',
      timestamp: Date.now(),
      userId: userId || undefined, // Associate message with user ID if available
      // chatId: userMessageInput.chatId // If you need to associate with a specific chat thread
    };
    db.chats.one_on_one.push(userMessage);

    // 3. Get enhanced prompt with relevant context, if any
    const enhancedPromptData = await getEnhancedPrompt(userMessageText);
    
    let promptToUse = enhancedPromptData.prompt;
    
    // If file was just uploaded but not yet in context, add a note for the AI
    if (fileProcessed) {
      promptToUse = `${promptToUse}\n\n[System: The user has just uploaded a file named "${file?.name}" which has been processed into ${fileMetadata.chunksStored} chunks with embeddings. You can now answer questions about its contents. Remember to never explicitly mention if information is not found in the file - just answer directly from your knowledge when needed.]`;
    }

    // 4. Call AI Model with enhanced prompt (includes relevant chunks if available)
    console.log(`Invoking Gemini ${enhancedPromptData.hasContext ? 'with RAG context from ' + enhancedPromptData.sourceDocs.length + ' relevant chunks' : 'without context'}`);
    // Add a last reminder before sending to model
    promptToUse = `${promptToUse}\n\nImportant: If the question is not about the file content, just answer it directly without mentioning the file or context at all.`;
    const aiResponse = await model.invoke([
        new HumanMessage(promptToUse),
    ]);
    console.log(`Gemini response received`);

    if (typeof aiResponse.content !== 'string') {
        console.error("AI response content is not a string:", aiResponse.content);
        return NextResponse.json({ message: 'Error processing AI response' }, { status: 500 });
    }

    // 5. Create and Save AI Message
    const aiMessage: Message = {
      id: crypto.randomUUID(),
      text: aiResponse.content,
      sender: 'ai',
      timestamp: Date.now(),
      userId: userId || undefined, // Associate message with user ID if available
      chatId: userMessage.chatId, // Keep the same chat ID if provided
      // Include source documents if RAG was used and they're actually relevant
      sourceDocs: enhancedPromptData.hasContext ? enhancedPromptData.sourceDocs : undefined
    };
    db.chats.one_on_one.push(aiMessage); // Add AI message to the array

    // 6. Write both messages to DB
    await writeDb(db);

    // 7. Return AI message to frontend
    return NextResponse.json(aiMessage, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/chat/messages:', error);
    // Provide more specific error messages if possible
    const errorMessage = error.message || 'Error processing chat message';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
