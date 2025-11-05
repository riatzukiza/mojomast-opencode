// @bun
// src/util/terminal.ts
import { platform } from "os";

// src/util/osc.ts
var stripOSC = (str) => {
  return str.replace(/\x1b\][0-9]+;[^\x07]*\x07/g, "").replace(/\x1b\][0-9]+;[^\x1b]*\x1b\\/g, "").replace(/\x1b\]1337;[^\x07]*\x07/g, "").replace(/\x1b\]1337;[^\x1b]*\x1b\\/g, "").replace(/\x1b\]8;[^\x07]*\x07/g, "").replace(/\x1b\]8;[^\x1b]*\x1b\\/g, "").replace(/\x1b\]52;[^\x07]*\x07/g, "").replace(/\x1b\]52;[^\x1b]*\x1b\\/g, "").replace(/\x1b\][^\x07]*\x07/g, "").replace(/\x1b\][^\x1b]*\x1b\\/g, "").replace(/\x1b\][^\x07\x1b]*$/g, "");
};

// src/util/terminal.ts
var TerminalUtil;
((TerminalUtil) => {
  function getTerminalCapabilities() {
    const isWindows = platform() === "win32";
    const term = process.env.TERM || "";
    const colorterm = process.env.COLORTERM || "";
    const isGitBash = isWindows && (term.includes("msys") || term.includes("cygwin") || term.includes("mintty") || process.env.MSYSTEM?.includes("MINGW") || process.env.MSYSTEM?.includes("MSYS"));
    return {
      supportsTrueColor: colorterm.includes("24bit") || colorterm.includes("truecolor"),
      supportsUnicode: true,
      supportsAnsiColors: true,
      isGitBash
    };
  }
  TerminalUtil.getTerminalCapabilities = getTerminalCapabilities;
  function shouldStripAnsi(content, capabilities) {
    const caps = capabilities || getTerminalCapabilities();
    if (caps.isGitBash && caps.supportsAnsiColors) {
      return false;
    }
    return !caps.supportsAnsiColors;
  }
  TerminalUtil.shouldStripAnsi = shouldStripAnsi;
  function processAnsiContent(content, capabilities) {
    const caps = capabilities || getTerminalCapabilities();
    content = stripOSC(content);
    if (shouldStripAnsi(content, caps)) {
      return Bun.stripANSI(content);
    }
    if (caps.isGitBash) {
      return content.replace(/\x1b\[/g, "\x1B[").replace(/\x1b\]/g, "\x1B]");
    }
    return content;
  }
  TerminalUtil.processAnsiContent = processAnsiContent;
})(TerminalUtil ||= {});
export {
  TerminalUtil
};
