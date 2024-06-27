<?php
namespace error_log\rate_limiting;

require_once 'Secrets.php';
require_once 'Show.php';
require_once 'HTTP_STATUS.php';

$key = "RATE_LIMITING";
$lock_message = "We've noticed several incorrect login attempts for your account. To protect your information, it's temporarily locked. Please try again later.";

function guard_locked_accounts()
{
    global $key;
    global $lock_message;

    $rate_limiting = \Secrets::revealArray($key);
    if ($rate_limiting === false) {
        return;
    }

    if ($rate_limiting['unlock_at'] > time()) {
        \Show::error($lock_message, \HTTP_STATUS_LOCKED);
        exit;
    }
}
function successful_attempt()
{
    global $key;
    $rate_limiting = \Secrets::revealArray($key);
    if ($rate_limiting === false) {
        $rate_limiting = [
            'unlock_at' => 0,
            'failed_attempts' => 0,
        ];
    }
    $rate_limiting['failed_attempts'] = 0;
    \Secrets::keepArray($key, $rate_limiting);
}
function failed_attempt(
    string $message,
    int $max_chances,
    int $lockout_seconds
) {
    global $key;
    global $lock_message;
    $rate_limiting = \Secrets::revealArray($key);
    if ($rate_limiting === false) {
        $rate_limiting = [
            'unlock_at' => 0,
            'failed_attempts' => 0,
        ];
    }
    $failed_attempts = $rate_limiting['failed_attempts'];
    $failed_attempts++;
    if ($failed_attempts >= $max_chances) {
        $rate_limiting['unlock_at'] = time() + $lockout_seconds;
        $rate_limiting['failed_attempts'] = 0;
        \Show::error($lock_message, HTTP_STATUS_LOCKED);
    } else {
        $rate_limiting['failed_attempts'] = $failed_attempts;
        \Show::error($message);
    }
    \Secrets::keepArray($key, $rate_limiting);
    exit;
}
