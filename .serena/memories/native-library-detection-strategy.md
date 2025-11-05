## Native Library Detection Strategy

### Key Findings from Code Analysis

1. **Main Entry Points**:
   - `TuiThreadCommand.handler()` in `thread.ts` - Main TUI entry point
   - `tui()` function in `app.tsx:88-151` - Core TUI rendering logic
   - Both call `render()` from `@opentui/solid`

2. **Current Error Handling**:
   - ErrorBoundary in `app.tsx:116-150` catches render errors
   - Global handlers for unhandledRejection/uncaughtException in `thread.ts`
   - No specific detection for native library loading failures

3. **Native Library Structure**:
   - `@opentui/core` has platform-specific optional dependencies
   - Platform packages: `@opentui/core-{os}-{arch}` (e.g., `@opentui/core-linux-x64`)
   - Build process downloads platform-specific binaries in `script/build.ts:42-45`

4. **Failure Points**:
   - Import failures for `@opentui/solid` or `@opentui/core`
   - Native binary loading failures during platform-specific library import
   - Missing platform-specific packages
   - Terminal compatibility issues

### Detection Strategy

1. **Import-Time Detection**: Create a function to test importing native modules
2. **Platform Validation**: Check if platform-specific native libraries exist
3. **Runtime Detection**: Test renderer initialization before full TUI startup
4. **Graceful Messaging**: Provide clear error messages with fallback options

### Implementation Plan

1. Create `detectNativeLibrarySupport()` utility function
2. Wrap TUI entry points with detection logic
3. Enhance error handling with native library-specific messages
4. Add fallback suggestions (web UI, different terminal, etc.)