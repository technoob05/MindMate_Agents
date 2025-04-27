import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
// Import new flow functions and types
import {
  generateInitialAgentResponse,
  generateDebateAgentResponse, // Import the debate function
  AgentResponseResult,
  ChatMessage as FlowChatMessageFromFlow // Use alias to avoid conflict
} from '@/ai/flows/inside-out-chat';
import { emotionAgentPersonas } from "@/ai/flows/inside-out-personas"; // Import personas
// Import shared types
import { type AgentName, type TeamChatMessage, type FlowChatMessage } from '@/types/chat';

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');


// Type for the data stored in db.json
interface DbData {
  users: any[];
  chats: {
    one_on_one: any[]; // Assuming structure exists
    ai_team: TeamChatMessage[]; // Use imported TeamChatMessage
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
    // Expecting { text: string, mode?: 'insideOut', conversationId?: string }
    const { text: userText, mode, conversationId: convId } = await request.json();

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
      type: mode === 'insideOut' ? 'insideOut' : 'standard', // Set type based on mode
    };
    db.chats.ai_team.push(userMessage);
    // Write will happen after AI response


    // --- Conditional Logic: Inside Out Mode vs Standard Chain ---

    // Array to hold newly generated AI responses for this turn
    let newAiMessages: TeamChatMessage[] = [];
    // Flag to track if it's the first user turn in this insideOut conversation
    // Check history *before* adding the current user message
    const isFirstInsideOutTurn = !db.chats.ai_team.some(msg => msg.conversationId === conversationId && msg.sender === 'user' && msg.type === 'insideOut');

    if (mode === 'insideOut') {
        console.log(`Processing Inside Out turn for conversation ${conversationId}. First turn: ${isFirstInsideOutTurn}`);

        // --- Generate Initial Responses (Only on the very first user turn) ---
        let initialAgentMessages: TeamChatMessage[] = [];
        if (isFirstInsideOutTurn) {
            console.log("Generating initial agent responses...");
            const initialPromises = emotionAgentPersonas.map(persona =>
                generateInitialAgentResponse(userText, persona)
            );
            const initialAgentResults = await Promise.all(initialPromises);
            console.log("Initial responses generated.");

            // Create messages for initial responses
            initialAgentResults.forEach(result => {
                initialAgentMessages.push({
                    id: crypto.randomUUID(),
                    text: result.responseText,
                    sender: 'ai',
                    agentName: result.emotion as AgentName,
                    timestamp: Date.now(), // Use current time for initial burst
                    conversationId: conversationId,
                    type: 'insideOut',
                    avatar: result.avatar, // Use result.avatar
                });
            });
             // Add initial messages to the list of new messages for this turn
            newAiMessages.push(...initialAgentMessages);
        }

        // --- Generate Automated Debate Sequence ---
        console.log("Initiating automated debate sequence...");
        const debateTurns = 3; // Define how many debate turns happen automatically
        let currentDebateHistory: FlowChatMessage[] = db.chats.ai_team
             .filter(msg => msg.conversationId === conversationId) // Get all previous messages for this convo
             .map(msg => ({ sender: msg.sender === 'user' ? 'user' : (msg.agentName || 'ai'), text: msg.text })); // Format for flow

        // Add the current user message to the history for the first debate turn
        currentDebateHistory.push({ sender: 'user', text: userText });

        // Add initial responses (if generated this turn) to history for the first debate turn
        initialAgentMessages.forEach(msg => {
             currentDebateHistory.push({ sender: msg.agentName || 'ai', text: msg.text });
        });


        // Simulate debate turns
        for (let i = 0; i < debateTurns; i++) {
            // Select an agent to respond - simple round-robin or random for now
            const respondingPersona = emotionAgentPersonas[i % emotionAgentPersonas.length]; // Round robin example

            console.log(`Generating debate response for ${respondingPersona.emotion} (Turn ${i + 1})...`);

            try {
                 const debateResult = await generateDebateAgentResponse(currentDebateHistory, respondingPersona);

                 const debateMessage: TeamChatMessage = {
                    id: crypto.randomUUID(),
                    text: debateResult.responseText,
                    sender: 'ai',
                    agentName: debateResult.emotion as AgentName,
                    // Stagger timestamps slightly to simulate sequence
                    timestamp: Date.now() + (i + 1) * 100,
                    conversationId: conversationId,
                    type: 'insideOut',
                    avatar: respondingPersona.avatar, // Use persona avatar
                 };

                 newAiMessages.push(debateMessage);
                 // Add the new debate message to the history for the next turn
                 currentDebateHistory.push({ sender: debateMessage.agentName || 'ai', text: debateMessage.text });

                 console.log(`${respondingPersona.emotion} debate response generated (Turn ${i + 1}).`);

            } catch (error) {
                 console.error(`Error generating debate response for ${respondingPersona.emotion} (Turn ${i + 1}):`, error);
                 // Optionally add an error message to the chat
                 newAiMessages.push({
                    id: crypto.randomUUID(),
                    text: `(${respondingPersona.emotion} failed to respond)`,
                    sender: 'ai',
                    agentName: respondingPersona.emotion as AgentName,
                    timestamp: Date.now() + (i + 1) * 100,
                    conversationId: conversationId,
                    type: 'insideOut',
                    avatar: respondingPersona.avatar, // Use persona avatar
                 });
            }
        }
        console.log("Automated debate sequence finished.");


        // Save all *newly generated* AI messages (initial + debate) to the database
        db.chats.ai_team.push(...newAiMessages);

    } else {
      // --- Standard LangChain Logic (Single Response) ---
      console.log(`Invoking Standard AI Team chain for conversation ${conversationId}`);
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

    // The chain.invoke call is already here from the original code block
    const aiResponseText = await chain.invoke({
        input: userText,
        chat_history: historyMessages,
    });
    console.log(`Standard AI Team chain response: ${aiResponseText}`);

      // Create standard AI message (single message)
      const standardAiMessage: TeamChatMessage = {
        id: crypto.randomUUID(),
        text: aiResponseText,
        sender: 'ai',
        agentName: 'Coordinator', // Standard agent name
        timestamp: Date.now(),
        conversationId: conversationId,
        type: 'standard',
      };
      newAiMessages.push(standardAiMessage); // Add the single message to the array
      // Save the single standard AI message
      db.chats.ai_team.push(standardAiMessage);
    } // --- End Conditional Logic ---


    // 4. Write updated DB (includes user message and all newly generated AI messages for this turn)
    await writeDb(db);

    // 5. Return *only the newly generated* AI message(s) for this turn to the frontend
    return NextResponse.json(newAiMessages, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/ai-team-chat:', error);
    return NextResponse.json({ message: error.message || 'Error processing AI team chat message' }, { status: 500 });
  }
}
