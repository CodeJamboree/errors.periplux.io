/*
 * Otp Class
 *
 * This class provides functionality for generating and validating one-time passwords (OTPs)
 * for two-factor authentication (2FA) using Time-based One-Time Passwords (TOTP) and
 * Counter-based One-Time Passwords (HOTP) algorithms.
 */
type digits = 6 | 7 | 8;
type period = 15 | 30 | 60;
type type = 'totp' | 'hotp';
type algorithm = 'sha1' | 'sha256' | 'sha512';
type secret = string;
type otp = string;

const int64toBytes = (value: number): Uint8Array => {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer, 0, 8);
  dataView.setBigInt64(0, BigInt(value), false);
  return new Uint8Array(buffer);
}

async function hash_hmac(
  algorithm: algorithm,
  message: Uint8Array,
  secret: Uint8Array
): Promise<Uint8Array> {
  const hash = algorithm.replace('sha', 'SHA-');
  const key = await crypto.subtle.importKey(
    'raw', secret, { name: 'HMAC', hash }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, message);
  return new Uint8Array(signature);
}

export class TwoFactorAuth {
  private static BASE_32_SYMBOLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  private type: type;
  private algorithm: algorithm;
  private digits: digits;
  private period: period;
  private secret: string;

  /**
   * Constructor for the Otp class.
   *
   * Initializes a new instance of the Otp class with the provided parameters.
   *
   * @param string $secret The secret key used for OTP generation. It must be in Base32 format.
   * @param string $type The type of OTP authentication. Defaults to 'totp' (Time-based OTP). Valid values are 'totp' and 'hotp'.
   * @param int $period The time period in seconds for TOTP authentication. Defaults to 30 seconds.
   * @param int $digits The number of digits in the generated OTP. Defaults to 6 digits. Valid values are 6 to 8.
   * @param string $algorithm The cryptographic hash algorithm used for OTP generation.
   *                          Defaults to 'sha1'. Valid values are 'sha1', 'sha256', and 'sha512'.
   * @throws Exception If the secret key is empty, invalid, or less than 80 bits.
   * @throws Exception If the specified digits, algorithm, type, or period is invalid.
   */
  constructor(
    secret: secret,
    type: type = 'totp',
    period: period = 30,
    digits: digits = 6,
    algorithm: algorithm = 'sha1'
  ) {
    TwoFactorAuth.checkSecret(secret);
    this.secret = secret;
    this.period = period;
    this.digits = digits;
    this.algorithm = algorithm;
    this.type = type;
  }

