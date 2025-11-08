import { Instance } from "../project/instance"
import { Log } from "../util/log"

export namespace FileTime {
  const log = Log.create({ service: "file.time" })
  export const state = Instance.state(() => {
    const read: {
      [sessionID: string]: {
        [path: string]: Date | undefined
      }
    } = {}
    const writes: {
      [path: string]:
        | {
            sessionID: string
            time: Date
          }
        | undefined
    } = {}
    return {
      read,
      writes,
    }
  })

  // Record last known read time for a file within a session.
  // This is intentionally best-effort and not a strict lock.
  export function read(sessionID: string, file: string) {
    log.info("read", { sessionID, file })
    const { read } = state()
    read[sessionID] = read[sessionID] || {}
    read[sessionID][file] = new Date()
  }

  export function get(sessionID: string, file: string) {
    return state().read[sessionID]?.[file]
  }

  export function wrote(sessionID: string, file: string, time: Date) {
    const snapshot = new Date(time.getTime())
    state().writes[file] = {
      sessionID,
      time: snapshot,
    }
  }

  export function forget(file: string) {
    delete state().writes[file]
  }

  // Validate that the file has been read in this session before editing and
  // guard against external changes. Same-session overlapping edits are allowed
  // because we record our own writes (issue #2882), but if another session or
  // external process modifies the file after our last read, we require a re-read.
  export async function assert(sessionID: string, filepath: string) {
    const time = get(sessionID, filepath)
    if (!time) throw new Error(`You must read the file ${filepath} before overwriting it. Use the Read tool first`)

    const stats = await Bun.file(filepath).stat()
    const diskTime = stats.mtime.getTime()
    const readTime = time.getTime()

    if (diskTime > readTime) {
      const lastWrite = state().writes[filepath]
      if (lastWrite && lastWrite.sessionID === sessionID && lastWrite.time.getTime() === diskTime) {
        return
      }
      throw new Error(
        `File ${filepath} has been modified since it was last read.\nLast modification: ${stats.mtime.toISOString()}\nLast read: ${time.toISOString()}\n\nPlease read the file again before modifying it.`,
      )
    }
  }
}
