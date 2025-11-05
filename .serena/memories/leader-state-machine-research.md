# Leader State Machine & Chord Parsing Research

## Current Implementation Analysis

### Existing Leader Key System
- Located in `packages/opencode/src/cli/cmd/tui/context/keybind.tsx`
- Simple boolean state with timeout mechanism (2 seconds)
- Basic leader detection and activation
- Focus management during leader mode

### Keybind System
- Located in `packages/opencode/src/util/keybind.ts`
- Robust parsing with `<leader>` syntax support
- Modifier handling (ctrl, meta, shift, leader)
- Key matching and string conversion utilities

### Missing Features
- No chord parsing (simultaneous or sequential key combinations)
- Limited state machine for leader key sequences
- No support for complex key patterns beyond simple leader+key

## State Machine Design Requirements

Based on XState patterns and editor needs:

### Leader State Machine States
1. **idle** - Normal key processing
2. **leader** - Leader key activated, waiting for sequence
3. **chord** - Multiple keys pressed simultaneously
4. **sequence** - Building key sequence
5. **timeout** - Leader mode expired
6. **complete** - Full sequence matched

### Chord Parsing Requirements
- Detect simultaneous key presses
- Handle key release order
- Support variable-length chords
- Integrate with existing keybind system

## Implementation Plan

1. Create a proper state machine for leader key handling
2. Add chord detection and parsing
3. Integrate with existing keybind context
4. Maintain backward compatibility
5. Add comprehensive tests