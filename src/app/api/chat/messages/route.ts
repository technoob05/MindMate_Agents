import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  chatId?: string; // Optional: To group messages belonging to the same conversation
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

// GET handler to fetch 1-on-1 chat messages
export async function GET() {
  try {
    const db = await readDb();
    // For now, return all 1-on-1 messages. Add filtering/pagination later.
    return NextResponse.json(db.chats.one_on_one);
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

    // Basic validation
    if (sender !== 'user') {
      return NextResponse.json({ message: 'Invalid sender' }, { status: 400 });
    }
    if (!text && !file) {
        return NextResponse.json({ message: 'No text or file provided' }, { status: 400 });
    }

    let fileContent: string | null = null;
    let userMessageText = text || ""; // Use empty string if no text but file exists

    // 1. Process File (if exists)
    if (file) {
      console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      // Basic check for text file type (can be expanded)
      if (file.type === 'text/plain') {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          fileContent = buffer.toString('utf-8');
          console.log(`Successfully read content from ${file.name}`);
        } catch (err) {
          console.error(`Error reading file ${file.name}:`, err);
          // Optionally return an error or just proceed without file content
          // return NextResponse.json({ message: `Error reading file: ${file.name}` }, { status: 500 });
        }
      } else {
        console.warn(`Unsupported file type: ${file.type}. Only text/plain is currently supported.`);
        // Optionally inform the user via the AI response later or return an error
      }
    }

    const db = await readDb();

    // 2. Save User Message
    // The frontend optimistically adds "[Attached: filename]", so we save the original text
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: userMessageText, // Save the original text message
      sender: 'user',
      timestamp: Date.now(),
      // chatId: userMessageInput.chatId // If you need to associate with a specific chat thread
    };
    db.chats.one_on_one.push(userMessage);
    // We write later after getting the AI response

    // 3. Prepare AI Input (Combine text and file content)
    let promptText = userMessageText;
    if (fileContent) {
      // Simple prefixing strategy
      promptText = `[Content from file: ${file?.name || 'uploaded file'}]:\n${fileContent}\n\n[User message]:\n${userMessageText}`;
      console.log(`Combined prompt includes content from ${file?.name}`);
    } else if (file && !fileContent) {
        // If file was present but not readable/supported
        promptText += `\n\n[System note: A file named "${file.name}" was attached but could not be read or is not a supported format (currently only .txt). Please inform the user if relevant.]`;
    }

    // 4. Call AI Model
    console.log(`Invoking Gemini with combined prompt (length: ${promptText.length})`);
    const aiResponse = await model.invoke([
        // TODO: Add chat history for context later
        new HumanMessage(promptText), // Use the potentially combined prompt
    ]);
    console.log(`Gemini response: ${aiResponse.content}`);

    if (typeof aiResponse.content !== 'string') {
        console.error("AI response content is not a string:", aiResponse.content);
        return NextResponse.json({ message: 'Error processing AI response' }, { status: 500 });
    }

    // 3. Create and Save AI Message
    const aiMessage: Message = {
      id: crypto.randomUUID(),
      text: aiResponse.content,
      sender: 'ai',
      timestamp: Date.now(),
      chatId: userMessage.chatId // Keep the same chat ID if provided
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
