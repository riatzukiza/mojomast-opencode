## OpenTUI Native Library Loading Analysis

### Current Architecture
- The TUI uses `@opentui/core` and `@opentui/solid` for rendering
- Native libraries are platform-specific: `@opentui/core-${os}-${arch}`
- Build process downloads platform-specific packages in `script/build.ts:42-45`
- Main entry point: `packages/opencode/src/cli/cmd/tui/app.tsx:1` imports `render` from `@opentui/solid`

### Key Entry Points
1. **CLI Commands**: 
   - `TuiThreadCommand` (`packages/opencode/src/cli/cmd/tui/thread.ts`) - main TUI entry
   - `TuiSpawnCommand` (`packages/opencode/src/cli/cmd/tui/spawn.ts`) - spawns TUI process

2. **TUI Initialization**:
   - `tui()` function in `packages/opencode/src/cli/cmd/tui/app.tsx:88-151`
   - Uses `render()` from `@opentui/solid` with ErrorBoundary wrapper

3. **Error Handling**:
   - ErrorBoundary already implemented in `app.tsx:116-150`
   - Global error handlers in `index.ts` for unhandledRejection/uncaughtException

### Potential Failure Points
- Native library import failures
- Platform-specific binary missing
- Render initialization failures
- Terminal compatibility issues

### Current Error Handling
- ErrorBoundary catches render errors but may not handle native lib loading failures
- Global handlers catch process-level errors
- No specific detection for native library loading issues