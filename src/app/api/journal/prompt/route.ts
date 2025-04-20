import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Ensure you have GOOGLE_API_KEY set in your .env file
// or Application Default Credentials configured for Vertex AI.

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // Corrected parameter name from modelName to model
  temperature: 0.8,
  // apiKey: process.env.GOOGLE_API_KEY, // Handled automatically by Langchain if GOOGLE_API_KEY is set
});

const systemPrompt = `
Bạn là Healing Muse – một AI trị liệu cảm xúc được thiết kế để giúp người dùng tự phản chiếu.
Nhiệm vụ của bạn là tạo ra MỘT câu hỏi gợi ý (prompt) sâu sắc, độc đáo và mang tính suy ngẫm để người dùng viết nhật ký trong ngày.
Câu hỏi nên tập trung vào cảm xúc, sự tự nhận thức, lòng biết ơn, sự tha thứ, hoặc những trải nghiệm cá nhân.
Hãy đảm bảo câu hỏi ngắn gọn, rõ ràng và dễ hiểu.
Tránh những câu hỏi quá chung chung hoặc sáo rỗng.
Ví dụ về các câu hỏi tốt:
- Điều gì bạn học được về bản thân trong tuần qua?
- Khoảnh khắc nào gần đây khiến bạn cảm thấy thực sự bình yên?
- Bạn đang trì hoãn việc đối mặt với cảm xúc nào?
- Nếu có thể nói chuyện với bản thân mình lúc nhỏ, bạn sẽ nói gì?
- Lòng tốt nhỏ bé nào bạn nhận được hoặc trao đi hôm nay?

Chỉ trả về DUY NHẤT câu hỏi gợi ý, không có lời dẫn hay giải thích thêm.
`;

// TODO: Implement caching or fetching from a pre-generated daily prompt stored in Firestore/DB
// For now, it generates a new prompt on each GET request.

export async function GET() {
  try {
    console.log("Generating new journal prompt...");
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage("Hãy tạo một câu hỏi nhật ký cho hôm nay."), // Simple trigger
    ];

    const response = await model.invoke(messages);

    // Ensure response.content is a string
    const promptText = typeof response.content === 'string' ? response.content.trim() : "Hôm nay bạn cảm thấy thế nào về chính mình?"; // Fallback prompt

    console.log("Generated prompt:", promptText);

    // Basic validation to remove potential quotes or extra text if the model didn't follow instructions perfectly
    const cleanedPrompt = promptText.replace(/^["']|["']$/g, ''); // Remove surrounding quotes

    return NextResponse.json({ prompt: cleanedPrompt });

  } catch (error) {
    console.error("Error generating journal prompt:", error);
    // Provide a generic fallback prompt on error
    const fallbackPrompt = "Điều gì mang lại cho bạn niềm vui nhỏ bé hôm nay?";
    return NextResponse.json({ prompt: fallbackPrompt }, { status: 500 });
    // Or return a more specific error message:
    // return NextResponse.json({ error: "Failed to generate prompt", details: error.message }, { status: 500 });
  }
}
