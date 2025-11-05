## TUI Entry Points Analysis

### Main Entry Points
1. **CLI Commands**:
   - `TuiThreadCommand` (`packages/opencode/src/cli/cmd/tui/thread.ts`) - Main TUI entry point
   - `TuiSpawnCommand` (`packages/opencode/src/cli/cmd/tui/spawn.ts`) - Spawns TUI as separate process

2. **TUI Function**:
   - `tui()` function in `packages/opencode/src/cli/cmd/tui/app.tsx:88-151`
   - Calls `render()` from `@opentui/solid`
   - Wrapped in ErrorBoundary for error handling

### Key Import Locations
- `render` function imported from `@opentui/solid` in `app.tsx:1`
- Multiple components import from `@opentui/core` and `@opentui/solid`
- Build process handles platform-specific native libraries in `script/build.ts:42-45`

### Current Error Handling
- ErrorBoundary in `app.tsx:116-150` catches render errors
- Global handlers in `index.ts` for unhandledRejection/uncaughtException
- No specific detection for native library loading failures

### Potential Failure Points
1. Import failures for `@opentui/solid` or `@opentui/core`
2. Native binary loading failures
3. Platform-specific library missing
4. Terminal compatibility issues
5. Renderer initialization failures