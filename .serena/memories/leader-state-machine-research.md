# Leader State Machine Research Summary

## Current Implementation Analysis

### Existing Leader Key System
The current leader implementation in `packages/opencode/src/cli/cmd/tui/context/keybind.tsx` provides:

1. **Basic Leader State Management**:
   - Simple boolean `leader` state in a SolidJS store
   - 2-second timeout with `clearTimeout`
   - Focus management during leader mode

2. **Leader Activation Logic**:
   ```typescript
   if (!store.leader && result.match("leader", evt)) {
     leader(true)
     return
   }
   ```

3. **Focus Handling**:
   - Stores current focused renderable before leader activation
   - Blurs current element during leader mode
   - Restores focus after leader completion

### Current Keybind Parsing
From `packages/opencode/src/util/keybind.ts`:

1. **Leader Syntax Support**:
   - Parses `<leader>` notation
   - Converts to `leader: true` in Keybind.Info
   - Supports combinations like `<leader>f`, `<leader>ctrl+g`

2. **Limitations**:
   - Only supports single leader + one key combinations
   - No multi-key chord parsing (e.g., leader + a + b)
   - No state machine for complex sequences

### Configuration Structure
From `packages/opencode/src/config/config.ts`:
- Leader key defaults to `ctrl+x`
- Extensive keybind definitions using leader syntax
- All major TUI commands use leader + key combinations

## Identified Gaps

1. **No True State Machine**: Current implementation is a simple timeout-based system
2. **Limited Chord Support**: Only leader + single key, not multi-key sequences
3. **No Nested States**: Cannot handle complex chord hierarchies
4. **Missing Visual Feedback**: No indication of partial chord progress

## TUI Input Flow Analysis

From the TUI component analysis:
- Keyboard events flow through `useKeyboard` hook from `@opentui/solid`
- Events are processed in `keybind.tsx` context
- Individual components handle their own keybinds
- Leader state affects focus across the entire TUI

## Requirements for Enhancement

1. **State Machine Architecture**: Replace simple boolean with proper state machine
2. **Multi-Key Chord Parsing**: Support sequences like leader + a + b
3. **Visual Feedback**: Show chord progress to user
4. **Configurable Timeouts**: Different timeouts for different contexts
5. **Chord Conflict Resolution**: Handle overlapping chord definitions