import { getPlatformModifier, getModifierState, isModifierPressed, matchesShortcut } from "./modifiers"

// Mock Windows platform
const originalPlatform = navigator.platform
Object.defineProperty(navigator, "platform", {
  value: "Win32",
  configurable: true,
})

const mockEvent = {
  key: "p",
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  getModifierState: (key: string) => key === "Control",
} as unknown as KeyboardEvent

console.log("=== Debugging matchesShortcut ===")
console.log("Event key:", mockEvent.key)
console.log("Event ctrlKey:", mockEvent.ctrlKey)
console.log("Event metaKey:", mockEvent.metaKey)

const state = getModifierState(mockEvent)
console.log("Modifier state:", state)

console.log("isModifierPressed(event, 'mod'):", isModifierPressed(mockEvent, "mod"))
console.log("isModifierPressed(event, 'ctrl'):", isModifierPressed(mockEvent, "ctrl"))
console.log("isModifierPressed(event, 'meta'):", isModifierPressed(mockEvent, "meta"))

// Let's manually trace through matchesShortcut logic
const shortcut = "mod+p"
const parts = shortcut.toLowerCase().split("+").map(p => p.trim())
const key = parts.pop()
console.log("Shortcut parts:", parts, "key:", key)

console.log("All modifiers check:")
const allModifiers = ["ctrl", "meta", "alt", "shift", "cmd", "mod"]
for (const modifier of allModifiers) {
  const pressed = isModifierPressed(mockEvent, modifier)
  const required = parts.includes(modifier)
  console.log(`  ${modifier}: pressed=${pressed}, required=${required}`)
  
  if (pressed && !required) {
    console.log(`  -> FAIL: Extra modifier ${modifier} is pressed`)
  }
}

console.log("Final key check:", mockEvent.key.toLowerCase() === key)

// Restore original platform
Object.defineProperty(navigator, "platform", {
  value: originalPlatform,
  configurable: true,
})