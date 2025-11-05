# Windows Git Bash Rendering Parity Solution Implementation

## Summary of Changes

### 1. Git Bash Detection Utilities (`packages/opencode/src/util/terminal.ts`)
- Created comprehensive terminal detection system
- Detects Git Bash, MSYS, Cygwin environments
- Provides terminal capability assessment (truecolor, Unicode, ANSI support)
- Identifies paste behavior patterns for different terminals

### 2. Path Normalization (`packages/opencode/src/util/path.ts`)
- Implemented Git Bash-aware path normalization
- Converts Windows paths (`C:\`) to Unix-style (`/c/`) for display
- Handles UNC paths (`\\server\share` to `//server/share`)
- Provides bidirectional conversion (display ↔ system)
- Integrates with existing `normalizePath` function in session component

### 3. ANSI Processing Enhancement (`packages/opencode/src/util/ansi.ts`)
- Created Git Bash-specific ANSI sequence processing
- Converts truecolor to 256-color for limited terminals
- Handles problematic ANSI sequences in Git Bash
- Sanitizes text to remove control characters
- Enhances color rendering with explicit resets

### 4. Input/Paste Behavior Fixes
- Reduced multi-line paste threshold for Git Bash (2 lines vs 5 lines)
- Added line ending normalization for Git Bash paste events
- Improved paste text formatting for Git Bash environment
- Enhanced clipboard handling with Git Bash awareness

### 5. Integration Points
- Updated session component to use Git Bash-aware path normalization
- Enhanced bash tool output processing with ANSI handling
- Modified prompt component for Git Bash paste behavior
- Maintained backward compatibility with existing functionality

## Technical Implementation Details

### Terminal Detection Logic
```typescript
// Detects Git Bash through multiple indicators:
- MSYSTEM environment variable (MSYS2)
- SHELL containing "bash" on Windows
- MSYSCON variable presence
- CYGWIN environment detection
```

### Path Conversion Rules
```typescript
// Windows → Git Bash display
C:\Users\file.txt → /c/Users/file.txt
\\server\share → //server/share

// Git Bash → Windows system
/c/Users/file.txt → C:\Users\file.txt
```

### ANSI Processing Strategy
```typescript
// Git Bash compatibility:
- Strip problematic mode settings
- Convert RGB to 256-color approximation
- Add explicit color resets
- Remove control characters
```

## Expected Impact

### Rendering Improvements
- Consistent path display across Windows terminals
- Reduced visual artifacts and scrolling issues
- Better color rendering in Git Bash environment
- Improved text layout and formatting

### Input Enhancements
- More reliable multi-line paste behavior
- Better handling of large content pastes
- Reduced input lag and artifacts
- Improved clipboard integration

### Platform Parity
- Git Bash users get Unix-like experience
- Maintains Windows compatibility
- Seamless path handling between environments
- Consistent behavior across Windows terminals

## Files Modified/Created

### New Files
- `packages/opencode/src/util/terminal.ts` - Terminal detection
- `packages/opencode/src/util/path.ts` - Path normalization  
- `packages/opencode/src/util/ansi.ts` - ANSI processing

### Modified Files
- `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` - Path display & ANSI
- `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` - Paste behavior

## Testing Recommendations

### Test Scenarios
1. Path display in Git Bash vs other Windows terminals
2. Multi-line paste behavior with different content sizes
3. Color rendering in various Git Bash configurations
4. Large content rendering and scrolling
5. Interactive command execution

### Validation Points
- No regression in non-Git Bash environments
- Improved rendering in Git Bash specifically
- Consistent behavior across Windows terminals
- Performance impact assessment

This implementation addresses the core Windows Git Bash rendering parity issues identified in the original analysis while maintaining compatibility with existing functionality.