<?php
/*
 * Otp Class
 *
 * This class provides functionality for generating and validating one-time passwords (OTPs)
 * for two-factor authentication (2FA) using Time-based One-Time Passwords (TOTP) and
 * Counter-based One-Time Passwords (HOTP) algorithms.
 */
class Otp
{
    private static string $base32_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    private static array $valid_algorithms = ['sha1', 'sha256', 'sha512'];
    private static array $valid_digits = [6, 7, 8];
    private static array $valid_periods = [15, 30, 60];
    private static array $valid_types = ['totp', 'hotp'];
    private string $type;
    private string $algorithm;
    private int $digits;
    private int $period;
    private string $secret;

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
    public function __construct(
        #[SensitiveParameter] string $secret,
        string $type = 'totp',
        int $period = 30,
        int $digits = 6,
        string $algorithm = 'sha1'
    ) {
        self::checkSecret($secret);
        if (!in_array($digits, self::$valid_digits)) {
            throw new Exception("Invalid digits. Expected: " . implode(', ', self::$valid_digits));
        }
        if (!in_array($algorithm, self::$valid_algorithms)) {
            throw new Exception("Invalid algorithm. Expected: " . implode(', ', self::$valid_algorithms));
        }
        if (!in_array($type, self::$valid_types)) {
            throw new Exception("Invalid type. Expected: " . implode(', ', self::$valid_types));
        }
        if (!in_array($period, self::$valid_periods)) {
            throw new Exception("Invalid periods. Expected: " . implode(', ', self::$valid_periods));
        }

        $this->secret = $secret;
        $this->period = $period;
        $this->digits = $digits;
        $this->algorithm = $algorithm;
        $this->type = $type;
    }

    public static function checkSecret(#[SensitiveParameter] string $secret)
    {
        if (empty($secret)) {
            throw new Exception("Missing secret.");
        }
        $bits = strlen($secret) * 5;
        if ($bits < 80) {
            throw new Exception("Expected 80 bit secret or higher.");
        }
        if (!self::valid_base32($secret)) {
            throw new Exception("Invalid secret.");
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
    public static function generate_secret(int $bits = 128)
    {
        if ($bits < 80) {
            throw new Exception("Expected 80 bit secret or higher.");
        } else if ($bits % 8 !== 0) {
            throw new Exception("Bits must be a multiple of 8.");
        }
        $length = ceil($bits / 5);
        $secret = '';
        $chars = self::$base32_chars;
        $bytes = random_bytes($length);
        for ($i = 0; $i < $length; $i++) {
            $index = ord($bytes[$i]) % 32;
            $secret .= $chars[$index];
        }
        return $secret;
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
    public function get_relative_otp(int $offset, int $input = null)
    {
        if (!is_int($offset)) {
            throw new Exception("Expected offset to be integer.");
        }
        if ($this->type === 'totp') {
            if ($input === null) {
                $input = time();
            }
            $input += $offset * $this->period;
            return $this->time_based_otp($input);
        } else {
            if ($input === null) {
                throw new Exception("Expected input to be integer.");
            }
            return $this->counter_based_otp($input + $offset);
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
    public function otp(int $input = null)
    {
        if ($this->type === 'totp') {
            return $this->time_based_otp($input);
        } else {
            return $this->counter_based_otp($input);
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
    public function time_based_otp(int $time = null)
    {
        if (empty($time)) {
            $time = time();
        }
        $timestamp = floor($time / $this->period);
        return $this->generate_otp($timestamp);
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
    public function counter_based_otp(int $counter = null)
    {
        if ($counter === null) {
            throw new Exception("Counter not specified.");
        }
        return $this->generate_otp($counter);
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
    private function generate_otp(int $input)
    {
        $data = pack('J*', $input);
        $key = $this->base32_decode($this->secret);
        $hash = hash_hmac($this->algorithm, $data, $key, true);
        $offset = ord(substr($hash, -1)) & 0xF;
        $value = unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF;
        $otp = $value % pow(10, $this->digits);
        return str_pad($otp, $this->digits, '0', STR_PAD_LEFT);
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
    public function generate_provisioning_uri(int $counter = null, string $account = null, string $issuer = null)
    {
        $url = 'otpauth://';
        $url .= urlencode($this->type) . '/';

        // Label Prefix
        if (!empty($issuer)) {
            if (strpos($issuer, ':') !== false) {
                throw new Exception("Invalid issuer contains a colon.");
            }
            $url .= urlencode($issuer);
        }

        // Label Suffix
        if (!empty($account)) {
            if (strpos($account, ':') !== false) {
                throw new Exception("Invalid account contains a colon.");
            }
            if (!empty($issuer)) {
                $url .= ":";
            }
            $url .= urlencode($account);
        }

        $url .= "?secret=" . urlencode($this->secret);

        if (!empty($issuer)) {
            $url .= "&issuer=" . urlencode($issuer);
        }

        // Optional Parameters are excluded if they match default values

        if ($this->algorithm !== "sha1") {
            $url .= "&algorithm=" . urlencode($this->algorithm);
        }

        if ($this->digits !== 6) {
            $url .= "&digits=" . urlencode($this->digits);
        }
        switch ($this->type) {
            case 'totp':
                if ($this->period !== 30) {
                    $url .= "&period=" . urlencode($this->period);
                }
                if ($counter !== null) {
                    throw new Exception('Initial counter is only for provisioning HOTP.');
                }
                break;
            case 'hotp':
                if ($count === null) {
                    throw new Exception('Initial counter is required for HOTP.');
                }

                $url .= "&counter=" . urlencode($counter);
                break;
            default:
                throw new Exception("Invalid type: $this->type.");
        }
        return $url;
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
    private static function base32_decode(string $encoded)
    {
        $decoded = '';
        $length = strlen($encoded);
        $buffer = 0;
        $bufferSize = 0;
        $chars = self::$base32_chars;
        for ($i = 0; $i < $length; $i++) {
            $char = $encoded[$i];
            $value = strpos($chars, $char);
            if ($value === false) {
                throw new Exception('Invalid base32 value.');
            }
            $buffer = ($buffer << 5) | $value;
            $bufferSize += 5;
            if ($bufferSize >= 8) {
                $decoded .= chr(($buffer >> ($bufferSize - 8)) & 0xFF);
                $bufferSize -= 8;
            }
        }
        return $decoded;
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
    public static function valid_base32(string $encoded)
    {
        $length = strlen($encoded);
        $chars = self::$base32_chars;
        for ($i = 0; $i < $length; $i++) {
            $char = $encoded[$i];
            $value = strpos($chars, $char);
            if ($value === false) {
                return false;
            }
        }
        return true;
    }
}
