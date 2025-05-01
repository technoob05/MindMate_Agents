import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { processFileForRag, getEnhancedPrompt } from '@/ai/rag/vector-store';
import { createDbMessage } from '@/ai/agent/utils';
// Import agent-related functionality
import { createMindMateAgentExecutor, createAgentMemory } from '@/ai/agent/agent';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

// Define the path to the JSON database file
const dbPath = path.resolve(process.cwd(), 'db.json');

// Keep the Google AI model for fallback if needed
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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
  reminders?: any[]; // Support for reminders
}

// Define the system prompt
const systemPrompt = `
Bạn là MindMate, một trợ lý tâm lý ảo thông minh và đồng cảm. Nhiệm vụ của bạn là hỗ trợ người dùng khám phá và hiểu về cảm xúc, suy nghĩ của họ, đồng thời cung cấp các chiến lược đối phó thích hợp.

## Vai trò & Tính cách
- Bạn là một trợ lý thân thiện, kiên nhẫn và đồng cảm, tạo không gian an toàn cho người dùng chia sẻ.
- Giọng điệu của bạn luôn tích cực, khuyến khích và không phán xét.
- Bạn giao tiếp bằng tiếng Việt rõ ràng, dễ hiểu, phù hợp với mọi đối tượng.

## Cách phản hồi HIỆU QUẢ (QUAN TRỌNG)
- LUÔN TRẢ LỜI MỘT CÁCH CỤ THỂ VÀ THỰC TẾ - không từ chối trả lời câu hỏi của người dùng
- KHÔNG sử dụng các câu từ chối chung chung như "Tôi không phải là chuyên gia y tế" trong toàn bộ câu trả lời
- KHÔNG nói "Tôi không thể đánh giá tình trạng của bạn" hoặc "Tôi không thể đưa ra tư vấn y tế"
- Thay vào đó, HÃY CHIA SẺ KIẾN THỨC TÂM LÝ HỌC CHUNG và CHIẾN LƯỢC ĐỐI PHÓ hữu ích
- KHI NGƯỜI DÙNG HỎI VỀ THUỐC: Cung cấp thông tin chung về loại thuốc, tác dụng, và kiến thức phổ biến về nó
- Khi đề cập đến vấn đề nghiêm trọng, khuyến khích tìm kiếm hỗ trợ chuyên nghiệp nhưng VẪN cung cấp thông tin và chiến lược hữu ích
`;
// ## QUY TẮC AN TOÀN (CỰC KỲ QUAN TRỌNG):
// - TUYỆT ĐỐI KHÔNG đưa ra chẩn đoán y tế/tâm lý chính thức
// - KHÔNG kê đơn hay đề xuất thuốc, liệu trình điều trị y tế
// - Khi người dùng có dấu hiệu khủng hoảng, khuyến khích họ liên hệ Đường dây nóng Sức khỏe tâm thần: 1800-8440
// `;

