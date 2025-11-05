import { createStore } from "solid-js/store"
import { isDeepEqual } from "remeda"
import type { Keybind } from "./keybind"

export type KeyState = 
  | "idle"           // Normal key processing
  | "leader"         // Leader key pressed, waiting for sequence
  | "chording"       // Multiple keys held (chord detection)
  | "sequencing"     // Building key sequence after leader
  | "timeout"        // Leader mode expired
  | "matched"        // Complete sequence matched
  | "failed"         // No matching sequence found

export interface KeyStateMachineContext {
  state: KeyState
  sequence: Keybind.Info[]
  activeKeys: Set<string>
  leaderKey?: Keybind.Info
  timeoutId?: NodeJS.Timeout
  matchedKeybind?: string
}

export interface KeyStateMachineEvent {
  type: "KEY_DOWN" | "KEY_UP" | "TIMEOUT"
  key: Keybind.Info
  timestamp: number
}

export class KeyStateMachine {
  private store = createStore<KeyStateMachineContext>({
    state: "idle",
    sequence: [],
    activeKeys: new Set(),
  })

  private listeners: Array<(context: KeyStateMachineContext) => void> = []
  private keybinds: Record<string, Keybind.Info[]> = {}

  constructor(keybinds: Record<string, Keybind.Info[]> = {}) {
    this.keybinds = keybinds
  }

  getState(): KeyState {
    return this.store.state
  }

  getContext(): KeyStateMachineContext {
    return { ...this.store }
  }

  subscribe(listener: (context: KeyStateMachineContext) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  private notifyListeners() {
    const context = this.getContext()
    this.listeners.forEach(listener => listener(context))
  }

  private transition(newState: KeyState, updates: Partial<KeyStateMachineContext> = {}) {
    this.store.setState(prev => ({
      ...prev,
      state: newState,
      ...updates,
    }))
    this.notifyListeners()
  }

  private clearTimeout() {
    if (this.store.timeoutId) {
      clearTimeout(this.store.timeoutId)
      this.store.setState("timeoutId", undefined)
    }
  }

  private startTimeout(ms: number = 2000) {
    this.clearTimeout()
    const timeoutId = setTimeout(() => {
      this.handleEvent({
        type: "TIMEOUT",
        key: { ctrl: false, meta: false, shift: false, leader: false, name: "" },
        timestamp: Date.now(),
      })
    }, ms)
    this.store.setState("timeoutId", timeoutId)
  }

  private getKeySignature(key: Keybind.Info): string {
    return `${key.ctrl ? "c" : ""}${key.meta ? "m" : ""}${key.shift ? "s" : ""}${key.name}`
  }

  private matchKeybind(keybindName: string, key: Keybind.Info): boolean {
    const keybind = this.keybinds[keybindName]
    if (!keybind) return false

    return keybind.some(k => isDeepEqual(k, key))
  }

  private matchSequence(keybindName: string, sequence: Keybind.Info[]): boolean {
    const keybind = this.keybinds[keybindName]
    if (!keybind) return false

    // Check if sequence matches any keybind pattern
    return keybind.some(k => {
      if (k.leader && sequence.length > 0) {
        // Check if first key is leader and rest matches
        const [first, ...rest] = sequence
        if (!first.leader) return false
        
        // Simple matching for now - can be enhanced
        return rest.length === 1 && isDeepEqual(rest[0], { ...k, leader: false })
      }
      return false
    })
  }

  handleEvent(event: KeyStateMachineEvent) {
    const { state, sequence, activeKeys, leaderKey } = this.store

    switch (state) {
      case "idle":
        if (event.type === "KEY_DOWN") {
          if (this.matchKeybind("leader", event.key)) {
            this.transition("leader", {
              leaderKey: event.key,
              sequence: [event.key],
            })
            this.startTimeout()
          } else if (activeKeys.size > 0) {
            // Multiple keys pressed - potential chord
            this.transition("chording")
          } else {
            // Single key - normal processing
            this.transition("idle", {
              sequence: [event.key],
            })
          }
        }
        break

      case "leader":
        if (event.type === "KEY_DOWN") {
          this.clearTimeout()
          const newSequence = [...sequence, event.key]
          
          if (this.matchSequence("any", newSequence)) {
            this.transition("matched", {
              sequence: newSequence,
              matchedKeybind: "matched",
            })
          } else {
            this.transition("sequencing", {
              sequence: newSequence,
            })
            this.startTimeout()
          }
        } else if (event.type === "TIMEOUT") {
          this.transition("timeout")
        }
        break

      case "chording":
        if (event.type === "KEY_DOWN") {
          // Add to active keys for chord detection
          activeKeys.add(this.getKeySignature(event.key))
        } else if (event.type === "KEY_UP") {
          activeKeys.delete(this.getKeySignature(event.key))
          
          if (activeKeys.size === 0) {
            // All keys released - check for chord match
            if (sequence.length > 1) {
              this.transition("matched", {
                matchedKeybind: "chord",
              })
            } else {
              this.transition("failed")
            }
          }
        }
        break

      case "sequencing":
        if (event.type === "KEY_DOWN") {
          this.clearTimeout()
          const newSequence = [...sequence, event.key]
          
          if (this.matchSequence("any", newSequence)) {
            this.transition("matched", {
              sequence: newSequence,
              matchedKeybind: "matched",
            })
          } else {
            this.transition("sequencing", {
              sequence: newSequence,
            })
            this.startTimeout()
          }
        } else if (event.type === "TIMEOUT") {
          this.transition("timeout")
        }
        break

      case "matched":
      case "failed":
      case "timeout":
        // Reset to idle after a brief delay
        setTimeout(() => {
          this.transition("idle", {
            sequence: [],
            activeKeys: new Set(),
            leaderKey: undefined,
            matchedKeybind: undefined,
          })
        }, 100)
        break
    }
  }

  updateKeybinds(keybinds: Record<string, Keybind.Info[]>) {
    this.keybinds = keybinds
  }

  reset() {
    this.clearTimeout()
    this.transition("idle", {
      sequence: [],
      activeKeys: new Set(),
      leaderKey: undefined,
      matchedKeybind: undefined,
    })
  }
}