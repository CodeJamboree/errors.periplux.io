<?php
require_once "../common/session.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";
require_once "../common/Otp.php";
require_once "../common/get_token.php";
require_once "../common/rate_limiting.php";

function main()
{
    try {
        $posted = new PostedJson(2);
    } catch (Exception $e) {
        Show::error($e->getMessage(), $e->getCode());
        exit;
    }

    if (!$posted->keysExist('otp')) {
        Show::error($posted->lastError(), $posted->lastErrorCode());
        exit;
    }

    $otp = $posted->getValue('otp');

    $token = get_token();
    if ($token === false || $token === '') {
        Show::error('Authorization token required');
        exit;
    }

    $authentication = Secrets::revealArray("AUTHENTICATION");
    if ($authentication === false) {
        $data = [
            'authenticated' => false,
            'otp_required' => false,
            'token' => null,
        ];
        Show::data($data);
        exit;
    }

    $rate_limiting = Secrets::revealArray('RATE_LIMITING');
    if ($rate_limiting !== false) {
        if ($rate_limiting['unlock_at'] > time()) {
            Show::error('Account locked', HTTP_STATUS_LOCKED);
            exit;
        }
    } else {
        $rate_limiting = [
            'unlock_at' => 0,
            'failed_attempts' => 0,
        ];
    }
    $expected_token = $authentication['token'];
    if ($token !== $expected_token) {
        Show::error('Token expired');
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

    \error_log\rate_limiting\guard_locked_accounts();

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
        \error_log\rate_limiting\failed_attempt(
            "Invalid verification code. Please check your code and try again.",
            5,
            $otpManager->period()
        );
        exit;
    }

    $token = openssl_random_pseudo_bytes(16);
    $token_hash = bin2hex($token);

    $data = [
        'authenticated' => true,
        'otp_required' => false,
        'token' => $token_hash,
    ];

    Secrets::keepArray("AUTHENTICATION", $data);
    \error_log\rate_limiting\successful_attempt();
    Show::data($data);
    exit;
}
main();
