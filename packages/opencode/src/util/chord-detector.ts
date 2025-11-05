import type { Keybind } from "./keybind"

export interface ChordPattern {
  keys: Keybind.Info[]
  timeout?: number
  description?: string
}

export interface ChordEvent {
  type: "KEY_DOWN" | "KEY_UP"
  key: Keybind.Info
  timestamp: number
}

export class ChordDetector {
  private activeKeys = new Map<string, Keybind.Info>()
  private chordPatterns: ChordPattern[] = []
  private currentChord: Keybind.Info[] = []
  private chordTimeout?: NodeJS.Timeout
  private readonly CHORD_TIMEOUT = 100 // 100ms for chord detection

  constructor(patterns: ChordPattern[] = []) {
    this.chordPatterns = patterns
  }

  addPattern(pattern: ChordPattern) {
    this.chordPatterns.push(pattern)
  }

  removePattern(pattern: ChordPattern) {
    const index = this.chordPatterns.indexOf(pattern)
    if (index > -1) {
      this.chordPatterns.splice(index, 1)
    }
  }

  private getKeySignature(key: Keybind.Info): string {
    return `${key.ctrl ? "c" : ""}${key.meta ? "m" : ""}${key.shift ? "s" : ""}${key.name}`
  }

  private keysEqual(a: Keybind.Info, b: Keybind.Info): boolean {
    return a.ctrl === b.ctrl && 
           a.meta === b.meta && 
           a.shift === b.shift && 
           a.leader === b.leader && 
           a.name === b.name
  }

  private matchPattern(chord: Keybind.Info[]): ChordPattern | null {
    // Sort both chord and pattern keys for consistent comparison
    const sortedChord = [...chord].sort((a, b) => 
      this.getKeySignature(a).localeCompare(this.getKeySignature(b))
    )

    for (const pattern of this.chordPatterns) {
      const sortedPattern = [...pattern.keys].sort((a, b) => 
        this.getKeySignature(a).localeCompare(this.getKeySignature(b))
      )

      if (sortedChord.length === sortedPattern.length) {
        const matches = sortedChord.every((key, index) => 
          this.keysEqual(key, sortedPattern[index])
        )
        
        if (matches) {
          return pattern
        }
      }
    }

    return null
  }

  handleEvent(event: ChordEvent): {
    type: "chord_detected" | "chord_released" | "key_press" | "none"
    chord?: Keybind.Info[]
    pattern?: ChordPattern
    key?: Keybind.Info
  } {
    const signature = this.getKeySignature(event.key)

    if (event.type === "KEY_DOWN") {
      this.activeKeys.set(signature, event.key)
      this.currentChord = Array.from(this.activeKeys.values())

      // Start/restart chord timeout
      if (this.chordTimeout) {
        clearTimeout(this.chordTimeout)
      }
      
      this.chordTimeout = setTimeout(() => {
        // Check if we have a valid chord
        if (this.currentChord.length > 1) {
          const pattern = this.matchPattern(this.currentChord)
          if (pattern) {
            return {
              type: "chord_detected",
              chord: this.currentChord,
              pattern,
            }
          }
        }
      }, this.CHORD_TIMEOUT)

      return {
        type: this.currentChord.length > 1 ? "chord_detected" : "key_press",
        chord: this.currentChord.length > 1 ? this.currentChord : undefined,
        key: event.key,
      }
    } else if (event.type === "KEY_UP") {
      this.activeKeys.delete(signature)
      const wasChord = this.currentChord.length > 1
      this.currentChord = Array.from(this.activeKeys.values())

      if (wasChord && this.currentChord.length === 0) {
        // Chord completed - check for pattern match
        const pattern = this.matchPattern(this.currentChord)
        return {
          type: "chord_released",
          chord: [],
          pattern,
        }
      }

      return {
        type: "none",
      }
    }

    return { type: "none" }
  }

  getActiveChord(): Keybind.Info[] {
    return [...this.currentChord]
  }

  isActive(): boolean {
    return this.activeKeys.size > 0
  }

  reset() {
    this.activeKeys.clear()
    this.currentChord = []
    if (this.chordTimeout) {
      clearTimeout(this.chordTimeout)
      this.chordTimeout = undefined
    }
  }
}