import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Define the database message format
interface DbMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  userId?: string;
  chatId?: string;
  sourceDocs?: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>;
}

/**
 * Convert database chat messages to LangChain conversation messages
 * @param messages Array of database messages
 * @returns Array of LangChain BaseMessage objects
 */
export function dbMessagesToConversationMessages(messages: DbMessage[]): BaseMessage[] {
  return messages.map(message => {
    if (message.sender === 'user') {
      return new HumanMessage({
        content: message.text,
        // Optional additional metadata if needed
        additional_kwargs: {
          id: message.id,
          timestamp: message.timestamp,
        }
      });
    } else {
      return new AIMessage({
        content: message.text,
        // Optional additional metadata if needed
        additional_kwargs: {
          id: message.id,
          timestamp: message.timestamp,
          sourceDocs: message.sourceDocs
        }
      });
    }
  });
}

/**
 * Create a new database message object
 * @param content Message content
 * @param sender Message sender ('user' or 'ai')
 * @param userId User ID
 * @param sourceDocs Optional source documents for AI messages
 * @returns Database message object
 */
export function createDbMessage(
  content: string,
  sender: 'user' | 'ai',
  userId?: string,
  sourceDocs?: Array<{
    pageContent: string;
    metadata: Record<string, any>;
  }>
): DbMessage {
  return {
    id: crypto.randomUUID(),
    text: content,
    sender,
    timestamp: Date.now(),
    userId,
    sourceDocs: sender === 'ai' ? sourceDocs : undefined
  };
} 