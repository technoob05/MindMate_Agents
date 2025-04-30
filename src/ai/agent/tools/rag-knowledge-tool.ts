import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getEnhancedPrompt } from "@/ai/rag/vector-store";

/**
 * Tool for searching and retrieving information from uploaded documents
 */
export const ragKnowledgeTool = new DynamicStructuredTool({
  name: "rag_knowledge_search",
  description: "Tìm kiếm thông tin từ tài liệu mà người dùng đã tải lên. Dùng công cụ này KHI và CHỈ KHI người dùng hỏi về nội dung cụ thể trong tài liệu, hoặc khi cần thông tin chi tiết từ tài liệu để trả lời người dùng.",
  schema: z.object({
    query: z.string().describe("Câu hỏi cần tìm câu trả lời trong tài liệu. Hãy sử dụng chính xác câu hỏi của người dùng hoặc diễn đạt lại một cách rõ ràng."),
  }),
  func: async ({ query }) => {
    console.log(`RAG knowledge tool called with query: ${query}`);
    try {
      // Use the existing RAG functionality
      console.log("Calling getEnhancedPrompt for RAG search");
      const enhancedPromptData = await getEnhancedPrompt(query);
      console.log(`RAG search complete, found context: ${enhancedPromptData.hasContext}, docs: ${enhancedPromptData.sourceDocs.length}`);
      
      if (!enhancedPromptData.hasContext || enhancedPromptData.sourceDocs.length === 0) {
        console.log("No relevant information found in documents");
        return "Không tìm thấy thông tin liên quan trong tài liệu. Hãy trả lời dựa trên kiến thức chung của bạn.";
      }
      
      // Format the information from the documents with better structure
      const relevantInfo = enhancedPromptData.sourceDocs
        .map((doc, i) => {
          // Extract metadata to provide source information if available
          const metadata = doc.metadata || {};
          const source = metadata.source || 'Tài liệu không xác định';
          const page = metadata.page ? `trang ${metadata.page}` : '';
          
          return `[Trích đoạn ${i + 1} - ${source} ${page}]\n${doc.pageContent}\n`;
        })
        .join("\n");
      
      console.log(`Returning ${enhancedPromptData.sourceDocs.length} relevant information snippets`);
      return `Thông tin liên quan từ tài liệu:\n\n${relevantInfo}\n\nHãy sử dụng thông tin trên để trả lời câu hỏi: "${query}"`;
    } catch (error) {
      console.error("Error using RAG knowledge tool:", error);
      // Return a more specific error message based on the type of error
      if (error instanceof Error) {
        return `Đã xảy ra lỗi khi tìm kiếm thông tin trong tài liệu: ${error.message}`;
      }
      return "Đã xảy ra lỗi khi tìm kiếm thông tin trong tài liệu.";
    }
  },
}); 