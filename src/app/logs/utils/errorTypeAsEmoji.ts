import { errorNumberAsType } from "./errorNumberAsType";

export const errorTypeAsEmoji = (type: string): string => {
  const lower = errorNumberAsType(type).toLocaleLowerCase();
  const squaredSos = '\u{1f198}';
  const information = '\u2139\ufe0f';
  const crossMark = '\u274c';
  const warning = '\u26A0\uFE0F';
  const hammerAndWrench = '\u{1f6e0}\ufe0f';
  const knot = '\u{1faa2}';
  const gear = '\u2699\uFE0F';
  const backhandIndexPointingRight = '\uD83D\uDC49';
  const downArrow = '\u2B07\ufe0f';
  const manShrugging = '\uD83E\uDD37\u200D\u2642\uFE0F';
  const locked = '\u{1f512}';
  const adhesiveBandage = '\u{1FA79}';
  const triangularRedFlag = '\u{1f6a9}';
  const cardFileBox = '\u{1F5C3}';
  switch (lower) {
    // Standard
    case 'php error': return crossMark;
    case 'php warning': return warning;
    case 'php parse': return knot;
    case 'php notice': return information;
    case 'php strict': return locked;
    case 'php deprecated': return downArrow;
    // Core
    case 'php core error': return gear + crossMark;
    case 'php core warning': return gear + warning;
    // Compile
    case 'php compile error': return hammerAndWrench + crossMark;
    case 'php compile warning': return hammerAndWrench + warning;
    // Recoverable
    case 'php recoverable error': return warning + adhesiveBandage;
    // Fatal
    case 'php fatal error': return squaredSos;
    // User
    case 'php user error': return backhandIndexPointingRight + crossMark;
    case 'php user warning': return backhandIndexPointingRight + warning;
    case 'php user notice': return backhandIndexPointingRight + information;
    case 'php user deprecated': return backhandIndexPointingRight + downArrow;
    // Exception Handler / misc
    default:
      if (lower.startsWith('mysqli')) {
        return cardFileBox + triangularRedFlag;
      }
      if (lower.endsWith("error") || lower.endsWith('exception')) {
        return triangularRedFlag;
      }
      return manShrugging;
  }
}