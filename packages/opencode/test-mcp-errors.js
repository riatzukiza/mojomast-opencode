import { MCP } from "./src/mcp"

async function testMcpErrorHandling() {
  console.log("Testing MCP error handling...")

  try {
    // Test with a configuration that should fail
    const testConfig = {
      type: "remote",
      url: "http://localhost:9999", // This should fail
      enabled: true,
    }

    console.log("Testing with failing MCP configuration...")
    await MCP.add("test-server", testConfig)

    // Need to check the status through the MCP state
    const mcpState = await MCP.state()
    const result = mcpState.status["test-server"]
    console.log("Result:", result)

    if (result?.status.status === "failed") {
      console.log("✅ Error correctly categorized as failed")
      console.log("Error message:", result.status.error)
      console.log("Category:", result.status.category)
      console.log("Suggestions:", result.status.suggestions)
    } else {
      console.log("❌ Expected failed status")
    }
  } catch (error) {
    console.log("❌ Unexpected error:", error)
  }
}

testMcpErrorHandling()
