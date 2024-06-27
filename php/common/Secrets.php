<?php
require_once "ErrorHandling.php";
require_once "Show.php";
require_once "DatabaseHelper.php";

// NOTE: This documentation hasn't been updated and is out of sync.

// Secrets::reveal(name) - unencrypted secret if exists; otherwise false
// Secrets::rotate() - changes to most recent encryption key and a new initialization vector
// Secrets::import() - imports new values from .secrets.json
// Secrets::encryptValue(value) - encrypts the value and returns as base64 encoded
// Secrets::keep(name, value) - stores encrypted secret
// Secrets::generateKey() - creates a new key in the same folder as the current key, prefixed with a unix timestamp
// Env Dependencies
// SECRETS_KEY_PATH: folder of key
// SECRETS_DATABASE = encrypted json of database credentials base64 encoded {hostname, database, username, password}
// ENVIRONMENT = Errors are obscure if PRODUCTION

// Stores decrypted values in memcache if available to perist between requests.
// Stores decrypted values in class vars for same in-process requests

final class Secrets
{
    private static $BIT_LENGTH = 256;
    private static $method = "aes-256-cbc";
    private static $keyFile = "aes-256-key.bin";
    private static $dataFile = 'data.json';
    private static $secretCache = null;
    private static $keyCache = null;
    private static $decryptedCache = [];
    private static $timestamp;
    private static $use_cache = true;
    private static $cache = null;
    private static $is_cache_available = null;
    private static $db = null;
    private static $pepperCache = null;
    private static $errors = [];
    private static $key_override = null;

