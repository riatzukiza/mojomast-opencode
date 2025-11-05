## Current Modifier Key Implementation Analysis

### Files with Modifier Key Handling:

1. **packages/desktop/src/pages/index.tsx** (line 25):
   ```typescript
   const MOD = typeof navigator === "object" && /(Mac|iPod|iPhone|iPad)/.test(navigator.platform) ? "Meta" : "Control"
   ```
   - Uses platform detection to determine primary modifier key
   - Mac platforms use "Meta" (Cmd key), others use "Control" (Ctrl key)
   - Used in handleKeyDown for shortcuts like Cmd/Ctrl+P, Cmd/Ctrl+Shift+P

2. **packages/desktop/src/components/code.tsx** (line 137):
   ```typescript
   const MOD = typeof navigator === "object" && /(Mac|iPod|iPhone|iPad)/.test(navigator.platform) ? "Meta" : "Control"
   ```
   - Same platform detection logic duplicated
   - Used for Cmd/Ctrl+A selection shortcut

### Current Issues:
- **Code Duplication**: Same MOD logic repeated in multiple files
- **Inconsistent Handling**: No centralized modifier key management
- **Limited Scope**: Only handles primary modifier (Cmd/Ctrl), doesn't address Alt/Meta combinations
- **Platform-specific Logic**: Hardcoded platform detection scattered throughout

### Modifier Keys Found:
- `event.ctrlKey` - Direct Ctrl key detection
- `event.metaKey` - Direct Meta/Cmd key detection  
- `event.getModifierState(MOD)` - Platform-aware modifier detection
- `event.altKey` - Alt key detection (found but not normalized)
- `event.shiftKey` - Shift key detection

### Needed Improvements:
1. Create centralized modifier key utility
2. Normalize Alt/Meta/Ctrl combinations across platforms
3. Provide consistent API for modifier detection
4. Handle platform differences elegantly
5. Support complex modifier combinations