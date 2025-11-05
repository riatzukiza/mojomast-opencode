import { describe, test, expect } from "bun:test"
import { getPlatformModifier, getModifierState, isModifierPressed, matchesShortcut } from "./modifiers"

describe("Modifier Utility", () => {
  test("getPlatformModifier should return correct modifier for platform", () => {
    // Mock navigator.platform for testing
    const originalPlatform = navigator.platform
    
    // Test Mac platform
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      configurable: true,
    })
    expect(getPlatformModifier()).toBe("Meta")
    
    // Test non-Mac platform
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    })
    expect(getPlatformModifier()).toBe("Control")
    
    // Restore original platform
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      configurable: true,
    })
  })

  test("getModifierState should return correct state", () => {
    const mockEvent = {
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: true,
      getModifierState: (key: string) => key === "Control",
    } as unknown as KeyboardEvent

    const state = getModifierState(mockEvent)
    expect(state.ctrl).toBe(true)
    expect(state.meta).toBe(false)
    expect(state.alt).toBe(false)
    expect(state.shift).toBe(true)
    expect(state.cmd).toBe(false)
    expect(state.mod).toBe(true)
  })

  test("isModifierPressed should work correctly", () => {
    const mockEvent = {
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      getModifierState: (key: string) => key === "Control",
    } as unknown as KeyboardEvent

    expect(isModifierPressed(mockEvent, "ctrl")).toBe(true)
    expect(isModifierPressed(mockEvent, "meta")).toBe(false)
    expect(isModifierPressed(mockEvent, "alt")).toBe(false)
    expect(isModifierPressed(mockEvent, "shift")).toBe(false)
    expect(isModifierPressed(mockEvent, "cmd")).toBe(false)
    expect(isModifierPressed(mockEvent, "mod")).toBe(true)
  })

  test("matchesShortcut should match simple shortcuts", () => {
    const mockEvent = {
      key: "p",
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      getModifierState: (key: string) => false,
    } as unknown as KeyboardEvent

    expect(matchesShortcut(mockEvent, "p")).toBe(true)
    expect(matchesShortcut(mockEvent, "x")).toBe(false)
  })

  test("matchesShortcut should match modifier shortcuts", () => {
    // Mock Windows platform for this test
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

    expect(matchesShortcut(mockEvent, "mod+p")).toBe(true)
    expect(matchesShortcut(mockEvent, "mod+shift+p")).toBe(false)
    expect(matchesShortcut(mockEvent, "ctrl+p")).toBe(false)
    
    // Restore original platform
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      configurable: true,
    })
  })

  test("matchesShortcut should handle platform differences", () => {
    const originalPlatform = navigator.platform
    
    // Test Mac platform (Meta key)
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      configurable: true,
    })
    
    const macEvent = {
      key: "p",
      ctrlKey: false,
      metaKey: true,
      altKey: false,
      shiftKey: false,
      getModifierState: (key: string) => key === "Meta", // Mock getModifierState for Mac
    } as unknown as KeyboardEvent

    expect(matchesShortcut(macEvent, "mod+p")).toBe(true)

    // Test Windows platform (Control key)
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    })
    
    const winEvent = {
      key: "p",
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      getModifierState: (key: string) => key === "Control", // Mock getModifierState for Windows
    } as unknown as KeyboardEvent

    expect(matchesShortcut(winEvent, "mod+p")).toBe(true)
    
    // Restore original platform
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      configurable: true,
    })
  })
})