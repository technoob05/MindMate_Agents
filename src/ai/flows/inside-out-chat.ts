// src/ai/flows/inside-out-chat.ts
import { ai } from "@/ai/ai-instance";
import { z } from 'genkit';
import { emotionAgentPersonas, EmotionAgentPersona } from "./inside-out-personas";

// --- Schemas ---

// Input for generating a single agent's response (initial or debate)
const AgentResponseInputSchema = z.object({
  agentPrompt: z.string(), // The specific prompt for the agent (persona + context)
  conversationHistory: z.string().optional(), // Optional: History for debate context
});

// Output for a single agent's response
const AgentResponseOutputSchema = z.object({
  responseText: z.string(),
});

// Input for generating the final summary
const SummarizationInputSchema = z.object({
    conversationHistory: z.string(), // The full debate history
    userInput: z.string(), // The original user input that started it
});

// Output for the final summary
const SummarizationOutputSchema = z.object({
    summary: z.string(),
    advice: z.string(),
});

// --- Prompts ---

// Prompt for generating any agent response (initial or debate)
// The specific instruction (initial analysis vs. debate contribution) will be part of the 'agentPrompt' input
const agentResponsePrompt = ai.definePrompt({
    name: 'agentResponsePrompt',
    input: { schema: AgentResponseInputSchema },
    output: { schema: AgentResponseOutputSchema },
    prompt: `{{{agentPrompt}}}

    {{#if conversationHistory}}
    Recent Conversation History (for context):
    ---
    {{{conversationHistory}}}
    ---
    Respond concisely based on your personality and the history.
    {{else}}
    Analyze the user's input based on your personality. Keep your response focused and relatively brief.
    {{/if}}

    Your Response:
    `,
    model: 'googleai/gemini-1.5-flash',
    config: { temperature: 0.75 }, // Slightly higher temp for more varied responses
});

// Prompt for generating the final summary on demand
const onDemandSummarizationPrompt = ai.definePrompt({
    name: 'onDemandSummarizationPrompt',
    input: { schema: SummarizationInputSchema },
    output: { schema: SummarizationOutputSchema },
    prompt: `
      Context: A user shared their feelings, leading to a discussion between multiple AI emotion agents (Joy, Sadness, Anger, Fear, Disgust).

      Original User Input: "{{{userInput}}}"

      Full Conversation History (User and Agents):
      ---
      {{{conversationHistory}}}
      ---

      Task: Based on the ORIGINAL user input and the ENTIRE conversation history, provide:
      1. A concise final summary of the emotional landscape discussed.
      2. Balanced, actionable advice for the user, integrating the different viewpoints expressed during the conversation.

      Format your response clearly separating the Summary and Advice. Example:
      Summary: [Your summary here]
      Advice: [Your advice here]

      Your Response:
    `,
    model: 'googleai/gemini-1.5-flash',
    config: { temperature: 0.5 },
});


// --- Interfaces ---

// Represents a single message in the chat (for history formatting)
export interface ChatMessage {
    sender: 'user' | string; // 'user' or agent name (e.g., 'Joy')
    text: string;
}

// Result of a single agent response generation
export interface AgentResponseResult {
    emotion: string;
    responseText: string;
    avatar?: string;
}

// Result of the on-demand summarization
export interface OnDemandSummaryResult {
    summary: string;
    advice: string;
}

// --- Core Functions ---

/**
 * Generates an initial response for a single emotion agent based on user input.
 */
export async function generateInitialAgentResponse(
    userInput: string,
    persona: EmotionAgentPersona
): Promise<AgentResponseResult> {
    console.log(`Generating initial response for ${persona.emotion}...`);
    const specificAgentPrompt = persona.promptTemplate(userInput); // Get the persona-specific prompt text

    try {
        const { output } = await agentResponsePrompt({
            agentPrompt: specificAgentPrompt,
            // No conversationHistory for initial response
        });
        const responseText = output?.responseText ?? `(${persona.emotion} is processing...)`;
        console.log(`${persona.emotion} initial response generated.`);
        return {
            emotion: persona.emotion,
            responseText: responseText,
            avatar: persona.avatar,
        };
    } catch (error) {
        console.error(`Error generating initial response for ${persona.emotion}:`, error);
        return {
            emotion: persona.emotion,
            responseText: `Error generating response for ${persona.emotion}.`,
            avatar: persona.avatar,
        };
    }
}

/**
 * Generates a follow-up (debate) response for a single emotion agent
 * based on the conversation history.
 * NOTE: This is a placeholder for future implementation of interactive debate.
 * based on the conversation history, focusing on reacting to recent messages.
 */