    public static function get_last_error()
    {
        if (empty(self::$errors)) {
            return null;
        }
        return end(self::$errors);
    }
    public static function get_errors()
    {
        return self::$errors;
    }
    private static function add_error(string $message)
    {
        self::$errors[] = $message;
    }
    public static function method()
    {
        return self::$method;
    }
    public static function bit_length()
    {
        return self::$BIT_LENGTH;
    }
    private function __construct()
    {
    }
    public static function key_path_key()
    {
        return "SECRETS_KEY_PATH";
    }
    public static function key_dir()
    {
        $root = $_SERVER['DOCUMENT_ROOT'];
        $path = getenv(self::key_path_key());
        $i = strrpos($path, DIRECTORY_SEPARATOR);
        if ($i !== false) {
            $dir = substr($path, 0, $i);
        } else {
            $dir = '';
        }
        return realpath($root . DIRECTORY_SEPARATOR . $dir);
    }
    public static function database_key()
    {
        return "SECRETS_DATABASE";
    }
    public static function pepper_key()
    {
        return "SECRETS_CACHE_PEPPER";
    }
    public static function cache_host_key()
    {
        return "SECRETS_CACHE_HOST";
    }
    public static function cache_port_key()
    {
        return "SECRETS_CACHE_PORT";
    }
    public static function otp_key()
    {
        return "SECRET_2FA";
    }
    public static function pepper()
    {
        if (self::$pepperCache) {
            return self::$pepperCache;
        }

        $name = self::pepper_key();
        $encoded = getenv($name);
        if (empty($encoded)) {
            self::$pepperCache = false;
            self::add_error("Environment variable for pepper $name is empty");
            return false;
        }

        $decoded = base64_decode($encoded);
        if ($decoded === false) {
            self::$pepperCache = false;
            self::add_error("Pepper is not base64 formatted");
            return false;
        }
        if (strlen($decoded) !== 32) {
            self::add_error("Pepper is not 256 bits");
            return false;
        }
        return $decoded;
    }
    public static function pepper_changed()
    {
        self::reset_cache();
    }
    public static function pepper_exists()
    {
        return !empty(self::pepper());
    }
    private static function is_production()
    {
        return getenv("ENVIRONMENT") === "PRODUCTION";
    }
    public static function scope()
    {
        return $_SERVER['SERVER_NAME'];
    }
    public static function cache_enabled()
    {
        return self::$use_cache;
    }
    private static function cache_available()
    {
        if (self::$is_cache_available !== null) {
            return self::$is_cache_available;
        }
        if (!self::cache_enabled()) {
            self::add_error("Cache disabled");
            self::$is_cache_available = false;
            return false;
        }

        if (!extension_loaded('memcache')) {
            self::add_error("Memcache extension not loaded");
            self::$is_cache_available = false;
            return false;
        }

        if (self::pepper() === false) {
            self::add_error("Pepper unavailable for cache");
            self::$is_cache_available = false;
            return false;
        }

        $host = getenv(self::cache_host_key());
        if (empty($host)) {
            self::add_error("Cache host not configured");
            self::$is_cache_available = false;
            return false;
        }
        $port = getenv(self::cache_port_key());
        if (empty($port)) {
            self::add_error("Cache port not configured");
            self::$is_cache_available = false;
            return false;
        }
        if (!settype($port, 'integer')) {
            self::add_error("Cache port not an integer");
            self::$is_cache_available = false;
            return false;
        }

        if ($port < 0) {
            self::add_error("Cache port is negative");
            self::$is_cache_available = false;
            return false;
        }

        self::$cache = new Memcache;
        // $result = self::$cache->addServer($host, $port);
        $result = self::$cache->connect($host, $port);

        if ($result === false) {
            self::add_error("Failed to add cache server");
            self::$is_cache_available = false;
            throw new Exception("Memcache failed");
        }
        self::$is_cache_available = true;
        return true;
    }
    public static function valid_name(string $name)
    {
        if (empty($name)) {
            self::add_error("$name is not a valid name");
            return false;
        }
        if (strlen($name) > 64) {
            self::add_error("$name is greater than 64 characters");
            return false;
        }
        // AA, A9, A_A, A-A, A.A = good
        // A, 9A, A_, A-, A. = bad
        $pattern = '/^[a-zA-Z][a-zA-Z0-9_.-]*[a-zA-Z0-9]$/';
        if (!preg_match($pattern, $name)) {
            self::add_error("$name contains characters other than alanumeric and _.-, does not begin with a letter, or ends with a symbol");
            return false;
        }
        return true;
    }
    public static function hashed_name(string $name, ?string $pepper = null)
    {
        if (!self::valid_name($name)) {
            return false;
        }

        if (empty($pepper)) {
            $pepper = self::pepper();
            if ($pepper === false) {
                return false;
            }
        }
        // apcu - all php websites on same host server can see keys/values
        // memcache - all websites have same access, but can't see keys/values
        return hash('sha256', self::scope() . $pepper . $name);
    }
    private static function get_cache(string $name)
    {
        if (!self::cache_available()) {
            return false;
        }
        $hashed_name = self::hashed_name($name);
        if ($hashed_name === false) {
            return false;
        }
        $encrypted = self::$cache->get($hashed_name);
        if ($encrypted === false) {
            return false;
        }
        return self::decryptValue($encrypted);
    }
    private static function set_cache(string $name, #[SensitiveParameter] ?string $value)
    {
        if (!self::cache_available()) {
            return false;
        }
        $hashed_name = self::hashed_name($name);
        if ($hashed_name === false) {
            return false;
        }
        if ($value === null) {
            $success = self::$cache->set($hashed_name, null);
            return $success;
        }
        $encrypted = self::encryptValue($value);
        if (!$encrypted) {
            return false;
        }
        $success = self::$cache->set($hashed_name, $encrypted);
        return $success;
    }
    public static function change_db(array $credentials)
    {
        self::$db = self::$db = new DatabaseHelper($credentials);
        self::$decryptedCache[self::database_key()] = $credentials;
        self::reset_cache();
    }
    private static function db()
    {
        $name = self::database_key();
        if (self::$db !== null) {
            return self::$db;
        }
        $credentials = null;
        if (array_key_exists($name, self::$decryptedCache)) {
            $credentials = self::$decryptedCache[$name];
        } else {
            $value = getenv($name);
            if (empty($value)) {
                self::add_error("Empty environment variable for database credentials $name");
                return false;
            }
            $key = self::loadKey();
            if ($key === false) {
                self::add_error("Unable to load default encryption key");
                return false;
            }
            try {
                $decrypted = self::decrypt($value, $key);
                if ($decrypted === false) {
                    self::add_error("Decrypting db credentials failed");
                    return false;
                }
            } catch (Exception $e) {
                $error = $e->getMessage();
                self::add_error("Unhandled error decrypting db credentials. $error");
                return false;
            }
            $credentials = json_decode($decrypted, true);
            if ($credentials === false || $credentials === null) {
                self::add_error("Unable to decode database credentials as JSON");
                return false;
            }
            self::$decryptedCache[$name] = $credentials;
        }
        try {
            self::$db = new DatabaseHelper($credentials);
        } catch (Exception $e) {
            $error = $e->getMessage();
            self::add_error("Unhandled error instantiating database helper. $error");
            return false;
        }
        return self::$db;
    }
    public static function db_verified()
    {
        return self::db() !== false;
    }
    private static function get_db(string $scope, string $name)
    {
        if (!self::valid_name($name)) {
            return false;
        }
        $db = self::db();
        if ($db === false) {
            return false;
        }

        $rows = $db->selectRows(
            "CALL sp_secret_get(?, ?)",
            "ss",
            $scope,
            $name
        );
        if ($rows === false || count($rows) === 0) {
            $e = $db->get_last_exception();
            if (!empty($e)) {
                self::add_error($e->getMessage());
            }
            self::add_error("Nothing ruturned");
            return false;
        }
        $row = $rows[0];
        if (in_array('proc_message', $row)) {
            self::add_error("Procedure message: " . $row['proc_message']);
            return false;
        }
        $encryption_key = $row['encryption_key'];
        $encrypted = $row['value'];
        if (empty($encrypted)) {
            self::add_error("Encrypted value is empty");
            return false;
        }
        $key = self::loadKeyFromPath($encryption_key);
        if ($key === false) {
            self::add_error("Unable to load key to decrypt $name");
            return false;
        }
        try {
            $decrypted = self::decrypt($encrypted, $key);
            if ($decrypted === false) {
                self::add_error("Unable to decrypt $name");
            }
            return $decrypted;
        } catch (Exception $e) {
            self::add_error("Unable to decrypt $name. Exception: " . $e->getMessage());
            return false;
        }
    }
    public static function has_key(string $name)
    {
        if (!self::valid_name($name)) {
            return false;
        }
        if (array_key_exists($name, self::$decryptedCache)) {
            return true;
        }
        if (self::get_cache($name) !== false) {
            return true;
        }
        $db = self::db();
        if ($db === false) {
            return false;
        }
        $result = $db->selectScalar(
            "CALL sp_secret_has(?, ?)",
            "ss",
            self::scope(),
            $name
        );
        return $result === 1;
    }
    public static function trace(string $name)
    {
        if (!self::valid_name($name)) {
            return "Name is not valid. Limited to alphanumeric and _.-";
        }
        if (!self::has_key($name)) {
            return "Not found";
        }
        $location = "Not found";
        $value;
        if (array_key_exists($name, self::$decryptedCache)) {
            $value = self::$decryptedCache[$value];
            $location = "In-process cache";
        } else if (($value = self::get_cache($name)) !== false) {
            $location = "Cache server";
        } else {

            $location = "Database";
            $db = self::db();
            if ($db === false) {
                return false;
            }
            $rows = $db->selectRows(
                "CALL sp_secret_get(?, ?)",
                "ss",
                self::scope(),
                $name
            );
            if ($rows === false) {
                return "Query exception";
            }
            if (count($rows) === 0) {
                return "Database returned no matches";
            }

            $encryption_key = $rows[0]['encryption_key'];
            $value = $rows[0]['value'];

            if (empty($value)) {
                return "Value is empty";
            }

            $root = $_SERVER['DOCUMENT_ROOT'];
            $path = $root . DIRECTORY_SEPARATOR . $encryption_key;
            if (!file_exists($path)) {
                return "Encryption key file not found";
            }
            if (is_dir($path)) {
                return "Encryption key file is actually a directory";
            }
            $key = file_get_contents($path);
            if ($key === false) {
                return "Unable to read key file";
            }
            if (strlen($key) * 8 !== self::$BIT_LENGTH) {
                return "Key file has wrong bit length";
            }
            $iv_length = self::iv_length();
            $encryptedWithIv = base64_decode($value);
            if ($encryptedWithIv === false) {
                return "Value is not properly base64 encoded";
            }
            $iv = substr($encryptedWithIv, 0, $iv_length);
            if (strlen($iv) !== $iv_length) {
                return "Incorrect IV length.";
            }
            $encrypted = substr($encryptedWithIv, $iv_length);
            $encryptedByteCount = strlen($encrypted);

            if ($encryptedByteCount === 0) {
                return "Encrypted value missing.";
            }
            if ($encryptedByteCount < $iv_length) {
                return "Encrypted value corrupted. Too short.";
            }
            if ($encryptedByteCount % $iv_length !== 0) {
                return "Encrypted value corrupted. Incorrect block size.";
            }
            $decrypted = openssl_decrypt($encrypted, self::$method, $key, OPENSSL_RAW_DATA, $iv);
            if ($decrypted === false) {
                return "Decryption error: " . openssl_error_string();
            }
        }
        return "Retrieved from $location";
    }
    public static function rotate()
    {
        $names = self::names();
        if ($names === false) {
            return false;
        }

        $total = count($names);
        $success = 0;
        $scope = self::scope();

        foreach ($names as $name) {
            $value = self::get_db($scope, $name);
            if ($value !== false) {
                $result = self::set_db($scope, $name, $value);
                if ($result !== false) {
                    $success++;
                }
            }
        }

        return ['total' => $total, 'success' => $success];
    }
    public static function names()
    {
        $db = self::db();
        if ($db === false) {
            return false;
        }

        $rows = $db->selectRows(
            "CALL sp_secret_list(?)",
            "s",
            self::scope()
        );

        if ($rows === false || count($rows) === 0) {
            return false;
        }

        $names = [];

        foreach ($rows as $row) {
            $names[] = $row['name'];
        }
        return $names;
    }
    private static function reset_cache()
    {
        if (self::cache_available()) {
            $names = self::names();
            if ($names === false) {
                return false;
            }

            foreach ($names as $name) {
                self::set_cache($name, null);
            }
        }

    }
    private static function set_db($scope, $name, #[SensitiveParameter] $value)
    {
        if (!self::valid_name($name)) {
            return false;
        }

        $db = self::db();
        if ($db === false) {
            return false;
        }

        if (self::$key_override !== null) {
            $encryption_key = self::$key_override;
        } else {
            $encryption_key = getenv(self::key_path_key());
        }

        $key = self::loadKey();
        $encrypted = self::encrypt($value, $key);
        if ($encrypted === false) {
            self::haltExecution("Failed to encrypt");
            return false;
        }
        $result = $db->selectScalar(
            "CALL sp_secret_set(?, ?, ?, ?)",
            "ssss",
            $scope,
            $name,
            $encryption_key,
            $encrypted
        );
        if ($result === false) {
            $db->rollback();
            throw $db->get_last_exception("Failed executing.");
        }
        if ($result !== 'Success') {
            throw new Exception("Failed to update value. $result");
        }

        return $result;
    }
    public static function revealAs(string $name, string $type, ?string $scope = null)
    {
        switch ($type) {
            case 'array':
                return self::revealArray($name, $scope);
            case 'int':
                return self::revealInt($name, $scope);
            default:
                return false;
        }
    }
    public static function revealInt(string $name, ?string $scope = null)
    {
        $value = self::reveal($name, $scope);
        if ($value === false) {
            return false;
        }
        try {
            return intval($value);
        } catch (Exception $e) {
            return false;
        }
    }
    public static function revealArray(string $name, ?string $scope = null)
    {
        $value = self::reveal($name, $scope);
        if ($value === false) {
            return false;
        }
        try {
            $array = json_decode($value, true);
            if ($array === null || $array === false) {
                return false;
            }
            return $array;
        } catch (Exception) {
            return false;
        }
    }
    public static function reveal(string $name, ?string $scope = null)
    {
        if (!self::valid_name($name)) {
            return false;
        }
        if ($scope === null) {
            $scope = self::scope();
        }
        if ($scope === self::scope()) {
            if (array_key_exists($name, self::$decryptedCache)) {
                return self::$decryptedCache[$name];
            }
            $value = self::get_cache($name);
            if ($value !== false) {
                self::$decryptedCache[$name] = $value;
                return $value;
            }
        }
        $value = self::get_db($scope, $name);
        if ($value === false) {
            return false;
        }
        if ($scope === self::scope()) {
            self::$decryptedCache[$name] = $value;
            self::set_cache($name, $value);
        }
        return $value;
    }

    public static function decryptValue(string $encrypted)
    {
        if (empty($encrypted)) {
            return false;
        }

        $key = self::loadKey();
        if ($key === false) {
            return false;
        }
        return self::decrypt($encrypted, $key);
    }

    public static function change_key($path)
    {
        $key = self::loadKeyFromPath($path);
        if ($key === false) {
            return false;
        }
        self::checkKey($key);
        self::$keyCache = $key;
        self::$key_override = $path;
        self::reset_cache();
    }
    private static function loadKey()
    {
        if (self::$keyCache === null) {
            $key = self::loadKeyFromPath(self::fullPathToKey());
            if ($key === false) {
                return false;
            }
            self::checkKey($key);

            self::$keyCache = $key;
        }
        return self::$keyCache;
    }
    public static function key_exists()
    {
        return file_exists(self::fullPathToKey());
    }
    public static function loadKeyFromPath($path = null)
    {
        if ($path === null) {
            $path = self::fullPathToKey();
        } else if (substr($path, 0, 1) !== '/') {
            $root = $_SERVER['DOCUMENT_ROOT'];
            $path = realpath($root . DIRECTORY_SEPARATOR . $path);
        }
        $key = self::loadIfExists($path);
        if ($key === false) {
            return false;
        }
        return $key;
    }
    private static function fullPathToKey()
    {
        $dir = self::key_dir();
        $path = getenv(self::key_path_key());

        $pos = strrpos($path, DIRECTORY_SEPARATOR);
        if ($pos === false) {
            $file = $path;
        } else {
            $file = substr($path, $pos + 1);
        }
        return $dir . DIRECTORY_SEPARATOR . $file;
    }
    private static function loadIfExists($path)
    {
        if (file_exists($path)) {
            if (is_dir($path)) {
                throw new Exception("Expected a file: $path");
            }
            $contents = file_get_contents($path);
            if ($contents === false) {
                self::haltExecution("Error reading '$path'.");
            }
            return $contents;
        }
        return false;
    }

    private static function haltExecution($message, $additionalMessage = '')
    {
        if (self::is_production()) {
            Show::error("An error occurred");
        } else {
            $fullMessage = $message;
            if (!empty($additionalMessage)) {
                $fullMessage .= ": $additionalMessage";
            }
            $lastError = error_get_last();
            if ($lastError !== null) {
                $fullMessage .= ": " . $lastError['message'];
            }
            Show::error($fullMessage);
        }
        exit();
    }
    private static function checkKey(#[SensitiveParameter] $key)
    {
        $actual_bits = strlen($key) * 8;

        if ($actual_bits === self::$BIT_LENGTH) {
            return;
        }

        $actual_bits = strlen($key) * 8;
        if ($actual_bits !== self::$BIT_LENGTH) {
            self::haltExecution("$actual_bits bit key expected to be " . self::$BIT_LENGTH . " bit.");
        }
    }
    private static function save($path, #[SensitiveParameter] $data)
    {
        self::ensureDirExists($path);
        $result = file_put_contents($path, $data);
        if ($result === false) {
            self::haltExecution("Unable to write to $path.");
        }
    }
    public static function rotateValue(#[SensitiveParameter] string $encrypted, #[SensitiveParameter] string $old_path, #[SensitiveParameter] string $new_path)
    {
        $old_key = self::loadKeyFromPath($old_path);
        if ($old_key === false) {
            return false;
        }

        $new_key = self::loadKeyFromPath($new_path);
        if ($new_key === false) {
            return false;
        }

        $decrypted = self::decrypt($encrypted, $old_key);
        if ($decrypted === false) {
            return false;
        }

        return self::encrypt($decrypted, $new_key);
    }
    private static function ensureDirExists($path)
    {
        $dir = pathinfo($path, PATHINFO_DIRNAME);
        if (!is_dir($dir)) {
            // all for owner, read/execute for others
            $permissions = 0755;
            $result = mkdir($path, $permissions, true);
            if ($result === false) {
                self::haltExecution("Unable to make directory for $path.");
            }
        }
    }
    public static function iv_length()
    {
        return openssl_cipher_iv_length(self::$method);
    }
    public static function decrypt(#[SensitiveParameter] string $encrypted, #[SensitiveParameter] string $key)
    {
        if (empty($encrypted)) {
            throw new Exception("Empty parameter: encrypted");
            return false;
        }
        self::checkKey($key);

        $iv_length = self::iv_length();
        $encryptedWithIv = base64_decode($encrypted);
        if ($encryptedWithIv === false) {
            throw new Exception("Malformed base64 encoding.");
        }
        $iv = substr($encryptedWithIv, 0, $iv_length);
        if (strlen($iv) !== $iv_length) {
            throw new Exception("Incorrect IV length prevents decryption.");
        }
        $encrypted = substr($encryptedWithIv, $iv_length);
        $encryptedByteCount = strlen($encrypted);

        if ($encryptedByteCount === 0) {
            throw new Exception("Encrypted value missing.");
        }
        if ($encryptedByteCount < $iv_length) {
            throw new Exception("Encrypted value corrupted. Too short.");
        }
        if ($encryptedByteCount % $iv_length !== 0) {
            throw new Exception("Encrypted value corrupted. Incorrect block size.");
        }
        $decrypted = openssl_decrypt($encrypted, self::$method, $key, OPENSSL_RAW_DATA, $iv);
        if ($decrypted === false) {
            throw new Exception("Unable to decrypt: " . openssl_error_string());
        }
        return $decrypted;
    }
    public static function encryptValue(#[SensitiveParameter] string $value)
    {
        $key = self::loadKey();
        return self::encrypt($value, $key);
    }
    public static function encrypt(#[SensitiveParameter] string $value, #[SensitiveParameter] $key)
    {
        self::checkKey($key);

        $iv_length = openssl_cipher_iv_length(self::$method);
        $iv = openssl_random_pseudo_bytes($iv_length);
        $encrypted = openssl_encrypt($value, self::$method, $key, OPENSSL_RAW_DATA, $iv);
        if ($encrypted === false) {
            self::haltExecution("Unable to encrypt.", openssl_error_string());
        }
        return base64_encode($iv . $encrypted);
    }
    public static function generatePepper()
    {
        return base64_encode(openssl_random_pseudo_bytes(32));
    }
    public static function generateKey()
    {
        $fullPath = self::fullPathToKey();
        $directory = pathinfo($fullPath, PATHINFO_DIRNAME);
        $fileName = pathinfo($fullPath, PATHINFO_BASENAME);
        $pattern = '/^\d{10}_/';
        if (preg_match($pattern, $fileName)) {
            $fileName = preg_replace($pattern, '', $fileName);
        }
        $fileName = time() . '_' . $fileName;
        $fullPath = $directory . DIRECTORY_SEPARATOR . $fileName;

        $key = openssl_random_pseudo_bytes(self::$BIT_LENGTH / 8);
        if ($key === false) {
            self::haltExecution("Failed to generate secure random key.", openssl_error_string());
        }
        self::save($fullPath, $key);
        $fullPath = realpath($fullPath);
        return self::getRelativePath($fullPath);
    }
    private static function getRelativePath($path)
    {
        $root = $_SERVER['DOCUMENT_ROOT'];

        $rootParts = explode(DIRECTORY_SEPARATOR, $root);
        $pathParts = explode(DIRECTORY_SEPARATOR, $path);

        $rootPartCount = count($rootParts);
        $same = 0;
        $maxIterations = min($rootPartCount, count($pathParts));
        for ($i = 0; $i < $maxIterations; $i++) {
            if ($rootParts[$i] === $pathParts[$i]) {
                $same++;
            } else {
                break;
            }
        }

        $remainingRootFolders = $rootPartCount - $same;

        $relativePath = '';
        for ($i = 0; $i < $remainingRootFolders; $i++) {
            $relativePath .= '..' . DIRECTORY_SEPARATOR;
        }

        $relativePath .= implode(DIRECTORY_SEPARATOR, array_slice($pathParts, $same));

        return $relativePath;
    }
    public static function keepInt(string $name, #[SensitiveParameter] ?int $value = null, ?string $scope = null)
    {
        return self::keep($name, $value, $scope);
    }
    public static function keepArray(string $name, #[SensitiveParameter] ?array $value = [], ?string $scope = null)
    {
        if (empty($value)) {
            return self::keep($name, '', $scope);
        } else {
            return self::keep($name, json_encode($value, JSON_PRETTY_PRINT), $scope);
        }
    }
    public static function keep(string $name, #[SensitiveParameter] ?string $value = '', ?string $scope = null)
    {
        if (!self::valid_name($name)) {
            return false;
        }
        if ($value === null) {
            $value = '';
        }
        if ($scope === null) {
            $scope = self::scope();
        }
        $result = self::set_db($scope, $name, $value);
        if ($result === false) {
            self::haltExecution("Failed to store in database");
            return false;
        }

        if ($scope !== self::scope()) {
            return true;
        }

        if ($value === '') {
            unset(self::$decryptedCache[$name]);
            self::set_cache($name, null);
        } else {
            self::$decryptedCache[$name] = $value;
            self::set_cache($name, $value);
        }
        return true;
    }
}
