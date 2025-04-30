import { ragKnowledgeTool } from "./rag-knowledge-tool";
import { scheduleReminderTool } from "./schedule-reminder-tool";

// Log tools for debugging purposes
console.log("Agent tools initialized:", {
  ragKnowledgeTool: ragKnowledgeTool.name,
  scheduleReminderTool: scheduleReminderTool.name
});

// Export all tools 
export const agentTools = [
  ragKnowledgeTool,
  scheduleReminderTool,
];

// Export individual tools for direct access
export {
  ragKnowledgeTool,
  scheduleReminderTool,
}; 