import { vi } from "vitest"

// Global shared state for all tests
let globalMockState = {
  pending: {},
  approved: {},
}

export const mockPlugin = {
  trigger: vi.fn(),
}

export const mockBus = {
  publish: vi.fn(),
  subscribe: vi.fn(),
}

export const mockIdentifier = {
  ascending: vi.fn((prefix: string) => `${prefix}-${Date.now()}`),
}

export const mockLog = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

export const mockInstance = {
  state: vi.fn((init, cleanup) => {
    // Call the init function to get the initial state
    const initialState = init()
    // Replace with our global state
    Object.assign(initialState, globalMockState)
    // Return the state function and cleanup
    return () => initialState
  }),
}

export function createMockState(pending = {}, approved = {}) {
  globalMockState.pending = pending
  globalMockState.approved = approved
  return {
    mockState: globalMockState,
    mockCleanup: async () => {},
  }
}

export function createMockPermissionState(pending = {}, approved = {}) {
  globalMockState.pending = pending
  globalMockState.approved = approved
  return {
    mockState: globalMockState,
    mockCleanup: async () => {},
  }
}

export function createMockPluginResponse(status: "allow" | "deny" | "error" = "allow") {
  return Promise.resolve({ status })
}

export function resetAllMocks() {
  vi.clearAllMocks()
  mockPlugin.trigger.mockReset()
  mockBus.publish.mockReset()
  mockBus.subscribe.mockReset()
  mockIdentifier.ascending.mockReset()
  mockLog.info.mockReset()
  mockLog.error.mockReset()
  mockLog.warn.mockReset()
  mockLog.debug.mockReset()
  mockInstance.state.mockReset()
  mockInstance.state.mockReturnValue(globalMockState)

  // Reset global state
  globalMockState = {
    pending: {},
    approved: {},
  }
}
