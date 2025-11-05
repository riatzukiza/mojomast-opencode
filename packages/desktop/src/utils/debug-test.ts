import { getPlatformModifier, getModifierState, matchesShortcut } from "./modifiers"

// Mock Windows platform
const originalPlatform = navigator.platform
Object.defineProperty(navigator, "platform", {
  value: "Win32",
  configurable: true,
})

console.log("Platform modifier:", getPlatformModifier())

const mockEvent = {
  key: "p",
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  getModifierState: (key: string) => {
    console.log("getModifierState called with:", key)
    return key === "Control"
  },
} as unknown as KeyboardEvent

console.log("Modifier state:", getModifierState(mockEvent))
console.log("matchesShortcut result:", matchesShortcut(mockEvent, "mod+p"))

// Restore original platform
Object.defineProperty(navigator, "platform", {
  value: originalPlatform,
  configurable: true,
})