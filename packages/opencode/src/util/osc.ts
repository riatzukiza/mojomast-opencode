export const stripOSC = (str: string): string => {
  return (
    str
      // Remove OSC sequences with BEL terminator (\x07)
      .replace(/\x1b\][0-9]+;[^\x07]*\x07/g, "")
      // Remove OSC sequences with ST terminator (ESC \)
      .replace(/\x1b\][0-9]+;[^\x1b]*\x1b\\/g, "")
      // Remove iTerm2-specific OSC sequences with BEL terminator
      .replace(/\x1b\]1337;[^\x07]*\x07/g, "")
      // Remove iTerm2-specific OSC sequences with ST terminator
      .replace(/\x1b\]1337;[^\x1b]*\x1b\\/g, "")
      // Remove OSC 8 (hyperlinks) with BEL terminator
      .replace(/\x1b\]8;[^\x07]*\x07/g, "")
      // Remove OSC 8 (hyperlinks) with ST terminator
      .replace(/\x1b\]8;[^\x1b]*\x1b\\/g, "")
      // Remove OSC 52 (clipboard operations) with BEL terminator
      .replace(/\x1b\]52;[^\x07]*\x07/g, "")
      // Remove OSC 52 (clipboard operations) with ST terminator
      .replace(/\x1b\]52;[^\x1b]*\x1b\\/g, "")
      // Remove any remaining OSC sequences with BEL terminator
      .replace(/\x1b\][^\x07]*\x07/g, "")
      // Remove any remaining OSC sequences with ST terminator
      .replace(/\x1b\][^\x1b]*\x1b\\/g, "")
      // Remove malformed OSC sequences at end of string
      .replace(/\x1b\][^\x07\x1b]*$/g, "")
  )
}
