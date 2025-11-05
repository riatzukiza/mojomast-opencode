# Windows Git Bash Rendering Parity Solution Analysis

## Identified Root Causes

### 1. Path Display Normalization
**Issue**: Git Bash displays Unix-style paths (/c/Users/) while Windows paths use backslashes
**Current**: Uses `path.relative()` which shows platform-native format
**Solution**: Implement path normalization for consistent display across platforms

### 2. ANSI Terminal Emulation
**Issue**: Git Bash terminal emulation may handle ANSI sequences differently
**Current**: Limited ANSI processing with `Bun.stripANSI()` in shell output only
**Solution**: Enhanced ANSI processing for Git Bash terminal capabilities

### 3. Multi-line Paste Rendering
**Issue**: Virtual text rendering for pasted content may display differently
**Current**: Creates `[Pasted ~X lines]` placeholders with extmarks
**Solution**: Git Bash-specific rendering adjustments for extmarks

## Technical Implementation Plan

### Phase 1: Path Normalization
- Create utility function to normalize paths for display
- Detect Git Bash environment and convert paths accordingly
- Apply normalization in file reference displays

### Phase 2: Enhanced ANSI Processing  
- Add Git Bash terminal capability detection
- Implement ANSI sequence fallbacks for limited terminals
- Ensure consistent color/style rendering

### Phase 3: Paste Behavior Optimization
- Test multi-line paste rendering in Git Bash
- Adjust virtual text display if needed
- Ensure proper extmark rendering

## Files to Modify
1. `packages/opencode/src/cli/cmd/tui/routes/session/index.tsx` - TextPart rendering
2. `packages/opencode/src/cli/cmd/tui/component/prompt/index.tsx` - Paste handling
3. `packages/opencode/src/util/path.ts` - Path normalization utilities (new)
4. `packages/opencode/src/util/terminal.ts` - Terminal detection utilities (new)

## Testing Strategy
- Test in actual Git Bash environment
- Verify path display consistency
- Validate paste behavior and rendering
- Check ANSI color/style rendering