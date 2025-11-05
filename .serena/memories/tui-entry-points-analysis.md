## TUI Entry Points Analysis

### Main Entry Points Identified:

1. **Primary TUI Command**: `packages/opencode/src/cli/cmd/tui.ts` 
   - Main CLI entry point for `opencode tui` command
   - Spawns external TUI binary (Go-based or embedded)
   - Sets up server and environment variables

2. **TUI App Component**: `packages/opencode/src/cli/cmd/tui/app.tsx`
   - Contains `tui()` function (lines 88-151) - main React component
   - Calls `render()` from `@opentui/solid` at line 113
   - Has ErrorBoundary but no native library detection

3. **TUI Spawn Command**: `packages/opencode/src/cli/cmd/tui/spawn.ts`
   - Alternative entry point for spawning TUI instances
   - Used for development/testing scenarios

### Native Library Loading Flow:
1. `bunfig.toml` preload script: `@opentui/solid/preload`
2. Platform-specific packages: `@opentui/core-{platform}-{arch}`
3. `render()` function from `@opentui/solid` initializes native renderer
4. Tree-sitter WASM modules for syntax highlighting

### Current Error Handling:
- Single ErrorBoundary wraps entire app
- No specific detection for native library failures
- Generic error messages don't distinguish native vs app errors
- No graceful fallback mechanisms

### Key Failure Points:
1. Preload script failure
2. Missing platform package
3. FFI binding failures  
4. Tree-sitter WASM loading
5. Renderer initialization

The main issue is no detection *before* calling `render()`.