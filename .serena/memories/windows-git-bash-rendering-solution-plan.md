# Windows Git Bash Rendering Parity Solution Plan

## Problem Summary
Windows Git Bash has rendering parity issues due to:
1. Inconsistent ANSI escape sequence support
2. Missing Git Bash-specific terminal detection
3. No fallback rendering for limited terminals
4. Path display format inconsistencies

## Solution Architecture

### 1. Git Bash Detection Utility
Create utility to detect Git Bash environment specifically:
- Check for MINGW/MSYS/CYGWIN in platform
- Verify SHELL environment variable points to bash
- Detect Git Bash specific terminal capabilities

### 2. Terminal Capability Detection
Test for ANSI support in Git Bash:
- Background detection sequence fallback
- Color support detection
- Mouse support detection
- Clipboard support detection

### 3. Platform-Specific Rendering Fallbacks
Implement simplified rendering for Git Bash:
- Reduced color palette fallback
- Simplified text formatting
- Path normalization for display
- Enhanced error handling

### 4. Implementation Points
- `packages/opencode/src/util/platform.ts` - Git Bash detection
- `packages/opencode/src/util/terminal-capabilities.ts` - Capability detection
- `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` - Rendering fallbacks
- `packages/opencode/src/config/markdown.ts` - Path normalization

## Testing Strategy
- Test in actual Git Bash environment
- Verify rendering parity with other terminals
- Test path display normalization
- Validate fallback rendering works correctly