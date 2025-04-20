import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

// Define message structure matching the frontend
interface TeamChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  agentName?: 'Listener' | 'Goal Setter' | 'Resource Finder' | 'Coordinator';
  timestamp: number;
  conversationId?: string; // Add conversation ID for history tracking
}

interface DbData {
  users: any[];
  chats: {
    one_on_one: any[]; // Assuming structure exists
    ai_team: TeamChatMessage[];
    multi_user: any[];
  };
}

// --- Database Helper Functions (Consider moving to a shared lib/db.ts) ---
async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    // Ensure ai_team array exists
    const parsedData = JSON.parse(data);
    if (!parsedData.chats.ai_team) {
        parsedData.chats.ai_team = [];
    }
    return parsedData as DbData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      const defaultData: DbData = { users: [], chats: { one_on_one: [], ai_team: [], multi_user: [] } };
      await fs.writeFile(dbPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    console.error('Error reading database file:', error);
    throw new Error('Could not read database');
  }
}

async function writeDb(data: DbData): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
    throw new Error('Could not write to database');
  }
}
// --- End Database Helper Functions ---


// GET handler to fetch AI Team chat messages
export async function GET() {
  try {
    const db = await readDb();
    return NextResponse.json(db.chats.ai_team);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching AI team messages' }, { status: 500 });
  }
}

// Initialize the Gemini model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  // Add safety settings if needed
});

// POST handler for AI Team Chat
export async function POST(request: Request) {
  try {
    // Expecting { text: string, sender: 'user', conversationId?: string }
    const { text: userText, conversationId: convId } = await request.json();

    if (!userText) {
      return NextResponse.json({ message: 'Invalid message format: text is required' }, { status: 400 });
    }
    // Removed invalid check for userMessageInput below

    const db = await readDb(); // Keep only the first declaration

    const conversationId = convId || crypto.randomUUID(); // Use provided ID or generate a new one

    // Removed second declaration of db below

    // --- Retrieve Chat History ---
    // Filter messages for the current conversation
    const historyMessages = db.chats.ai_team
      .filter(msg => msg.conversationId === conversationId)
      .map(msg => msg.sender === 'user' ? new HumanMessage(msg.text) : new AIMessage(msg.text));
      // Limit history length if needed

    // 1. Save User Message (with conversationId)
    const userMessage: TeamChatMessage = {
      text: userText,
      sender: 'user',
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      conversationId: conversationId,
    };
    db.chats.ai_team.push(userMessage);
    // Write will happen after AI response

    // --- Define Simple Sequential Chain (Listener -> Synthesizer) ---

    // Listener Prompt
    const listenerPrompt = ChatPromptTemplate.fromMessages([
      new SystemMessage("You are the 'Listener' agent in an AI team for mental wellness support. Your role is to carefully read the user's message and the chat history, then provide a brief, empathetic summary focusing on the user's expressed feelings or situation. Do not offer solutions yet. Just listen and summarize."),
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    // Synthesizer Prompt (acts as Coordinator for now)
    const synthesizerPrompt = ChatPromptTemplate.fromMessages([
      new SystemMessage("You are the 'Coordinator' agent in an AI team. You have received the user's message and a summary from the 'Listener' agent. Your task is to synthesize this information and provide a helpful, supportive response to the user. Acknowledge the listener's summary briefly. You can ask a gentle follow-up question if appropriate. Keep the response concise."),
      new MessagesPlaceholder("chat_history"),
      ["human", "User's message: {input}\nListener's summary: {listener_summary}"],
    ]);

    const outputParser = new StringOutputParser();

    // Define the sequence
    const chain = RunnableSequence.from([
        // Passthrough user input and history
        RunnablePassthrough.assign({
            listener_summary: listenerPrompt.pipe(model).pipe(outputParser)
        }),
        // Feed input, history, and listener_summary to synthesizer
        synthesizerPrompt,
        model,
        outputParser
    ]);

    console.log(`Invoking AI Team chain for conversation ${conversationId}`);
    const aiResponseText = await chain.invoke({
        input: userText,
        chat_history: historyMessages,
    });
    console.log(`AI Team chain response: ${aiResponseText}`);

    // 3. Create and Save AI Message
    const aiMessage: TeamChatMessage = {
      id: crypto.randomUUID(),
      text: aiResponseText,
      sender: 'ai',
      agentName: 'Coordinator', // For now, all responses come from the coordinator/synthesizer
      timestamp: Date.now(),
      conversationId: conversationId,
    };
    db.chats.ai_team.push(aiMessage);

    // 4. Write both messages to DB
    await writeDb(db);

    // 5. Return AI message to frontend
    return NextResponse.json(aiMessage, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/ai-team-chat:', error);
    return NextResponse.json({ message: error.message || 'Error processing AI team chat message' }, { status: 500 });
  }
}
