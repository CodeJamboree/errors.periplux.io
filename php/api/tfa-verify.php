<?php
require_once "../common/session.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";
require_once "../common/Otp.php";

function main()
{
    $posted = new PostedJson(2);

    if (!$posted->keysExist('token', 'otp')) {
        Show::error($posted->lastError(), $posted->lastErrorCode());
        exit;
    }

    $otp = $posted->getValue('otp');
    $token = $posted->getValue('token');

    $authentication = Secrets::revealAs("AUTHENTICATION", 'array');

    if ($token !== $authentication['token']) {
        Show::error('Incorrect token');
        exit;
    }
    if ($authentication['otp_required'] !== true) {
        Show::error('No pending 2FA request');
        exit;
    }

    if ($otp === '') {
        Show::error("Invalid otp");
        exit;
    }

    $secret = Secrets::reveal("OTP_SECRET");
    if ($secret === false || $secret === '') {
        Show::data(['verified' => true]);
        exit;
    }

    $otpManager = new Otp($secret);
    if (!(
        $otp === $otpManager->otp()
        || $otp === $otpManager->get_relative_otp(-1)
        || $otp === $otpManager->get_relative_otp(1)
    )) {
        Show::error("Incorrect OTP provided.");
        return;
    }

    $token = openssl_random_pseudo_bytes(16);
    $token_hash = bin2hex($token);

    $data = [
        'authenticated' => true,
        'otp_required' => false,
        'token' => $token_hash,
    ];
    $json = json_encode($data, JSON_PRETTY_PRINT);

    Secrets::keep("AUTHENTICATION", $json);
    Show::data($data);
    exit;
}
main();
