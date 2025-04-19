'use server';
/**
 * @fileOverview A self-help exercise suggestion AI agent.
 *
 * - suggestSelfHelpExercise - A function that handles the self-help exercise suggestion process.
 * - SuggestSelfHelpExerciseInput - The input type for the suggestSelfHelpExercise function.
 * - SuggestSelfHelpExerciseOutput - The return type for the suggestSelfHelpExercise function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestSelfHelpExerciseInputSchema = z.object({
  conversationHistory: z.string().describe('The conversation history with the AI assistant.'),
});
export type SuggestSelfHelpExerciseInput = z.infer<typeof SuggestSelfHelpExerciseInputSchema>;

const SuggestSelfHelpExerciseOutputSchema = z.object({
  exerciseSuggestion: z.string().describe('The suggested self-help exercise based on the conversation.'),
});
export type SuggestSelfHelpExerciseOutput = z.infer<typeof SuggestSelfHelpExerciseOutputSchema>;

export async function suggestSelfHelpExercise(input: SuggestSelfHelpExerciseInput): Promise<SuggestSelfHelpExerciseOutput> {
  return suggestSelfHelpExerciseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSelfHelpExercisePrompt',
  input: {
    schema: z.object({
      conversationHistory: z.string().describe('The conversation history with the AI assistant.'),
    }),
  },
  output: {
    schema: z.object({
      exerciseSuggestion: z.string().describe('The suggested self-help exercise based on the conversation.'),
    }),
  },
  prompt: `You are a helpful AI assistant that suggests self-help exercises based on the user's conversation history.\n\nBased on the following conversation history, suggest a self-help exercise that might be helpful to the user:\n\nConversation History: {{{conversationHistory}}}\n\nSuggestion: `,
});

const suggestSelfHelpExerciseFlow = ai.defineFlow<
  typeof SuggestSelfHelpExerciseInputSchema,
  typeof SuggestSelfHelpExerciseOutputSchema
>(
  {
    name: 'suggestSelfHelpExerciseFlow',
    inputSchema: SuggestSelfHelpExerciseInputSchema,
    outputSchema: SuggestSelfHelpExerciseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
