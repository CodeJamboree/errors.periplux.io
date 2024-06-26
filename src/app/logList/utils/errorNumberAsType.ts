export const errorNumberAsType = (errorNumber: string): string => {
  switch (errorNumber) {
    // Standard
    case '1': return 'PHP Error';
    case '2': return 'PHP Warning';
    case '4': return 'PHP Parse';
    case '8': return 'PHP Notice';
    case '2048': return 'PHP Strict';
    case '8192': return 'PHP Deprecated';
    // Core
    case '16': return 'PHP Core Error';
    case '32': return 'PHP Core Warning';
    // Compile
    case '64': return 'PHP Compile Error';
    case '128': return 'PHP Compile Warning';
    // Recoverable
    case '4096': return 'PHP Recoverable Error';
    // User
    case '256': return 'PHP User Error';
    case '512': return 'PHP User Warning';
    case '1024': return 'PHP User Notice';
    case '16384': return 'PHP User Deprecated';
    // Exception Handler / misc
    default: return errorNumber;
  }
}