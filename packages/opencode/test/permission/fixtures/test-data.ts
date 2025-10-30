import type { Permission } from "../../../src/permission"

export function createPermissionInfo(overrides: Partial<Permission.Info> = {}): Permission.Info {
  return {
    id: "test-permission-id",
    type: "test-tool",
    pattern: "test-pattern",
    sessionID: "test-session-id",
    messageID: "test-message-id",
    callID: "test-call-id",
    title: "Test Permission",
    metadata: { test: true },
    time: {
      created: Date.now(),
    },
    ...overrides,
  }
}

export function createPermissionInput(
  overrides: Partial<
    Omit<Parameters<typeof Permission.ask>[0], "metadata"> & { metadata?: Record<string, any> }
  > = {},
): Parameters<typeof Permission.ask>[0] {
  return {
    type: "test-tool",
    title: "Test Permission",
    pattern: "test-pattern",
    callID: "test-call-id",
    sessionID: "test-session-id",
    messageID: "test-message-id",
    metadata: { test: true },
    ...overrides,
  }
}

export const VALID_PERMISSION_RESPONSES = ["once", "always", "reject"] as const

export const MOCK_PLUGIN_RESPONSES = {
  allow: { status: "allow" },
  deny: { status: "deny" },
  error: { status: "error" },
} as const

export const TEST_PATTERNS = {
  exact: "tool.read",
  wildcard: "tool.*",
  multi: ["tool.read", "tool.write"],
  complex: "tool.read.*.file",
} as const

export const TEST_SESSIONS = {
  valid: "test-session-123",
  empty: "",
  special: "session-with-特殊-characters",
  long: "a".repeat(1000),
} as const
