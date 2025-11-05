## Graceful Failure Detection Strategy

### Design Principles:
1. **Early Detection**: Check native library availability before calling `render()`
2. **Clear Error Messages**: Provide specific, actionable error messages
3. **Graceful Degradation**: Offer fallback options when possible
4. **User-Friendly**: Guide users toward solutions

### Implementation Strategy:

#### Phase 1: Detection Layer
Create a `detectNativeRenderSupport()` function that:
- Checks if `@opentui/solid/preload` loaded successfully
- Validates platform-specific package availability
- Tests basic native functionality without full initialization
- Returns detailed error information if detection fails

#### Phase 2: Error Handling Integration
Integrate detection into TUI entry points:
- Add detection before `render()` call in `tui()` function
- Handle detection failures with specific error messages
- Provide helpful guidance for common issues

#### Phase 3: Fallback Options
When native rendering fails:
- Suggest alternative interfaces (web UI, CLI-only mode)
- Provide installation/repair instructions
- Offer to continue with limited functionality

#### Error Categories:
1. **Missing Platform Package**: "Native TUI not available for [platform]-[arch]"
2. **Preload Failure**: "TUI native modules failed to load"
3. **Permission Issues**: "Cannot access TUI native libraries"
4. **Corrupted Installation**: "TUI native libraries are corrupted"

#### Implementation Locations:
- `packages/opencode/src/cli/cmd/tui/app.tsx` - Main detection integration
- `packages/opencode/src/util/native-render.ts` - New detection utility
- Update error handling in CLI commands

This approach ensures users get clear feedback about what went wrong and how to fix it, rather than cryptic native library errors.