  public static checkSecret(secret: secret) {
    if (secret.trim() === '') {
      throw new Error("Missing secret.");
    }
    const bits = secret.length * 5;
    if (bits < 80) {
      throw new Error("Expected 80 bit secret or higher.");
    }
    if (!TwoFactorAuth.valid_base32(secret)) {
      throw new Error("Invalid secret.");
    }
  }
  /**
   * Generate a random secret key for OTP authentication.
   *
   * This method generates a random secret key with a specified number of bits,
   * which is used for OTP authentication. The secret key is generated using
   * cryptographically secure random bytes and encoded in Base32 format.
   *
   * @param int $bits The number of bits for the secret key. Must be 80 or higher
   *                  and a multiple of 8. Default is 128.
   * @return string The generated random secret key.
   * @throws Exception If the number of bits is less than 80 or not a multiple of 8.
   */
  public static generate_secret(bits: number = 128): secret {
    if (bits < 80) {
      throw new Error("Expected 80 bit secret or higher.");
    } else if (bits % 8 !== 0) {
      throw new Error("Bits must be a multiple of 8.");
    }
    const length = Math.ceil(bits / 5);
    let secret = '';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      const index = bytes[i] % 32;
      secret += TwoFactorAuth.BASE_32_SYMBOLS[index];
    }
    return secret;
  }
  /**
   * Retrieve the OTP at a specified offset.
   *
   * This method calculates the OTP at an offset relative to the current time or counter.
   * For TOTP (Time-based One-Time Password), it calculates the OTP at an offset of time
   * from the current time. For HOTP (Counter-based One-Time Password), it calculates the
   * OTP at an offset of counter steps from the current counter value.
   *
   * @param int $offset The offset at which to retrieve the OTP.
   * @param int|null $input The 64 bit base time or counter value. If not provided, the current time
   *                        (for TOTP) or counter value (for HOTP) is used.
   * @return string The calculated OTP.
   * @throws Exception If the offset or input value is not an integer.
   * @throws Exception If the input is not specified for HOTP.
   * @throws Exception If the secret contains invalid Base32 characters.
   */
  public async get_relative_otp(offset: number, input?: number): Promise<otp> {
    if (this.type === 'totp') {
      if (!input) {
        input = new Date().getTime() / 1000;
      }
      input += offset * this.period;
      return this.time_based_otp(input);
    } else {
      if (!input) {
        throw new Error("Expected input to be provided.");
      }
      return this.counter_based_otp(input + offset);
    }
  }
  /**
   * Generate a One-Time Password (OTP).
   *
   * This method generates a One-Time Password (OTP) based on the configured type
   * of OTP algorithm. If the type is TOTP (Time-based One-Time Password), it generates
   * a password based on the current time (or provided time if specified). If the type
   * is HOTP (Counter-based One-Time Password), it generates a password based on the
   * provided counter value.
   *
   * @param int|null $input The 64 bit base time (for TOTP) or counter value (for HOTP).
   *                        If not provided, the current time (for TOTP) or counter value
   *                        (for HOTP) is used.
   * @return string The generated One-Time Password (OTP).
   * @throws Exception If the input is not specified for HOTP.
   * @throws Exception If the input is less than zero to TOTP.
   * @throws Exception If the secret contains invalid Base32 characters.
   */
  public async otp(input?: number): Promise<otp> {
    if (this.type === 'totp') {
      return this.time_based_otp(input);
    } else if (input) {
      return this.counter_based_otp(input);
    } else {
      throw new Error('Input required for counter-based OTP');
    }
  }
  /**
   * Generate a Time-based One-Time Password (TOTP).
   *
   * This method generates a Time-based One-Time Password (TOTP) based on the specified
   * time or the current time if not provided. The TOTP is calculated based on the time
   * divided by the configured period and then passed to the generate_otp method for
   * OTP generation.
   *
   * @param int|null $time The 64-bit Unix timestamp representing the base time for OTP generation.
   *                       If not provided, the current time is used.
   * @return string The generated Time-based One-Time Password (TOTP).
   * @throws Exception If the secret contains invalid Base32 characters.
   */
  public async time_based_otp(time?: number): Promise<otp> {
    if (!time) {
      time = new Date().getTime() / 1000;
    }
    const timestamp = Math.floor(time / this.period);
    return this.generate_otp(timestamp);
  }

  public nextPeriod(): number {
    const now = new Date().getTime();
    let timestamp = Math.floor(now / 1000 / this.period);
    const next = (timestamp + 1) * this.period * 1000;
    return next - now;
  }
  /**
   * Generate a Counter-based One-Time Password (HOTP).
   *
   * This method generates a Counter-based One-Time Password (HOTP) based on the specified
   * counter. The HOTP is calculated based on the provided counter and then passed to the
   * generate_otp method for OTP generation.
   *
   * @param int $counter The 64-bit counter value used for OTP generation.
   * @return string The generated Counter-based One-Time Password (HOTP).
   * @throws Exception If the counter is not specified.
   */
  public async counter_based_otp(counter: number): Promise<otp> {
    return this.generate_otp(counter);
  }
  /**
   * Generate a One-Time Password (OTP) based on the input value.
   *
   * This method generates a One-Time Password (OTP) based on the provided input value.
   * The input value is first checked for validity and then used to calculate the OTP
   * using the HMAC-based One-Time Password (HOTP) algorithm. The resulting OTP is then
   * returned after padding it to match the specified number of digits.
   *
   * @param int $input The 64-bit value used for OTP generation.
   * @return string The generated One-Time Password (OTP).
   * @throws Exception If the input value is not specified or is less than zero.
   * @throws Exception If the secret contains invalid Base32 characters.
   */
  private async generate_otp(input: number): Promise<otp> {
    const data = int64toBytes(input);
    const key = TwoFactorAuth.base32_decode(this.secret);
    const hash = await hash_hmac(this.algorithm, data, key);
    const view = new DataView(hash.buffer);
    const offset = view.getInt8(hash.byteLength - 1) & 0xF;
    const value = view.getInt32(offset, false) & 0x7FFFFFFF;
    const otp = value % 10 ** this.digits;
    return otp.toString().padStart(this.digits, '0');
  }
  /**
   * Generate a URI for provisioning a new OTP token.
   *
   * This method generates a URI that can be used to provision a new OTP token
   * with the specified parameters. The generated URI follows the Key URI Format
   * specified by the Google Authenticator documentation. It includes parameters
   * such as the secret key, algorithm, digits, period (for TOTP), counter (for HOTP),
   * account name, and issuer name.
   *
   * @param int|null $counter The 64 bit initial counter value for HOTP tokens.
   * @param string|null $account The account name associated with the OTP token.
   * @param string|null $issuer The issuer name associated with the OTP token.
   * @return string The URI for provisioning the OTP token.
   * @throws Exception If there are any validation errors or invalid parameter values.
   */
  public generate_provisioning_uri({ counter, account, issuer }: { counter?: number, account?: string, issuer?: string }): string {
    let url = 'otpauth://';
    url += encodeURIComponent(this.type) + '/';

    // Label Prefix
    const hasIssuer = issuer && issuer.trim().length !== 0;
    if (hasIssuer) {
      if (issuer.includes(':')) {
        throw new Error("Invalid issuer contains a colon.");
      }
      url += encodeURIComponent(issuer);
    }

    // Label Suffix
    const hasAccount = account && account.trim().length !== 0;
    if (hasAccount) {
      if (account?.includes(':')) {
        throw new Error("Invalid account contains a colon.");
      }
      if (hasIssuer) {
        url += ":";
      }
      url += encodeURIComponent(account);
    }

    url += "?secret=" + encodeURIComponent(this.secret);

    if (hasIssuer) {
      url += "&issuer=" + encodeURIComponent(issuer);
    }

    // Optional Parameters are excluded if they match default values

    if (this.algorithm !== "sha1") {
      url += "&algorithm=" + encodeURIComponent(this.algorithm);
    }

    if (this.digits !== 6) {
      url += "&digits=" + encodeURIComponent(this.digits);
    }
    switch (this.type) {
      case 'totp':
        if (this.period !== 30) {
          url += "&period=" + encodeURIComponent(this.period);
        }
        if (counter) {
          throw new Error('Initial counter is only for provisioning HOTP.');
        }
        break;
      case 'hotp':
        if (!counter) {
          throw new Error('Initial counter is required for HOTP.');
        }

        url += "&counter=" + encodeURIComponent(counter);
        break;
      default:
        throw new Error("Invalid type: $this->type.");
    }
    return url;
  }
  /**
   * Decode a Base32 encoded string.
   *
   * This method decodes a Base32 encoded string into its original binary data.
   * It is used internally for decoding secrets provided in Base32 format.
   *
   * @param string $encoded The Base32 encoded string to decode.
   * @return string The decoded binary data.
   * @throws Exception If the input contains invalid Base32 characters.
   */
  private static base32_decode(encoded: string): Uint8Array {
    const decoded: number[] = [];
    const length = encoded.length;
    let buffer = 0;
    let bufferSize = 0;
    for (let i = 0; i < length; i++) {
      const char = encoded[i];
      let value = TwoFactorAuth.BASE_32_SYMBOLS.indexOf(char);
      if (value === -1) {
        throw new Error('Invalid base32 value.');
      }
      buffer = (buffer << 5) | value;
      bufferSize += 5;
      if (bufferSize >= 8) {
        decoded.push((buffer >> (bufferSize - 8)) & 0xFF);
        bufferSize -= 8;
      }
    }
    return Uint8Array.from(decoded);
  }
  /**
   * Check if a string is a valid Base32 encoded string.
   *
   * This method verifies whether a given string is a valid Base32 encoded string.
   * It checks if all characters in the input string belong to the Base32 character set.
   *
   * @param string $encoded The string to validate as Base32 encoded.
   * @return bool True if the string is a valid Base32 encoded string, false otherwise.
   */
  public static valid_base32(encoded: string): boolean {
    const length = encoded.length;
    for (let i = 0; i < length; i++) {
      const char = encoded[i];
      const value = TwoFactorAuth.BASE_32_SYMBOLS.indexOf(char);
      if (value === -1) {
        return false;
      }
    }
    return true;
  }
}
