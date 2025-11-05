# MCP Socket Error and Timeout Analysis

## Current MCP Error Handling Locations

### Primary MCP Module (`packages/opencode/src/mcp/index.ts`)

**Transport Connection Errors (Lines 125-151):**
- Remote MCP servers try StreamableHTTP then SSE transports
- Socket errors are caught and logged with `log.debug("transport connection failed")`
- Error details stored in `lastError.message` 
- Status set to `{ status: "failed", error: lastError.message }`
- Only last error is preserved, earlier transport failures are lost

**Local MCP Errors (Lines 175-185):**
- Local MCP startup failures logged with `log.error("local mcp startup failed")`
- Error messages stored in failed status
- Includes command details in error logging

**Timeout Handling (Lines 202-213):**
- Tool fetching wrapped with `withTimeout(mcpClient.tools(), mcp.timeout ?? 5000)`
- Timeout results in generic "Failed to get tools" message
- Original timeout error is discarded by `.catch(() => {})`

**Status Schema:**
```typescript
type Status = 
  | { status: "connected" }
  | { status: "disabled" }  
  | { status: "failed", error: string }
```

### Timeout Utility (`packages/opencode/src/util/timeout.ts`)
- Simple Promise.race implementation
- Creates generic timeout error: `Operation timed out after ${ms}ms`
- Error details are lost when caught

### Configuration (`packages/opencode/src/config/config.ts`)
- MCP timeout configurable per server (default 5000ms)
- Both local and remote MCP support timeout configuration
- No specific error categorization

## Current Issues

### 1. **Loss of Error Context**
- Transport fallback only preserves last error
- Timeout errors lose original error details
- Socket connection errors may be too generic

### 2. **Poor Error Categorization**
- All failures result in same `{ status: "failed", error: string }`
- No distinction between socket errors, timeouts, or other failures
- Users can't tell if it's network, server, or configuration issue

### 3. **Insufficient User Feedback**
- Errors only visible in logs/debug output
- No actionable error messages for users
- No suggestions for resolution

### 4. **Limited Error Recovery**
- No retry mechanisms for transient failures
- No guidance for configuration fixes
- Status remains failed until manual restart

## Comparison with WebSocket Error Handling

The web component (`packages/web/src/components/Share.tsx`) shows better error handling:
- Multiple connection states (disconnected, connecting, connected, error, reconnecting)
- User-friendly status messages
- Automatic reconnection with backoff
- Clear error display to users

## Key Findings

1. **MCP module has structured error handling but poor user surfacing**
2. **Timeout handling discards valuable error information**  
3. **Transport fallback loses intermediate error details**
4. **No error categorization or user guidance**
5. **Status system exists but needs enhancement for better failure types**