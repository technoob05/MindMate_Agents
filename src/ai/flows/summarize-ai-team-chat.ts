'use server';
/**
 * @fileOverview Summarizes the key insights and action items from an AI Team chat conversation.
 *
 * - summarizeAiTeamChat - A function that summarizes the AI Team chat.
 * - SummarizeAiTeamChatInput - The input type for the summarizeAiTeamChat function.
 * - SummarizeAiTeamChatOutput - The return type for the summarizeAiTeamChat function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeAiTeamChatInputSchema = z.object({
  chatHistory: z.string().describe('The complete chat history of the AI Team conversation.'),
});
export type SummarizeAiTeamChatInput = z.infer<typeof SummarizeAiTeamChatInputSchema>;

const SummarizeAiTeamChatOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key insights and action items.'),
});
export type SummarizeAiTeamChatOutput = z.infer<typeof SummarizeAiTeamChatOutputSchema>;

export async function summarizeAiTeamChat(
  input: SummarizeAiTeamChatInput
): Promise<SummarizeAiTeamChatOutput> {
  return summarizeAiTeamChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAiTeamChatPrompt',
  input: {
    schema: z.object({
      chatHistory: z.string().describe('The complete chat history of the AI Team conversation.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the key insights and action items.'),
    }),
  },
  prompt: `You are an AI assistant tasked with summarizing AI Team chat conversations.

  Please provide a concise summary of the key insights and action items from the following chat history:

  {{chatHistory}}
  `,
});

const summarizeAiTeamChatFlow = ai.defineFlow<
  typeof SummarizeAiTeamChatInputSchema,
  typeof SummarizeAiTeamChatOutputSchema
>(
  {
    name: 'summarizeAiTeamChatFlow',
    inputSchema: SummarizeAiTeamChatInputSchema,
    outputSchema: SummarizeAiTeamChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
