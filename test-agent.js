// This is a simple test file to check if the agent works
// Run with: node test-agent.js

// Import required modules
require('dotenv').config(); // Load environment variables
const { createMindMateAgentExecutor } = require('./src/ai/agent/agent');

async function testAgent() {
  try {
    console.log("Creating agent...");
    // Create agent executor
    const agentExecutor = createMindMateAgentExecutor();
    
    console.log("Agent created, running test with simple query...");
    // Simple test query
    const result = await agentExecutor.invoke({
      input: "Tôi thấy hơi buồn gần đây, bạn có thể giúp tôi được không?",
      userId: "test-user"
    });
    
    console.log("Agent response received:");
    console.log(result);
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Error testing agent:", error);
  }
}

// Run the test
testAgent(); 