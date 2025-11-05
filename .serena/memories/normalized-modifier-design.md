## Normalized Modifier Decoding Design

### Goals:
1. Centralize modifier key detection logic
2. Provide consistent API across platforms
3. Support complex modifier combinations
4. Eliminate code duplication
5. Handle platform differences elegantly

### Proposed API:

```typescript
// Core utility functions
export function getPlatformModifier(): "Meta" | "Control"
export function isModifierPressed(event: KeyboardEvent, modifier: Modifier): boolean
export function getModifierState(event: KeyboardEvent): ModifierState
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean

// Types
export type Modifier = "ctrl" | "meta" | "alt" | "shift" | "cmd" | "mod"
export type ModifierState = {
  ctrl: boolean
  meta: boolean  
  alt: boolean
  shift: boolean
  cmd: boolean
  mod: boolean // Platform-aware primary modifier
}

// Usage examples:
// Instead of: event.getModifierState(MOD) && event.shiftKey && event.key.toLowerCase() === "p"
// Use: matchesShortcut(event, "mod+shift+p") or getModifierState(event).mod && getModifierState(event).shift
```

### Implementation Plan:
1. Create `packages/desktop/src/utils/modifiers.ts` with centralized logic
2. Replace duplicated MOD constants in existing files
3. Update keyboard event handlers to use new utility
4. Ensure backward compatibility during transition

### Files to Update:
- `packages/desktop/src/pages/index.tsx` (line 25, 75, 79, 104)
- `packages/desktop/src/components/code.tsx` (line 120, 137)
- `packages/desktop/src/components/prompt-input.tsx` (line 293)

### Benefits:
- Single source of truth for modifier detection
- Easier to test and maintain
- Consistent behavior across components
- Better support for complex shortcuts
- Platform-agnostic shortcut definitions