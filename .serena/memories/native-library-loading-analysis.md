## Native Library Loading Analysis

### Identified Native Library Loading Points

1. **web-tree-sitter** (packages/opencode/src/tool/bash.ts:23-32)
   - Loads Parser dynamically via `await import("web-tree-sitter")`
   - Loads WASM files: tree-sitter.wasm and tree-sitter-bash.wasm
   - Used for parsing bash commands in the BashTool
   - **Failure impact**: Bash tool becomes non-functional

2. **@parcel/watcher** (packages/opencode/src/file/watcher.ts:26-29)
   - Loads platform-specific native binding via require()
   - Pattern: `@parcel/watcher-${process.platform}-${process.arch}${process.platform === "linux" ? "-glibc" : ""}`
   - Used for file system watching functionality
   - **Failure impact**: File watching feature disabled

3. **TUI binary** (packages/opencode/src/cli/cmd/tui.ts:24-26)
   - Loads TUI module via dynamic import
   - Uses `await import(OPENCODE_TUI_PATH as string, { with: { type: "file" } })`
   - **Failure impact**: TUI interface fails to load

### Failure Scenarios

1. **WASM loading failures**:
   - Network issues (if loading from CDN)
   - CORS restrictions
   - Missing WASM files
   - Unsupported browser/environment

2. **Native binding failures**:
   - Missing platform-specific binaries
   - Architecture mismatches
   - Library version conflicts
   - System dependency issues

3. **File system failures**:
   - Missing TUI binary files
   - Permission issues
   - Corrupted embedded files

### Current Error Handling

- **bash.ts**: No error handling around dynamic imports
- **watcher.ts**: No error handling around require() call
- **tui.ts**: No error handling around dynamic import

### Recommended Graceful Failure Pattern

```typescript
const lazyWithFallback = <T>(loader: () => Promise<T>, fallback: T | (() => T)) => {
  return lazy(async () => {
    try {
      return await loader()
    } catch (error) {
      log.warn("Native library failed to load, using fallback", { error: error.message })
      return typeof fallback === "function" ? (fallback as () => T)() : fallback
    }
  })
}
```

### Implementation Strategy

1. Wrap all dynamic imports in try-catch blocks
2. Provide meaningful fallbacks for each failure case
3. Log warnings when fallbacks are used
4. Ensure core functionality remains available
5. Add configuration options to disable native features explicitly