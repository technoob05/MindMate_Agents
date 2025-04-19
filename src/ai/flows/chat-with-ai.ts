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

const ChatWithAiInputSchema = z.object({
  message: z.string().describe('The user\'s message to the AI assistant.'),
});
export type ChatWithAiInput = z.infer<typeof ChatWithAiInputSchema>;

const ChatWithAiOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to the user message.'),
});
export type ChatWithAiOutput = z.infer<typeof ChatWithAiOutputSchema>;

export async function chatWithAi(input: ChatWithAiInput): Promise<ChatWithAiOutput> {
  return chatWithAiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAiPrompt',
  input: {
    schema: z.object({
      message: z.string().describe('The user\'s message to the AI assistant.'),
    }),
  },
  output: {
    schema: z.object({
      response: z.string().describe('The AI assistant\'s response to the user message.'),
    }),
  },
  prompt: `You are a helpful AI assistant designed to provide support and guidance on mental wellness. Respond to the user message with helpful and supportive advice.
      User message: {{{message}}}
      Response:`,
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
    const {output} = await prompt(input);
    return output!;
  }
);
