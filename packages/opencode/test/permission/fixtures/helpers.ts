import { vi } from "vitest"
import type { Permission } from "../../../src/permission"

export async function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export function createTestPromise<T = void>() {
  let resolve: (value: T) => void
  let reject: (reason?: any) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve: resolve!, reject: reject! }
}

export function createMockPermissionState() {
  const state = {
    pending: {} as Record<
      string,
      Record<string, { info: Permission.Info; resolve: () => void; reject: (e: any) => void }>
    >,
    approved: {} as Record<string, Record<string, boolean>>,
  }

  const mockState = vi.fn(() => state)
  const mockCleanup = vi.fn()

  return { state, mockState, mockCleanup }
}

export function expectPermissionInfo(info: Permission.Info, expected: Partial<Permission.Info>) {
  expect(info).toMatchObject(expected)
  expect(typeof info.id).toBe("string")
  expect(typeof info.time.created).toBe("number")
  expect(info.time.created).toBeGreaterThan(0)
}

export function expectRejectedError(
  error: any,
  expectedSessionID: string,
  expectedPermissionID: string,
) {
  expect(error).toBeInstanceOf(Error)
  expect(error.sessionID).toBe(expectedSessionID)
  expect(error.permissionID).toBe(expectedPermissionID)
  expect(error.message).toContain("rejected permission")
}

export function createConcurrentRequests(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    sessionID: `session-${i}`,
    messageID: `message-${i}`,
    callID: `call-${i}`,
    type: `tool-${i}`,
    title: `Test Permission ${i}`,
    pattern: `pattern-${i}`,
    metadata: { index: i },
  }))
}
