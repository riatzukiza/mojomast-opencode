import { isDeepEqual } from "remeda"

export namespace Keybind {
  export type Info = {
    ctrl: boolean
    meta: boolean
    shift: boolean
    leader: boolean
    name: string
  }

  export type ChordState = "idle" | "leader_active" | "chord_building" | "timeout" | "matched"

  export type ChordSequence = Info[]

  export interface StateMachine {
    state: ChordState
    sequence: ChordSequence
    timeout: NodeJS.Timeout | null
    startTime: number | null
  }

  export function match(a: Info, b: Info): boolean {
    return isDeepEqual(a, b)
  }

  export function toString(info: Info): string {
    const parts: string[] = []

    if (info.ctrl) parts.push("ctrl")
    if (info.meta) parts.push("alt")
    if (info.shift) parts.push("shift")
    if (info.name) {
      if (info.name === "delete") parts.push("del")
      else parts.push(info.name)
    }

    let result = parts.join("+")

    if (info.leader) {
      result = result ? `<leader> ${result}` : `<leader>`
    }

    return result
  }

  export function parse(key: string): Info[] {
    if (key === "none") return []

    return key.split(",").map((combo) => {
      // Handle <leader> syntax by replacing with leader+
      const normalized = combo.replace(/<leader>/g, "leader+")
      const parts = normalized.toLowerCase().split("+")
      const info: Info = {
        ctrl: false,
        meta: false,
        shift: false,
        leader: false,
        name: "",
      }

      for (const part of parts) {
        switch (part) {
          case "ctrl":
            info.ctrl = true
            break
          case "alt":
          case "meta":
          case "option":
            info.meta = true
            break
          case "shift":
            info.shift = true
            break
          case "leader":
            info.leader = true
            break
          default:
            info.name = part
            break
        }
      }

      return info
    })
  }

  export function parseChord(key: string): Info[][] {
    if (key === "none") return []

    return key.split(",").map((chord) => {
      // Handle chords like "<leader>gg" or "<leader>wq"
      const chordParts = chord.split(/\s+/).filter(Boolean)
      return chordParts.map((part) => parse(part)[0]!)
    })
  }

  export function matchChord(sequence: ChordSequence, patterns: Info[][]): boolean {
    return patterns.some((pattern) => {
      if (pattern.length !== sequence.length) return false
      return pattern.every((key, index) => match(key, sequence[index]))
    })
  }

  export function sequenceToString(sequence: ChordSequence): string {
    return sequence.map((key) => toString(key)).join(" ")
  }

  export function createStateMachine(): StateMachine {
    return {
      state: "idle",
      sequence: [],
      timeout: null,
      startTime: null,
    }
  }
}
