<?php
require_once 'HTTP_STATUS.php';

class PostedJson
{
    private $json;
    private $maxDepth;
    private $errorMessage;
    private $errorCode;
    private static $contents;

    public function __construct($maxDepth = 10)
    {

        $this->maxDepth = $maxDepth;

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return $this->handleError(
                'Method not allowed.',
                HTTP_STATUS_METHOD_NOT_ALLOWED,
                true
            );
        }

        if (
            !isset($_SERVER['CONTENT_TYPE']) ||
            empty($_SERVER['CONTENT_TYPE'])
        ) {
            return $this->handleError(
                'Missing Content-Type.',
                HTTP_STATUS_BAD_REQUEST,
                true
            );
        }

        if ($_SERVER['CONTENT_TYPE'] !== 'application/json') {
            return $this->handleError(
                'Expected Content-Type application/json.',
                HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE,
                true
            );
        }
        if (empty(self::$contents)) {
            self::$contents = file_get_contents("php://input");
        }
        $this->json = json_decode(self::$contents, true, $maxDepth);
        if ($this->json === null) {
            if (json_last_error() !== JSON_ERROR_NONE) {
                return $this->handleError(
                    json_last_error_msg(),
                    HTTP_STATUS_BAD_REQUEST,
                    true
                );
            } else {
                return $this->handleError(
                    'Expected JSON.',
                    HTTP_STATUS_BAD_REQUEST,
                    true
                );
            }
        }

        if (!is_array($this->json)) {
            return $this->handleError(
                'Expected JSON as array.',
                HTTP_STATUS_BAD_REQUEST,
                true
            );
        }
    }
    public function lastError()
    {
        return $this->errorMessage;
    }
    public function lastErrorCode()
    {
        return $this->errorCode;
    }
    private function handleError($message, $statusCode, $throw = false)
    {
        $this->errorMessage = $message;
        $this->errorCode = $statusCode;
        if ($throw) {
            throw new Exception($message, $statusCode);
        }
        return false;
    }
    private function validateKeyPath($keyPath)
    {
        $keys = explode('.', $keyPath);
        if (count($keys) >= $this->maxDepth) {
            return $this->handleError(
                'Maximum depth exceeded. Maximum allowed depth is ' . $this->maxDepth,
                HTTP_STATUS_INTERNAL_SERVER_ERROR
            );
        } else if (count($keys) == 0) {
            return $this->handleError(
                'No keys in path',
                HTTP_STATUS_INTERNAL_SERVER_ERROR
            );
        }
        foreach ($keys as $key) {
            if ($key === '') {
                return $this->handleError(
                    'Empty key in path ' . $keyPath,
                    HTTP_STATUS_INTERNAL_SERVER_ERROR
                );
            }
        }
        return true;
    }
    public function keysExist(...$keyPaths)
    {
        foreach ($keyPaths as $keyPath) {
            if (!$this->keyExists($keyPath)) {
                return false;
            }

        }
        return true;
    }
    public function keyExists($keyPath)
    {
        if (!$this->validateKeyPath($keyPath)) {
            return false;
        }
        $keys = explode('.', $keyPath);
        $value = $this->json;
        foreach ($keys as $key) {
            if (!array_key_exists($key, $value)) {
                return $this->handleError(
                    "Expected '$keyPath'",
                    HTTP_STATUS_BAD_REQUEST
                );
            }
            $value = $value[$key];
        }
        return true;
    }
    public function getValue($keyPath)
    {
        if (!$this->validateKeyPath($keyPath)) {
            return null;
        }
        $keys = explode('.', $keyPath);
        $value = $this->json;
        foreach ($keys as $key) {
            if (!array_key_exists($key, $value)) {
                return null;
            }
            $value = $value[$key];
        }
        return $value;
    }
}
