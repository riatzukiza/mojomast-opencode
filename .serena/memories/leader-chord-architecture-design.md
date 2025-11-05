# Leader State Machine & Chord Parsing Architecture Design

## Overview

Design a robust state machine for handling leader keys and chord parsing in the TUI editor, building on the existing keybind system.

## State Machine Architecture

### Core States
```typescript
type KeyState = 
  | 'idle'           // Normal key processing
  | 'leader'         // Leader key pressed, waiting for sequence
  | 'chording'       // Multiple keys held (chord detection)
  | 'sequencing'     // Building key sequence after leader
  | 'timeout'        // Leader mode expired
  | 'matched'        // Complete sequence matched
  | 'failed'         // No matching sequence found
```

### State Transitions
- `idle` → `leader` on leader key press
- `idle` → `chording` on multiple simultaneous keys
- `leader` → `sequencing` on first key after leader
- `sequencing` → `matched` on complete sequence match
- `sequencing` → `failed` on no match
- `leader` → `timeout` after 2 seconds
- `chording` → `matched` on chord match
- `chording` → `failed` on no chord match

## Chord Parsing System

### Chord Detection
- Track key down/up events
- Maintain active keys set
- Detect simultaneous key combinations
- Handle key release order variations

### Chord Types
1. **Simple Chords**: 2-3 keys simultaneously (e.g., `gg`, `dd`)
2. **Modified Chords**: Modifiers + keys (e.g., `ctrl+xx`)
3. **Leader Chords**: Leader + simultaneous keys (e.g., `<leader>gg`)

## Implementation Components

### 1. KeyStateMachine
Main state machine orchestrating key handling
- State management
- Transition logic
- Timeout handling
- Event dispatch

### 2. ChordDetector
Handles chord detection and parsing
- Key press tracking
- Simultaneous key detection
- Chord pattern matching

### 3. SequenceBuilder
Builds and validates key sequences
- Sequence accumulation
- Pattern matching
- Completion detection

### 4. Enhanced KeybindContext
Integrates with existing keybind system
- Backward compatibility
- Enhanced matching
- State-aware key processing

## Integration Points

### Existing Keybind System
- Extend `Keybind.Info` with chord information
- Enhance `Keybind.parse()` for chord syntax
- Update `Keybind.match()` for chord matching

### TUI Context
- Enhance `keybind.tsx` with state machine
- Maintain focus management
- Add visual feedback for leader/chord modes

## Configuration Schema

### Chord Syntax Examples
```
# Simple chords
"gg"           # Press g twice
"dd"           # Press d twice

# Modified chords  
"ctrl+xx"      # Hold ctrl + press x twice
"shift+ww"     # Hold shift + press w twice

# Leader chords
"<leader>gg"   # Leader + g twice
"<leader>dd"   # Leader + d twice

# Mixed sequences
"<leader>g d"  # Leader + g then d
```

## Testing Strategy

### Unit Tests
- State machine transitions
- Chord detection logic
- Pattern matching
- Timeout handling

### Integration Tests
- Full keybind workflow
- Focus management
- Visual feedback
- Performance under rapid key presses

## Performance Considerations

- Efficient key tracking with Sets
- Debounced timeout handling
- Minimal state updates
- Fast pattern matching