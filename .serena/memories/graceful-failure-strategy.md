## Graceful Failure Strategy for Native Render Library

### Detection Points
1. **Import Time Detection**: Wrap `@opentui/solid` and `@opentui/core` imports in try/catch
2. **Renderer Initialization Detection**: Wrap `render()` call in try/catch
3. **Platform Validation**: Check if platform-specific native libraries exist
4. **Terminal Compatibility**: Verify terminal capabilities before rendering

### Graceful Failure Behavior
1. **Informative Error Message**: Clear explanation of what failed and why
2. **Fallback Options**: Suggest alternatives (web UI, different terminal, etc.)
3. **Debug Information**: Provide platform details and missing components
4. **Clean Exit**: Proper cleanup without hanging processes

### Implementation Strategy
1. Create a `detectNativeLibrarySupport()` function
2. Wrap TUI entry points with detection logic
3. Enhance ErrorBoundary with native library-specific error handling
4. Add platform-specific error messages and suggestions

### Integration Points
- Modify `TuiThreadCommand.handler()` in `thread.ts`
- Modify `tui()` function in `app.tsx`
- Enhance `ErrorComponent` for native library errors
- Add detection utility functions