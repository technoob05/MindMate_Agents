import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import textToSpeech from '@google-cloud/text-to-speech';
import { z } from 'zod';

// Ensure GOOGLE_APPLICATION_CREDENTIALS is set in your environment pointing to your service account key file
// e.g., GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
// Alternatively, ensure the environment has Application Default Credentials configured.

// Initialize Gemini Model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", // Reverted to 1.5-flash for consistency
  temperature: 0.7,
  // topP: 0.95, // Optional: Adjust parameters as needed
  // topK: 40,
});

// Initialize Google Text-to-Speech Client
const ttsClient = new textToSpeech.TextToSpeechClient();

// Define expected input schema
const journalSchema = z.object({
  journalEntry: z.string().min(10, { message: "Journal entry must be at least 10 characters long." }), // Basic validation
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
    const body = await request.json();

    // Validate input
    const validation = journalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid input", details: validation.error.errors }, { status: 400 });
    }

    const { journalEntry } = validation.data;

    console.log("Analyzing journal entry...");

    // --- Step 1: Analyze Emotion and Generate Enhanced Response using Gemini ---
    const messages = [
      new SystemMessage(enhancedAnalysisSystemPrompt), // Use the new enhanced prompt
      new HumanMessage(`Đây là nhật ký của tôi:\n\n${journalEntry}`),
    ];

    const llmResponse = await model.invoke(messages);
    let analysisResult: EnhancedAnalysisResult; // Use the enhanced type

    // Attempt to parse the JSON response from the model
    try {
        // Clean potential markdown code block fences and ensure it's valid JSON
        const rawContent = typeof llmResponse.content === 'string' ? llmResponse.content : '';
        const cleanedContent = rawContent.replace(/```json\n?|\n?```/g, '').trim();

        // Basic check if it looks like JSON before parsing
        if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
            analysisResult = JSON.parse(cleanedContent);
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

    } catch (parseError: any) {
        console.error("Failed to parse or validate LLM response:", parseError.message, "Raw response:", llmResponse.content);
        // Fallback mechanism
        analysisResult = {
            emotion: "Không xác định",
            response: "Cảm ơn bạn đã chia sẻ. Đôi khi chỉ cần viết ra là đã nhẹ lòng hơn rồi.",
        };
    }

    console.log("Analysis result:", analysisResult);

    // --- Step 2: Generate Text-to-Speech Audio (only for the main response) ---
    console.log("Generating TTS audio for main response...");
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
        throw new Error("TTS generation failed, no audio content received.");
    }

    // Convert audio buffer to base64 string
    const audioBase64 = Buffer.from(ttsResponse.audioContent).toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${audioBase64}`;

    console.log("TTS audio generated successfully.");

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
    return NextResponse.json({ error: "Failed to process journal entry", details: error.message || "Unknown error" }, { status: 500 });
  }
}
