import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import {
  generateOnDemandSummary,
  OnDemandSummaryResult, // Import the missing type
  ChatMessage as FlowChatMessageFromFlow // Use alias
} from '@/ai/flows/inside-out-chat';

// Import shared types
import { type AgentName, type TeamChatMessage, type SummaryResult, type FlowChatMessage } from '@/types/chat';


// Define the path to the JSON database file (relative to project root)
const dbPath = path.resolve(process.cwd(), 'db.json');


// Type for the data stored in db.json (Duplicated - consider moving to shared lib)
interface DbData {
  users: any[];
  chats: {
    one_on_one: any[];
    ai_team: TeamChatMessage[]; // Use imported TeamChatMessage
    multi_user: any[];
  };
}

// --- Database Helper Function (Duplicated - move to shared lib) ---
async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data);
    if (!parsedData.chats || !parsedData.chats.ai_team) {
        // Initialize if structure is missing
        parsedData.chats = parsedData.chats || {};
        parsedData.chats.ai_team = parsedData.chats.ai_team || [];
    }
    return parsedData as DbData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return default structure (don't write here)
      console.warn("db.json not found, returning empty structure for read.");
      return { users: [], chats: { one_on_one: [], ai_team: [], multi_user: [] } };
    }
    console.error('Error reading database file:', error);
    throw new Error('Could not read database');
  }
}
// --- End Database Helper Function ---

// POST handler for generating summary
export async function POST(request: Request) {
  try {
    // Expecting { conversationId: string } in the body
    // We need the *first* user message of the conversation for the summary context.
    const { conversationId } = await request.json();

    if (!conversationId) {
      return NextResponse.json({ message: 'Invalid request: conversationId is required' }, { status: 400 });
    }

    console.log(`Generating summary for conversation: ${conversationId}`);

    const db = await readDb();

    // Filter messages for the specific conversation
    const conversationMessages = db.chats.ai_team.filter(
      msg => msg.conversationId === conversationId
    );

    if (conversationMessages.length === 0) {
      return NextResponse.json({ message: 'Conversation not found or empty' }, { status: 404 });
    }

    // Find the first user message in this conversation to use as original input context
    const firstUserMessage = conversationMessages.find(msg => msg.sender === 'user');
    const originalUserInput = firstUserMessage?.text || "User input not found."; // Fallback

    // Format messages for the flow function
    const formattedHistory: FlowChatMessage[] = conversationMessages.map(msg => ({
      sender: msg.sender === 'user' ? 'user' : (msg.agentName || 'ai'), // Use agent name or 'ai'
      text: msg.text,
    }));

    // Call the summary generation function from the flow
    const summaryResult: OnDemandSummaryResult = await generateOnDemandSummary(
      formattedHistory,
      originalUserInput
    );

    console.log(`Summary generated for conversation: ${conversationId}`);

    // Return the summary and advice
    return NextResponse.json(summaryResult, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/ai-team-chat/summarize:', error);
    return NextResponse.json({ message: error.message || 'Error generating summary' }, { status: 500 });
  }
}
