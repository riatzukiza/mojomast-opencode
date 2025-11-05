## Native Library Detection Implementation Summary

### ✅ Implementation Complete

**Files Modified:**
1. `packages/opencode/src/cli/cmd/tui/app.tsx` - Added detection to `tui()` function and enhanced `ErrorComponent`
2. `packages/opencode/src/cli/cmd/tui/thread.ts` - Added global error handlers for native library failures
3. `packages/opencode/src/cli/cmd/tui/util/native-detection.ts` - Created detection utility functions

### Key Features Implemented:

1. **Import-Time Detection**: Tests importing `@opentui/core` and `@opentui/solid`
2. **Terminal Capability Check**: Verifies TTY availability (with FORCE_TUI override)
3. **Platform-Specific Error Detection**: Identifies common native library loading issues
4. **Graceful Error Messages**: Clear, actionable error messages with suggestions
5. **Fallback Suggestions**: Always suggests web UI as alternative

### Error Detection Patterns:
- `Cannot find module` - Missing dependencies
- `DYLD`/`DLL` errors - Native library loading failures
- `@opentui` related errors - Package-specific issues
- Terminal/TUI compatibility issues

### User Experience:
- Clean error messages with emoji indicators
- Numbered suggestion lists
- Platform-specific guidance
- Always provides web UI fallback

### Testing Results:
- ✅ Detection correctly identifies missing TTY environment
- ✅ FORCE_TUI=1 override works properly
- ✅ Native library loading succeeds when dependencies are available
- ✅ Build passes without errors

The implementation provides robust detection and graceful failure handling for native render library loading issues.