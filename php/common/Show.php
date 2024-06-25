<?php
require_once "ErrorHandling.php";
require_once 'HTTP_STATUS.php';

class Show
{
    public static function message($message, $code = HTTP_STATUS_OK)
    {
        self::data(['message' => $message], $code);
    }
    public static function error($error, $code = HTTP_STATUS_INTERNAL_SERVER_ERROR)
    {
        self::data(['error' => $error], $code);
    }
    public static function data($data, $code = HTTP_STATUS_OK, $maxAge = -1)
    {
        $json = json_encode($data, JSON_PRETTY_PRINT);

        http_response_code($code);
        header('Content-Type: application/json');
        if ($maxAge > 0) {
            header("Cache-Control: max-age=$maxAge");
        } else {
            header('Cache-Control: no-cache, no-store, must-revalidate');
        }
        header('Content-Length: ' . strlen($json));
        echo $json;
    }
}
