import { isDeepEqual } from "remeda"

export namespace Keybind {
  export type Info = {
    ctrl: boolean
    meta: boolean
    shift: boolean
    leader: boolean
    name: string
  }

  export type ChordInfo = {
    keys: Info[]
    timeout?: number
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

  export function parseChord(chord: string): ChordInfo[] {
    if (chord === "none") return []

    return chord.split(",").map((combo) => {
      // Handle chord syntax like "gg" or "ctrl+xx"
      const keys: Info[] = []
      const parts = combo.toLowerCase().split("+")
      
      let modifiers = {
        ctrl: false,
        meta: false,
        shift: false,
        leader: false,
      }

      // Extract modifiers
      for (const part of parts) {
        switch (part) {
          case "ctrl":
            modifiers.ctrl = true
            break
          case "alt":
          case "meta":
          case "option":
            modifiers.meta = true
            break
          case "shift":
            modifiers.shift = true
            break
          case "leader":
            modifiers.leader = true
            break
          default:
            // This is the key part - handle repeated keys for chords
            if (part.length > 0) {
              for (let i = 0; i < part.length; i++) {
                keys.push({
                  ...modifiers,
                  name: part[i],
                })
              }
            }
            break
        }
      }

      return {
        keys,
        timeout: 100, // Default chord timeout
      }
    })
  }

  export function matchChord(chord: ChordInfo, input: Info[]): boolean {
    if (chord.keys.length !== input.length) return false
    
    // Sort both arrays for comparison (order doesn't matter for chords)
    const sortedChord = [...chord.keys].sort((a, b) => 
      toString(a).localeCompare(toString(b))
    )
    const sortedInput = [...input].sort((a, b) => 
      toString(a).localeCompare(toString(b))
    )

    return sortedChord.every((key, index) => match(key, sortedInput[index]))
  }

  export function chordToString(chord: ChordInfo): string {
    if (chord.keys.length === 0) return ""
    
    // Group by modifiers and combine repeated keys
    const modifierGroups = new Map<string, Info[]>()
    
    for (const key of chord.keys) {
      const modifierStr = `${key.ctrl ? "ctrl" : ""}${key.meta ? "meta" : ""}${key.shift ? "shift" : ""}${key.leader ? "leader" : ""}`
      
      if (!modifierGroups.has(modifierStr)) {
        modifierGroups.set(modifierStr, [])
      }
      modifierGroups.get(modifierStr)!.push(key)
    }

    const parts: string[] = []
    
    for (const [modifiers, keys] of modifierGroups) {
      const modifierParts: string[] = []
      if (modifiers.includes("ctrl")) modifierParts.push("ctrl")
      if (modifiers.includes("meta")) modifierParts.push("meta")
      if (modifiers.includes("shift")) modifierParts.push("shift")
      if (modifiers.includes("leader")) modifierParts.push("leader")
      
      // Combine repeated keys
      const keyNames = keys.map(k => k.name).join("")
      
      if (modifierParts.length > 0) {
        parts.push(`${modifierParts.join("+")}+${keyNames}`)
      } else {
        parts.push(keyNames)
      }
    }
    
    return parts.join("+")
  }
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
}
