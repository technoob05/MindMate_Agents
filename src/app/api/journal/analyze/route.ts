import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import * as textToSpeech from '@google-cloud/text-to-speech';
import { z } from 'zod';

// Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment pointing to your service account key file
// e.g., GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
// Alternatively, ensure the environment has Application Default Credentials configured.

// Check if Google AI credentials are configured
const isGoogleAIConfigured = !!process.env.GOOGLE_API_KEY;

// Initialize Gemini Model if credentials are available
let model: ChatGoogleGenerativeAI | undefined;
try {
  if (isGoogleAIConfigured) {
    model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash", // Reverted to 1.5-flash for consistency
      temperature: 0.7,
      // topP: 0.95, // Optional: Adjust parameters as needed
      // topK: 40,
    });
    console.log("Google AI model initialized successfully");
  } else {
    console.warn("Google AI API key not configured, will use fallback mode");
  }
} catch (error) {
  console.error("Failed to initialize Google AI model:", error);
  // Continue without AI model
}

// Check if credentials are properly configured
const isTTSCredentialsConfigured = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                                 (process.env.GOOGLE_API_KEY && process.env.GOOGLE_PROJECT_ID);

// Initialize Google Text-to-Speech Client only if credentials are available
let ttsClient: textToSpeech.TextToSpeechClient | undefined;
try {
  if (isTTSCredentialsConfigured) {
    ttsClient = new textToSpeech.TextToSpeechClient();
    console.log("TTS client initialized successfully");
  } else {
    console.warn("Google TTS credentials not configured properly, audio generation will be skipped");
  }
} catch (error) {
  console.error("Failed to initialize TTS client:", error);
  // Continue without TTS
}

// Define expected input schema
const journalSchema = z.object({
  journalEntry: z.string().min(1, { message: "Journal entry cannot be empty." }), // Reduce minimum length requirement
});

// Define the structure for the enhanced analysis result
interface EnhancedAnalysisResult {
    emotion: string;
    response: string; // Main therapeutic response
    insight?: string; // Optional deeper thought/reflection
    action?: string;  // Optional suggested small action
    quote?: string;   // Optional relevant quote
}

// System prompt for enhanced analysis and diverse response generation
const enhancedAnalysisSystemPrompt = `
Bạn là Healing Muse – một AI trị liệu cảm xúc tinh tế, đồng cảm và sâu sắc.
Nhiệm vụ của bạn là đọc kỹ đoạn nhật ký của người dùng, thực hiện các bước sau:

1.  **Xác định Cảm xúc Chính:** Chọn MỘT nhãn cảm xúc phù hợp nhất từ danh sách: [Buồn, Lo âu, Biết ơn, Hy vọng, Mệt mỏi, Tự hào, Tích cực, Giận dữ, Bối rối, Bình yên].
2.  **Điều chỉnh Giọng điệu (Persona):** Dựa vào cảm xúc đã xác định, hãy điều chỉnh giọng văn phản hồi cho phù hợp:
    *   Buồn/Lo âu/Mệt mỏi/Giận dữ: Giọng cực kỳ nhẹ nhàng, xoa dịu, đồng cảm sâu sắc.
    *   Biết ơn/Hy vọng/Tự hào/Tích cực/Bình yên: Giọng ấm áp, khích lệ, chia sẻ niềm vui một cách tinh tế.
    *   Bối rối: Giọng rõ ràng, trấn an, gợi mở nhẹ nhàng.
3.  **Tạo Phản hồi Chính (response):** Viết một đoạn phản hồi chính (khoảng 1-3 câu) thể hiện sự thấu hiểu, công nhận cảm xúc của người dùng. Sử dụng giọng điệu đã điều chỉnh ở bước 2.
4.  **Thêm Giá trị Gia tăng (Optional):** Dựa trên nội dung nhật ký và cảm xúc, chọn MỘT trong các cách sau để làm phong phú thêm phản hồi (nếu thấy phù hợp và có ý nghĩa, nếu không thì bỏ qua):
    *   **insight:** Một suy ngẫm sâu sắc hơn, một góc nhìn mới liên quan đến nội dung nhật ký (1-2 câu).
    *   **action:** Một gợi ý hành động nhỏ, cụ thể, mang tính xây dựng hoặc tự chăm sóc (ví dụ: "Hôm nay thử dành 5 phút hít thở sâu xem sao nhé?", "Hãy viết ra 3 điều bạn biết ơn về bản thân mình.").
    *   **quote:** Một câu trích dẫn ngắn gọn, phù hợp với tình huống hoặc cảm xúc.

**Định dạng Output:** Chỉ trả về một đối tượng JSON hợp lệ với cấu trúc sau. Bao gồm \`emotion\` và \`response\` bắt buộc. Các trường \`insight\`, \`action\`, \`quote\` là tùy chọn, chỉ thêm MỘT trong số chúng nếu thực sự phù hợp.
Ví dụ JSON Output: \`{"emotion": "Lo âu", "response": "Phản hồi...", "action": "Gợi ý hành động..."}\` hoặc \`{"emotion": "Biết ơn", "response": "Phản hồi..."}\`
---
Nhật ký người dùng sẽ được cung cấp sau.
`;


