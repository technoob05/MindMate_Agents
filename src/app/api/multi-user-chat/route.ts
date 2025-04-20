import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
// TODO: Import WebSocket server instance for broadcasting

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

// Define message structure matching the frontend
interface MultiUserMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  roomId: string; // Make roomId mandatory
  isModerated?: boolean;
  moderationAction?: string;
  // Add toxicity scores etc. from Perspective API if needed
}

// Define structure for reports
interface Report {
    reportId: string;
    messageId: string;
    roomId: string;
    reporterUserId: string;
    timestamp: number;
    reason?: string; // Optional reason from user
    status: 'pending' | 'reviewed' | 'action_taken';
}

interface DbData {
  users: any[];
  chats: {
    one_on_one: any[];
    ai_team: any[];
    // Changed to store messages per room
    multi_user_rooms: { [roomId: string]: MultiUserMessage[] };
  };
  reports: Report[]; // Add reports array
}

// --- Database Helper Functions ---
async function readDb(): Promise<DbData> {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data);
    // Ensure default structures exist
    parsedData.users = parsedData.users || [];
    parsedData.chats = parsedData.chats || {};
    parsedData.chats.one_on_one = parsedData.chats.one_on_one || [];
    parsedData.chats.ai_team = parsedData.chats.ai_team || [];
    parsedData.chats.multi_user_rooms = parsedData.chats.multi_user_rooms || {}; // Initialize as object
    parsedData.reports = parsedData.reports || []; // Initialize reports array
    return parsedData as DbData;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Create default structure if file doesn't exist
      const defaultData: DbData = {
          users: [],
          chats: { one_on_one: [], ai_team: [], multi_user_rooms: {} },
          reports: []
      };
      await writeDb(defaultData); // Use writeDb to create the file
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

// Initialize the Gemini model for moderation
const moderationModel = new ChatGoogleGenerativeAI({
  model: "gemini-pro",
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  temperature: 0.1, // Low temperature for consistent moderation decisions
  // Consider adding safetySettings to block harmful content generation by the model itself
  // safetySettings: [
  //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  //   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  // ],
});

// Define the Moderation Prompt Template
const moderationPrompt = ChatPromptTemplate.fromTemplate(
`You are a content moderator for a supportive mental wellness online community. Your task is to analyze the user's message and determine if it violates the community guidelines.

Community Guidelines:
- Be respectful and kind. No harassment, bullying, or hate speech.
- No explicit content, excessive profanity, or graphic descriptions of violence/self-harm.
- No spam, advertising, or solicitation.
- Keep discussions supportive and constructive. Avoid excessive negativity or complaining without seeking support.
- Do not give medical advice. Encourage seeking professional help when appropriate.

Analyze the following message:
---
{message_text}
---

Based ONLY on the message text and the guidelines, respond with ONE of the following words:
- ALLOW: If the message follows the guidelines.
- BLOCK: If the message clearly violates the guidelines (e.g., hate speech, harassment, explicit content, spam, direct medical advice).
- FLAG: If the message is borderline, potentially harmful (e.g., overly negative without seeking support, graphic self-harm description without trigger warning, potentially harmful advice), or requires human review.

Your response must be only one word: ALLOW, BLOCK, or FLAG.`
);

// Create the moderation chain
const moderationChain = RunnableSequence.from([
    moderationPrompt,
    moderationModel,
    new StringOutputParser(),
]);


// GET handler to fetch messages for a specific room
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ message: 'roomId query parameter is required' }, { status: 400 });
  }

  console.log(`GET request for roomId: ${roomId}`); // Debug log

  try {
    const db = await readDb();
    const roomMessages = db.chats.multi_user_rooms[roomId] || []; // Get messages for the room or default to empty array
    console.log(`Returning ${roomMessages.length} messages for room ${roomId}`); // Debug log
    return NextResponse.json(roomMessages);
  } catch (error) {
    console.error(`Error fetching messages for room ${roomId}:`, error);
    return NextResponse.json({ message: `Error fetching messages for room ${roomId}` }, { status: 500 });
  }
}

// POST handler for Multi-User Chat
export async function POST(request: Request) {
  try {
    // Expect roomId in the payload now
    const messageInput: Omit<MultiUserMessage, 'id' | 'timestamp' | 'isModerated' | 'moderationAction'> & { roomId: string } = await request.json();

    // Validate required fields including roomId
    if (!messageInput || !messageInput.text || !messageInput.senderId || !messageInput.senderName || !messageInput.roomId) {
      return NextResponse.json({ message: 'Invalid message format: text, senderId, senderName, and roomId required' }, { status: 400 });
    }

    const { roomId, ...restOfMessageInput } = messageInput; // Separate roomId

    // --- AI Moderation Step using Gemini ---
    console.log(`Performing moderation check for: "${messageInput.text}"`);
    let moderationDecision: string;
    let moderationAction: 'blocked' | 'flagged' | undefined = undefined;
    let isModerated = false;

    try {
        // Use restOfMessageInput.text for moderation check
        moderationDecision = (await moderationChain.invoke({ message_text: restOfMessageInput.text })).toUpperCase().trim();
        console.log(`Moderation decision for room ${roomId}: ${moderationDecision}`);
    } catch (modError: any) {
        console.error(`Error during moderation check for room ${roomId}:`, modError);
        // Fail open? Or block by default on error? For safety, maybe flag on error.
        moderationDecision = "FLAG";
        moderationAction = "flagged";
        isModerated = true;
        // Optionally log the error associated with the message
    }

    // Handle Moderation Decision
    if (moderationDecision === "BLOCK") {
        console.log(`Message blocked by moderation in room ${roomId}: "${restOfMessageInput.text}"`);
        // Do NOT save the message to DB
        // Return error to the sender
        return NextResponse.json({ message: 'Your message could not be posted due to community guidelines.' }, { status: 403 }); // Forbidden
    }

    if (moderationDecision === "FLAG") {
        console.log(`Message flagged by moderation in room ${roomId}: "${restOfMessageInput.text}"`);
        moderationAction = "flagged";
        isModerated = true;
        // Message will still be saved below, but with flags
    }

    // --- Save Message if Allowed or Flagged ---
    const db = await readDb();

    const newMessage: MultiUserMessage = {
      ...restOfMessageInput, // Use the rest of the input
      roomId: roomId, // Add the validated roomId
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isModerated: isModerated,
      moderationAction: moderationAction,
    };

    // Ensure the room array exists in the database
    if (!db.chats.multi_user_rooms[roomId]) {
      db.chats.multi_user_rooms[roomId] = [];
    }

    // Push the new message to the correct room's array
    db.chats.multi_user_rooms[roomId].push(newMessage);

    await writeDb(db);
    // --- End Save Message ---

    // ------------------------------------------------------------------
    // TODO: WebSocket Broadcasting Step
    // 1. Get WebSocket server instance
    // 2. Find clients connected to the relevant room (newMessage.roomId)
    // 3. Broadcast the newMessage object to those clients
    //    websocketServer.broadcast(newMessage, newMessage.roomId);
    // ------------------------------------------------------------------
    console.log(`Broadcasting message to room ${newMessage.roomId} via WebSocket (Not Implemented): ${newMessage.id}`);


    // Return the saved message
    return NextResponse.json(newMessage, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/multi-user-chat:', error);
    return NextResponse.json({ message: error.message || 'Error processing multi-user chat message' }, { status: 500 });
  }
}