export async function generateDebateAgentResponse(
    conversationHistory: ChatMessage[], // Expecting user and other agent messages
    persona: EmotionAgentPersona
): Promise<AgentResponseResult> {
    console.log(`Generating debate response for ${persona.emotion}...`);

    // Format history, potentially limiting length for context window and focus
    const recentHistory = conversationHistory.slice(-6); // Limit to last ~6 messages for focus
    const historyString = recentHistory
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join("\n");

    // Construct a more specific prompt for debate reaction
    const debatePromptText = `
      You are the emotion ${persona.emotion}. Your personality is: ${persona.personality}.
      The user has shared something, and other emotions have reacted.
      Review the LAST 2-3 messages in the conversation history provided below.
      Based on YOUR specific personality (${persona.emotion}), provide a CONCISE reaction (1-2 sentences) to what was just said by the user or other emotions.
      Directly address or build upon the last couple of points. Do not just repeat your initial analysis. Engage in the discussion.

      Example Reactions:
      - Joy might say: "I hear what Sadness is saying, but look at the opportunity here!"
      - Anger might say: "Fear, you're being overly cautious! What's unfair is..."
      - Sadness might say: "I agree with Anger's point about the frustration, it feels heavy."
      - Fear might say: "Hold on Joy, let's not forget the potential risks..."
      - Disgust might say: "Honestly, the way [previous point] was handled is just wrong."

      Conversation History:
      ---
      ${historyString}
      ---

      Your (${persona.emotion}) Concise Reaction:
    `.trim(); // Use trim() to remove leading/trailing whitespace

    try {
        const { output } = await agentResponsePrompt({
            agentPrompt: debatePromptText, // Use the more detailed debate prompt
            conversationHistory: historyString, // Pass formatted history (already included in agentPrompt but schema expects it)
        });
        const responseText = output?.responseText ?? `(${persona.emotion} considers...)`;
        console.log(`${persona.emotion} debate response generated.`);
        return {
            emotion: persona.emotion,
            responseText: responseText,
            avatar: persona.avatar,
        };
    } catch (error) {
        console.error(`Error generating debate response for ${persona.emotion}:`, error);
        return {
            emotion: persona.emotion,
            responseText: `Error generating debate response for ${persona.emotion}.`,
            avatar: persona.avatar,
        };
    }
}


/**
 * Generates a summary and advice based on the full conversation history.
 */
export async function generateOnDemandSummary(
    conversationHistory: ChatMessage[],
    originalUserInput: string
): Promise<OnDemandSummaryResult> {
    console.log("Generating on-demand summary...");

    // Format history for the prompt
    const historyString = conversationHistory
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join("\n");

    try {
        const { output } = await onDemandSummarizationPrompt({
            conversationHistory: historyString,
            userInput: originalUserInput,
        });

        let summary = "Could not generate summary.";
        let advice = "Could not generate advice.";

        if (output) {
            // Attempt to parse the Summary: ... Advice: ... format
            const summaryMatch = output.summary?.match(/Summary:\s*([\s\S]*?)(?:\nAdvice:|$)/);
            const adviceMatch = output.advice?.match(/Advice:\s*([\s\S]*)/); // Match advice separately

            // Fallback if parsing fails or if fields are missing in output object
            if (summaryMatch && summaryMatch[1]) {
                summary = summaryMatch[1].trim();
            } else {
                summary = output.summary || output.advice || "Summary not found."; // Use advice as fallback if summary field missing
            }

            if (adviceMatch && adviceMatch[1]) {
                advice = adviceMatch[1].trim();
            } else if (!summaryMatch) { // If summary didn't contain advice
                 advice = output.advice || output.summary || "Advice not found."; // Use summary as fallback if advice field missing
            } else {
                advice = "Advice not found."; // If summary was found but advice wasn't after it
            }

             // Handle case where the model might just return one block
             if (summary === advice && summary !== "Summary not found." && summary !== "Advice not found.") {
                 // If summary and advice are identical, assume it's a combined block
                 // Try splitting by newline, or just assign to summary
                 const parts = summary.split('\n');
                 if (parts.length > 1) {
                     summary = parts[0];
                     advice = parts.slice(1).join('\n').trim();
                 }
                 // else keep as is, likely just a summary was generated
             }


        }

        console.log("On-demand summary generated.");
        return { summary, advice };

    } catch (error) {
        console.error(`Error generating on-demand summary:`, error);
        return {
            summary: "Error generating summary.",
            advice: "Error generating advice.",
        };
    }
}

// --- Removed old insideOutChat function ---
// The logic is now split into generateInitialAgentResponse, generateDebateAgentResponse, and generateOnDemandSummary
