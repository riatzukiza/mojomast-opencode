# MCP Error Surfacing Improvement Strategy

## Current State Analysis

### What Works Well
1. **Structured Status System**: MCP already has discriminated union status types
2. **TUI Integration**: Status dialog and sidebar already display MCP failures
3. **Logging Infrastructure**: Comprehensive logging with different levels
4. **Transport Fallback**: Attempts multiple connection methods

### Key Problems Identified
1. **Error Context Loss**: Only last error preserved during transport fallback
2. **Generic Error Messages**: "Failed to get tools" provides no actionable info
3. **No Error Categorization**: Socket errors, timeouts, and config errors look identical
4. **Poor User Guidance**: No suggestions for resolution

## Improvement Strategy

### 1. Enhanced Error Types
Extend the MCP status schema to include specific error categories:

```typescript
export const Status = z.discriminatedUnion("status", [
  z.object({ status: z.literal("connected") }),
  z.object({ status: z.literal("disabled") }),
  z.object({ 
    status: z.literal("failed"), 
    error: z.string(),
    category: z.enum(["socket", "timeout", "authentication", "configuration", "server"]),
    details: z.record(z.any()).optional(),
    suggestions: z.array(z.string()).optional()
  })
])
```

### 2. Improved Error Collection
- **Transport Fallback**: Collect all transport errors, not just the last one
- **Timeout Preservation**: Capture and preserve timeout error details
- **Socket Error Categorization**: Distinguish connection refused, timeout, DNS failures
- **Configuration Validation**: Pre-validate MCP configs before connection attempts

### 3. User-Friendly Error Messages
Map technical errors to actionable messages:

```typescript
const ERROR_MAPPING = {
  "ECONNREFUSED": {
    category: "socket",
    message: "Connection refused - MCP server not running",
    suggestions: ["Start the MCP server", "Check server address and port"]
  },
  "ETIMEDOUT": {
    category: "socket", 
    message: "Connection timeout - server not responding",
    suggestions: ["Check network connectivity", "Verify server is running"]
  },
  "Operation timed out": {
    category: "timeout",
    message: "Tool fetch timeout - server too slow",
    suggestions: ["Increase timeout configuration", "Check server performance"]
  }
}
```

### 4. Enhanced TUI Display
- **Error Categories**: Use different colors/icons for error types
- **Suggestions Display**: Show actionable suggestions in status dialog
- **Error Details**: Expandable details for technical users
- **Retry Mechanisms**: Quick retry actions for transient failures

### 5. Better Logging
- **Structured Logging**: Include error category and context
- **Progressive Detail**: Debug logs for all transport attempts
- **User-Facing Logs**: Clear messages for common issues

## Implementation Plan

### Phase 1: Enhanced Error Types
1. Extend MCP Status schema with error categories
2. Update TUI components to handle new error structure
3. Maintain backward compatibility

### Phase 2: Improved Error Collection
1. Enhance transport fallback to collect all errors
2. Preserve timeout error details
3. Add socket error categorization

### Phase 3: User Experience Improvements
1. Implement error message mapping
2. Add suggestions for common errors
3. Enhance TUI display with better error visualization

### Phase 4: Advanced Features
1. Add retry mechanisms for transient failures
2. Implement configuration validation
3. Add error recovery guidance

## Success Metrics
1. **Reduced Support Burden**: Users can self-diagnose common issues
2. **Better Debugging**: Developers get detailed error context
3. **Improved UX**: Clear, actionable error messages
4. **Maintainability**: Structured error handling system

## Backward Compatibility
- Existing status enum values preserved
- New fields are optional
- TUI gracefully handles old and new error formats
- No breaking changes to MCP configuration