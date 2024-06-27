<?php
require_once "../common/session.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";
require_once "../common/rate_limiting.php";

function main()
{
    $posted = new PostedJson(2);

    if (!$posted->keysExist('username', 'password')) {
        Show::error($posted->lastError(), $posted->lastErrorCode());
        exit;
    }

    $username = $posted->getValue('username');
    $password = $posted->getValue('password');

    $username = trim($username);
    $password = trim($password);

    if ($username === '') {
        Show::error("Invalid username");
        exit;
    }
    if ($password === '') {
        Show::error("Invalid password");
        exit;
    }

    \error_log\rate_limiting\guard_locked_accounts();

    $credentials = Secrets::revealArray("CREDENTIALS");

    $password_salt = $credentials['password_salt'];
    $hash = hash('sha256', $password . $password_salt);
    $password_hash = bin2hex($hash);

    if ($credentials['username'] !== $username ||
        $credentials['password_hash'] !== $password_hash) {
        \error_log\rate_limiting\failed_attempt(
            "The username or password you entered is incorrect.",
            3,
            300
        );
        exit;
    }

    $token = openssl_random_pseudo_bytes(16);
    $token_hash = bin2hex($token);

    $secret = Secrets::reveal("OTP_SECRET");
    if ($secret === false || $secret === '') {
        $otp_required = false;
    } else {
        $otp_required = true;
    }

    $data = [
        'authenticated' => true,
        'otp_required' => $otp_required,
        'token' => $token_hash,
    ];
    Secrets::keepArray("AUTHENTICATION", $data);
    \error_log\rate_limiting\successful_attempt();
    Show::data($data);
    exit;
}
main();
