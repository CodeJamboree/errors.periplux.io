<?php
require_once "../common/session.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";

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

    $credentials = Secrets::revealAs("CREDENTIALS", 'array');

    if ($credentials['username'] !== $username) {
        Show::error('Invalid credentials');
        exit;
    }

    $password_salt = $credentials['password_salt'];
    $hash = hash('sha256', $password . $password_salt);
    $password_hash = bin2hex($hash);

    if ($credentials['password_hash'] !== $password_hash) {
        Show::error('Invalid credentials');
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
    $json = json_encode($data, JSON_PRETTY_PRINT);
    Secrets::keep("AUTHENTICATION", $json);
    Show::data($data);
    exit;
}
main();