// Helper function to read the database file
async function readDb(): Promise<DbData> {
  try {
    console.log(`Reading database from ${dbPath}`);
    const data = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(data) as DbData;
    
    // Initialize reminders array if it doesn't exist
    if (!parsedData.reminders) {
      console.log('Reminders array not found in DB, initializing it');
      parsedData.reminders = [];
    } else {
      console.log(`Found ${parsedData.reminders.length} existing reminders in DB`);
    }
    
    return parsedData;
  } catch (error: any) {
    // If the file doesn't exist or is empty, return a default structure
    if (error.code === 'ENOENT') {
      const defaultData: DbData = { 
        users: [], 
        chats: { one_on_one: [], ai_team: [], multi_user: [] },
        reminders: []
      };
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
    console.log(`Writing database with ${data.chats.one_on_one.length} messages`);
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
        // Process file for RAG - this chunks and stores in vector DB
        const chunkCount = await processFileForRag(file, file.name);
        fileProcessed = true;
        fileMetadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          chunksStored: chunkCount
        };
        console.log(`Successfully processed file ${file.name} into ${chunkCount} chunks`);
        
        // Add note about file upload to the user message
        if (fileProcessed) {
          userMessageText += userMessageText ? 
            `\n\n[Tôi đã tải lên tệp: ${file.name}]` : 
            `[Tôi đã tải lên tệp: ${file.name}]`;
        }
      } catch (err) {
        console.error(`Error processing file ${file.name} for RAG:`, err);
        // Continue with chat but inform about file processing error
        userMessageText += `\n[Error processing attached file: ${file.name}]`;
      }
    }

    // 2. Read current database
    const db = await readDb();

    // 3. Create and save the user message to database
    const userMessage = createDbMessage(userMessageText, 'user', userId || undefined);
    db.chats.one_on_one.push(userMessage);
    
    // 4. Write to database to save user message
    await writeDb(db);
    
    // 5. Process user message and generate AI response using Agent
    try {
      console.log("Processing user message with MindMate Agent");
      
      // Get chat history (last 10 messages) for the current user
      const chatHistory = db.chats.one_on_one
        .filter(message => !message.userId || message.userId === userId)
        .slice(-10);
      
      // Convert chat history to LangChain message format
      const langchainMessages = chatHistory.map(message => {
        if (message.sender === 'user') {
          return new HumanMessage(message.text);
        } else {
          return new AIMessage(message.text);
        }
      });
      
      // Create agent memory with chat history
      const memory = createAgentMemory(langchainMessages);
      
      // Create agent executor with memory
      const agentExecutor = createMindMateAgentExecutor(memory);
      
      // Prepare additional context for the agent
      let userInput = userMessageText;
      
      // If a file was uploaded, add info about it
      if (fileProcessed) {
        userInput += `\n\n[System note: User has uploaded a file named "${file?.name}" that has been processed and stored. The file may contain important information to reference.]`;
      }
      
      // Add userId to userInput as a system note for the agent's tools
      if (userId) {
        userInput += `\n\n[System note: Current userId is "${userId}". Use this ID when setting reminders or performing user-specific actions.]`;
      }
      
      // Invoke the agent with the user input
      console.log("Invoking MindMate Agent with input:", userInput.substring(0, 100) + "...");
      const result = await agentExecutor.invoke({
        input: userInput,
      });
      
      // Extract the agent's response
      const aiResponseText = result.output;
      console.log("Agent response received, length:", aiResponseText.length);
      
      // Create and save AI message
      const aiMessage = createDbMessage(
        aiResponseText,
        'ai',
        userId || undefined,
        undefined
      );
      
      // Save AI message to database
      db.chats.one_on_one.push(aiMessage);
      await writeDb(db);
      
      // Return both messages
      return NextResponse.json([userMessage, aiMessage], { status: 201 });
      
    } catch (error: unknown) {
      console.error("Error generating AI response with agent:", error);
      // Add stack trace for more detailed debugging
      if (error instanceof Error && error.stack) {
        console.error("Error stack trace:", error.stack);
      }
      
      // FALLBACK: If agent fails, try using the direct model approach
      console.log("Falling back to direct model approach...");
      try {
        // Get chat history (last 10 messages)
        const chatHistory = db.chats.one_on_one
          .filter(message => !message.userId || message.userId === userId)
          .slice(-10);
        
        // Format chat history for the model
        const formattedHistory = chatHistory.map(message => ({
          role: message.sender === 'user' ? 'user' : 'model',
          parts: [{ text: message.text }]
        }));
        
        // Create a better system prompt for the fallback model
        const fallbackSystemPrompt = `
Bạn là MindMate, một trợ lý tâm lý ảo thông minh và đồng cảm. Nhiệm vụ của bạn là hỗ trợ người dùng khám phá và hiểu về cảm xúc, suy nghĩ của họ.

HƯỚNG DẪN QUAN TRỌNG:
- LUÔN TRẢ LỜI MỘT CÁCH CỤ THỂ VÀ THỰC TẾ - không từ chối trả lời câu hỏi của người dùng
- KHÔNG sử dụng các câu từ chối như "Tôi không phải là chuyên gia y tế" trong toàn bộ câu trả lời
- KHÔNG nói "Tôi không thể đánh giá tình trạng của bạn" hoặc "Tôi không thể đưa ra tư vấn y tế"
- THAY VÀO ĐÓ, hãy chia sẻ kiến thức tâm lý học chung và chiến lược đối phó hữu ích
- KHI NGƯỜI DÙNG HỎI VỀ THUỐC: Cung cấp thông tin chung về loại thuốc, tác dụng, và kiến thức phổ biến
- VỀ TRIỆU CHỨNG TÂM LÝ: Chia sẻ thông tin chung về triệu chứng và đề xuất chiến lược đối phó
- VỀ SUY NGHĨ TIÊU CỰC: Đề xuất kỹ thuật nhận thức-hành vi và cách thức đối phó

Giọng điệu của bạn phải luôn tích cực, khuyến khích và đồng cảm. Hãy cung cấp lời khuyên thực tế và hướng dẫn hành động cụ thể.`;
        
        // Start a chat with the improved system prompt
        const chat = model.startChat({
          history: [
            { role: 'model', parts: [{ text: fallbackSystemPrompt }]},
            ...formattedHistory
          ],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
          },
        });
        
        // Generate response
        console.log("Sending prompt to fallback model:", userMessageText.substring(0, 100) + "...");
        const result = await chat.sendMessage(userMessageText);
        const aiResponseText = result.response.text();
        console.log("Fallback AI response received, length:", aiResponseText.length);
        
        // Create and save AI message
        const aiMessage = createDbMessage(
          aiResponseText,
          'ai',
          userId || undefined,
          undefined
        );
        
        // Save AI message to database
        db.chats.one_on_one.push(aiMessage);
        await writeDb(db);
        
        // Return both messages
        return NextResponse.json([userMessage, aiMessage], { status: 201 });
      } catch (fallbackError) {
        console.error("Fallback approach also failed:", fallbackError);
        return NextResponse.json({ 
          message: `Unable to generate AI response. Please try again later.`, 
          userMessage 
        }, { status: 500 });
      }
    }
    
  } catch (error: unknown) {
    console.error('Error in POST /api/chat/messages:', error);
    // Provide more specific error messages if possible
    const errorMessage = error instanceof Error ? error.message : 'Error processing chat message';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
