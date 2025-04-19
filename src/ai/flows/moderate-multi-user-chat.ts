// src/ai/flows/moderate-multi-user-chat.ts
'use server';
/**
 * @fileOverview Moderates content in a multi-user chat environment using Perspective API.
 *
 * - moderateMultiUserChat - A function that moderates the chat content.
 * - ModerateMultiUserChatInput - The input type for the moderateMultiUserChat function.
 * - ModerateMultiUserChatOutput - The return type for the moderateMultiUserChat function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const ModerateMultiUserChatInputSchema = z.object({
  text: z.string().describe('The text message to be moderated.'),
});
export type ModerateMultiUserChatInput = z.infer<typeof ModerateMultiUserChatInputSchema>;

const ModerateMultiUserChatOutputSchema = z.object({
  isHarmful: z.boolean().describe('Whether the text is considered harmful or inappropriate.'),
  reason: z.string().describe('The reason why the text was flagged as harmful, if applicable.'),
});
export type ModerateMultiUserChatOutput = z.infer<typeof ModerateMultiUserChatOutputSchema>;

export async function moderateMultiUserChat(
  input: ModerateMultiUserChatInput
): Promise<ModerateMultiUserChatOutput> {
  return moderateMultiUserChatFlow(input);
}

const moderateMultiUserChatPrompt = ai.definePrompt({
  name: 'moderateMultiUserChatPrompt',
  input: {
    schema: z.object({
      text: z.string().describe('The text message to be moderated.'),
    }),
  },
  output: {
    schema: z.object({
      isHarmful: z
        .boolean()
        .describe('Whether the text is considered harmful or inappropriate.'),
      reason: z.string().describe('The reason why the text was flagged as harmful, if applicable.'),
    }),
  },
  prompt: `You are an AI moderator for a multi-user chat application focused on mental health support.
Your role is to identify and flag harmful or inappropriate content to ensure a safe and supportive environment for all users.

Analyze the following text message:

{{text}}

Determine if the message contains any of the following:
* Hate speech
* Threats or harassment
* Sexually explicit content
* Promotion of violence
* Promotion or glorification of self-harm or suicide
* Disclosing private information about someone else
* Any content that violates the community guidelines

Based on your analysis, set the 'isHarmful' output field to true if the message is harmful or inappropriate, and provide a brief explanation in the 'reason' field. If the message is safe and appropriate, set 'isHarmful' to false and leave the 'reason' field empty.

Output a JSON object with the 'isHarmful' and 'reason' fields.`,
});

const moderateMultiUserChatFlow = ai.defineFlow<
  typeof ModerateMultiUserChatInputSchema,
  typeof ModerateMultiUserChatOutputSchema
>(
  {
    name: 'moderateMultiUserChatFlow',
    inputSchema: ModerateMultiUserChatInputSchema,
    outputSchema: ModerateMultiUserChatOutputSchema,
  },
  async input => {
    const {output} = await moderateMultiUserChatPrompt(input);
    return output!;
  }
);
