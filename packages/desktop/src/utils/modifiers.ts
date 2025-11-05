export type Modifier = "ctrl" | "meta" | "alt" | "shift" | "cmd" | "mod"

export interface ModifierState {
  ctrl: boolean
  meta: boolean
  alt: boolean
  shift: boolean
  cmd: boolean
  mod: boolean
}

export function getPlatformModifier(): "Meta" | "Control" {
  return typeof navigator === "object" && /(Mac|iPod|iPhone|iPad)/.test(navigator.platform) ? "Meta" : "Control"
}

export function getModifierState(event: KeyboardEvent): ModifierState {
  const platformMod = getPlatformModifier()
  
  return {
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    alt: event.altKey,
    shift: event.shiftKey,
    cmd: event.metaKey,
    mod: event.getModifierState(platformMod)
  }
}

export function isModifierPressed(event: KeyboardEvent, modifier: Modifier): boolean {
  const state = getModifierState(event)
  
  switch (modifier) {
    case "ctrl":
      return state.ctrl
    case "meta":
      return state.meta
    case "alt":
      return state.alt
    case "shift":
      return state.shift
    case "cmd":
      return state.cmd
    case "mod":
      return state.mod
    default:
      return false
  }
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+").map(p => p.trim())
  const key = parts.pop()
  if (!key) return false
  
  const modifiers = parts as Modifier[]
  const state = getModifierState(event)
  
  // Check if all required modifiers are pressed
  for (const modifier of modifiers) {
    if (!isModifierPressed(event, modifier)) return false
  }
  
  // Check if no extra modifiers are pressed (except shift if it's part of shortcut)
  const allModifiers: Modifier[] = ["ctrl", "meta", "alt", "shift", "cmd", "mod"]
  for (const modifier of allModifiers) {
    if (isModifierPressed(event, modifier) && !modifiers.includes(modifier)) {
      // Allow shift if it's not explicitly required but key is uppercase
      if (modifier === "shift" && event.key === event.key.toUpperCase() && event.key !== event.key.toLowerCase()) {
        continue
      }
      
      // Don't treat ctrl/meta as extra if mod is required (they're platform-specific equivalents)
      if (modifiers.includes("mod") && (modifier === "ctrl" || modifier === "meta" || modifier === "cmd")) {
        continue
      }
      
      // Don't treat meta as extra if cmd is required (they're equivalent)
      if (modifiers.includes("cmd") && modifier === "meta") {
        continue
      }
      
      return false
    }
  }
  
  // Check the key
  return event.key.toLowerCase() === key
}

// Legacy compatibility - replaces the MOD constant pattern
export const MOD = getPlatformModifier()