export async function POST(request: Request) {
  try {
    // Validate request body can be parsed as JSON
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body as JSON:", parseError);
      return NextResponse.json({ 
        error: "Invalid JSON in request body", 
        details: parseError instanceof Error ? parseError.message : "Unknown parse error" 
      }, { status: 400 });
    }

    // Validate input schema
    const validation = journalSchema.safeParse(body);
    if (!validation.success) {
      console.error("Journal schema validation failed:", validation.error.errors);
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { journalEntry } = validation.data;

    // Safety check for empty entries after trimming
    if (!journalEntry.trim()) {
      return NextResponse.json({ error: "Journal entry cannot be empty" }, { status: 400 });
    }

    console.log("Analyzing journal entry, length:", journalEntry.length);

    // --- Step 1: Analyze Emotion and Generate Enhanced Response using AI or fallback ---
    let analysisResult: EnhancedAnalysisResult;
    
    if (model && isGoogleAIConfigured) {
      try {
        // Use AI model
        const messages = [
          new SystemMessage(enhancedAnalysisSystemPrompt),
          new HumanMessage(`Đây là nhật ký của tôi:\n\n${journalEntry}`),
        ];

        const llmResponse = await model.invoke(messages);
        
        // Clean potential markdown code block fences and ensure it's valid JSON
        const rawContent = typeof llmResponse.content === 'string' ? llmResponse.content : '';
        console.log("Raw LLM response:", rawContent);
        
        const cleanedContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();

        // Basic check if it looks like JSON before parsing
        if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
            try {
                analysisResult = JSON.parse(cleanedContent);
            } catch (jsonParseError) {
                console.error("Failed to parse LLM response as JSON:", jsonParseError, "Raw:", cleanedContent);
                throw new Error("Invalid JSON returned from AI model");
            }
            
            // Validate required fields
            if (!analysisResult.emotion || !analysisResult.response) {
                console.warn("LLM response missing required fields (emotion/response). Raw:", rawContent);
                throw new Error("Invalid JSON structure received from LLM (missing required fields).");
            }
            // Ensure only one optional field is present if any
            const optionalFieldsCount = [analysisResult.insight, analysisResult.action, analysisResult.quote].filter(Boolean).length;
            if (optionalFieldsCount > 1) {
                 console.warn("LLM response included more than one optional field. Keeping only the first.", analysisResult);
                 // Prioritize insight > action > quote if multiple exist (simple cleanup)
                 if (analysisResult.insight) { analysisResult.action = undefined; analysisResult.quote = undefined; }
                 else if (analysisResult.action) { analysisResult.quote = undefined; }
            }
        } else {
             console.warn("LLM response doesn't look like JSON. Raw:", rawContent);
             throw new Error("Invalid response format received from LLM (not JSON).");
        }
      } catch (aiError) {
        console.error("Error using AI model:", aiError);
        // Fall back to simple analysis
        analysisResult = generateFallbackAnalysis(journalEntry);
      }
    } else {
      // Use fallback without AI
      console.log("Using fallback analysis mode (no AI)");
      analysisResult = generateFallbackAnalysis(journalEntry);
    }

    console.log("Analysis result:", analysisResult);

    // --- Step 2: Generate Text-to-Speech Audio (only for the main response) ---
    console.log("Generating TTS audio for main response...");
    
    let audioDataUrl = '';
    
    // Skip TTS if client not available
    if (ttsClient) {
      try {
        const ttsRequest = {
          input: { text: analysisResult.response }, // Use only the main response for TTS
          // Voice selection (Vietnamese Female)
          voice: { languageCode: 'vi-VN', name: 'vi-VN-Wavenet-C' },
          // Corrected audioEncoding to use the specific literal type expected by the library
          audioConfig: { audioEncoding: 'MP3' as const },
        };

        // Correctly await the promise and access the first element of the result array
        const ttsResponses = await ttsClient.synthesizeSpeech(ttsRequest);
        const ttsResponse = ttsResponses[0];

        if (!ttsResponse || !ttsResponse.audioContent) {
            console.warn("TTS generation failed, no audio content received.");
        } else {
            // Convert audio buffer to base64 string
            const audioBase64 = Buffer.from(ttsResponse.audioContent).toString('base64');
            audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;
            console.log("TTS audio generated successfully.");
        }
      } catch (ttsError) {
        console.error("Error generating text-to-speech:", ttsError);
        // Continue without audio - don't fail the whole request
      }
    } else {
      console.log("Skipping TTS generation (client unavailable)");
    }

    // --- Step 3: Return Combined Enhanced Result ---
    return NextResponse.json({
      emotion: analysisResult.emotion,
      response: analysisResult.response,
      insight: analysisResult.insight, // Include optional fields
      action: analysisResult.action,
      quote: analysisResult.quote,
      audioDataUrl: audioDataUrl,
    });

  } catch (error: any) {
    console.error("Error processing journal entry:", error);
    return NextResponse.json({ 
      error: "Failed to process journal entry", 
      details: error.message || "Unknown error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// Simple function to generate a fallback analysis without AI
function generateFallbackAnalysis(journalEntry: string): EnhancedAnalysisResult {
  // Simple heuristic to determine sentiment/emotion from text length
  let emotion = "Không xác định";
  let response = "Cảm ơn bạn đã chia sẻ suy nghĩ của mình. Việc viết nhật ký thường xuyên là một cách tuyệt vời để tự chăm sóc bản thân.";
  
  // Maybe add an insight based on text length
  let insight: string | undefined;
  
  if (journalEntry.length > 500) {
    insight = "Bạn đã viết khá nhiều, điều này cho thấy bạn có nhiều điều muốn chia sẻ và khám phá.";
  }
  
  return {
    emotion,
    response,
    insight
  };
}
