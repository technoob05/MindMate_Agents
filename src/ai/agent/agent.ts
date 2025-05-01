import { createAgentPrompt } from "./agent-prompt";
import { agentTools } from "./tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage } from "@langchain/core/messages";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatMessageHistory } from "langchain/memory";
import { BufferMemory } from "langchain/memory";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

// Global LLM instance for the agent
let model: ChatGoogleGenerativeAI;

// Initialize the model
function getModel() {
  // Return existing model if already initialized
  if (model) {
    return model;
  }
  
  console.log("Initializing new Gemini model instance for agent");
  
  try {
    // Create a new model instance
    model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro", // Try using 1.5-pro which is more stable for agents
      maxOutputTokens: 4096, // Increase output token limit for more detailed responses
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      temperature: 0.8, // Slightly more creative responses for psychology assistant
    });
    
    console.log("Gemini model initialized successfully");
    return model;
  } catch (error) {
    console.error("Error initializing Gemini model:", error);
    throw new Error(`Failed to initialize Gemini model: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a memory instance for the agent
 * @param messages Previous conversation messages
 */
export function createAgentMemory(messages: BaseMessage[] = []) {
  console.log(`Creating agent memory with ${messages.length} messages`);
  
  try {
    // Create a chat message history
    const chatHistory = new ChatMessageHistory(messages);
    
    // Create and return memory with chat history
    const memory = new BufferMemory({
      memoryKey: "chat_history",
      returnMessages: true,
      chatHistory: chatHistory,
    });
    
    console.log("Memory created successfully");
    return memory;
  } catch (error) {
    console.error("Error creating agent memory:", error);
    throw new Error(`Failed to create agent memory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a tool-calling agent with the MindMate prompt and tools
 */
export function createMindMateAgent() {
  console.log("Creating MindMate agent with tools:", agentTools.map(tool => tool.name));
  
  try {
    const model = getModel();
    const prompt = createAgentPrompt();
    
    // Log the tools to debug
    console.log(`Tools available for agent:`, agentTools.map(tool => ({
      name: tool.name,
      description: tool.description.substring(0, 50) + '...'
    })));
    
    // Create the agent with tool-calling capabilities
    const agent = createToolCallingAgent({
      llm: model,
      tools: agentTools,
      prompt,
    });
    
    console.log("Agent created successfully");
    return agent;
  } catch (error) {
    console.error("Error creating MindMate agent:", error);
    throw new Error(`Failed to create MindMate agent: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create an agent executor for the MindMate agent
 * @param memory Optional memory with chat history
 */
export function createMindMateAgentExecutor(memory?: BufferMemory) {
  try {
    console.log("Creating MindMate Agent Executor");
    const agent = createMindMateAgent();
    
    // Create a custom wrapper to handle the memory properly
    const executor = {
      async invoke({input}: {input: string}) {
        try {
          console.log(`Agent executor processing input: ${input.substring(0, 50)}...`);
          
          // Create an empty chat history if none exists
          let chatHistory = [];
          
          // If memory exists, try to get chat history from it
          if (memory) {
            try {
              // Get the chat history from memory
              const memoryVariables = await memory.loadMemoryVariables({});
              chatHistory = memoryVariables.chat_history || [];
              console.log(`Loaded ${chatHistory.length} messages from memory`);
            } catch (memError) {
              console.warn("Could not load chat history from memory:", memError);
              // Continue with empty chat history
            }
          }
          
          // Use the agent directly with chat_history and agent_scratchpad
          const agentExecutor = new AgentExecutor({
            agent,
            tools: agentTools,
            verbose: true,
            returnIntermediateSteps: true,
            maxIterations: 10,
            handleParsingErrors: true,
          });
          
          // Execute the agent with input and chat_history
          const result = await agentExecutor.invoke({
            input: input,
            chat_history: chatHistory,
            agent_scratchpad: []
          });
          
          // If we have memory, manually try to update it - wrapped in try/catch to prevent errors
          if (memory) {
            try {
              console.log("Manually updating memory with conversation");
              await memory.saveContext(
                {input: input}, 
                {output: result.output}
              );
            } catch (memoryError) {
              console.warn("Non-critical error updating memory:", memoryError);
              // Continue execution even if memory update fails
            }
          }
          
          return {output: result.output};
        } catch (error) {
          console.error("Error in agent execution:", error);
          throw error;
        }
      }
    };
    
    console.log("Custom agent executor created successfully");
    return executor;
  } catch (error) {
    console.error("Error creating MindMate agent executor:", error);
    throw new Error(`Failed to create agent executor: ${error instanceof Error ? error.message : String(error)}`);
  }
} 