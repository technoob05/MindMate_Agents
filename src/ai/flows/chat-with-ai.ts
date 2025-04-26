'use server';
/**
 * @fileOverview Implements a Genkit flow for interacting with an AI assistant.
 *
 * - chatWithAi - A function to initiate the chat flow.
 * - ChatWithAiInput - Defines the input schema for the chat flow.
 * - ChatWithAiOutput - Defines the output schema for the chat flow.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { getEnhancedPrompt } from '@/ai/rag/vector-store';

const ChatWithAiInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI assistant.'),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to the user message.'),
  usedRAG: z.boolean().describe('Whether RAG was used to enhance the response.').optional(),
});
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

// Define a type for the prompt input
interface PromptInput {
  message: string;
  hasContext: boolean;
  enhancedPrompt?: string;
}

const prompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  input: {
    schema: z.object({
      message: z.string().describe('The user\'s message to the AI assistant.'),
      enhancedPrompt: z.string().describe('Enhanced prompt with relevant context').optional(),
      hasContext: z.boolean().describe('Whether RAG context was found').optional(),
    }),
  },
  output: {
    schema: z.object({
      response: z.string().describe('The AI assistant\'s response to the user message.'),
    }),
  },
  prompt: `You are a helpful AI assistant designed to provide support and guidance on mental wellness. Answer questions directly and helpfully.

IMPORTANT INSTRUCTION: Never mention what information is not in the documents or context. If you can't answer something from the provided context, simply use your general knowledge without referencing the absence of information.

      {{#if hasContext}}
      {{{enhancedPrompt}}}
      {{else}}
      Answer the following question:
      
      User Question: {{{message}}}
      {{/if}}
      `,
});

const chatWithAiFlow = ai.defineFlow<
  typeof ChatWithAiInputSchema,
  typeof ChatWithAiOutputSchema
>(
  {
    name: 'chatWithAiFlow',
    inputSchema: ChatWithAiInputSchema,
    outputSchema: ChatWithAiOutputSchema,
  },
  async input => {
    try {
      // Get enhanced prompt with RAG context if available
      const enhancedPromptData = await getEnhancedPrompt(input.message);
      
      const promptInput: PromptInput = {
        message: input.message,
        hasContext: enhancedPromptData.hasContext
      };
      
      if (enhancedPromptData.hasContext) {
        promptInput.enhancedPrompt = enhancedPromptData.prompt;
      }
      
      const { output } = await prompt(promptInput);
      
      return {
        ...output!,
        usedRAG: enhancedPromptData.hasContext
      };
    } catch (error) {
      console.error('Error in chatWithAiFlow:', error);
      // Fallback to regular prompt without RAG
      const { output } = await prompt({ message: input.message, hasContext: false });
      return {
        ...output!,
        usedRAG: false
      };
    }
  }
);
