<?php
require_once "../common/access_control.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";
require_once "../common/Otp.php";

function main()
{
    try {
        $posted = new PostedJson(2);
    } catch (Exception $e) {
        Show::error($e->getMessage(), $e->getCode());
        exit;
    }

    if (!$posted->keysExist('secret', 'otp')) {
        Show::error($posted->lastError(), $posted->lastErrorCode());
        exit;
    }

    $secret = $posted->getValue('secret');
    $otp = $posted->getValue('otp');

    if ($secret === '') {
        Secrets::keep("OTP_SECRET", '');
        Show::message("Two-Factor Authentication disabled");
        exit;
    }

    if ($otp === '') {
        Show::error("Invalid otp");
        exit;
    }

    $otpManager = new Otp($secret);
    if (!(
        $otp === $otpManager->otp()
        || $otp === $otpManager->get_relative_otp(-1)
        || $otp === $otpManager->get_relative_otp(1)
    )) {
        Show::error("Failed. Incorrect OTP provided.");
        return;
    }

    $result = Secrets::keep("OTP_SECRET", $secret);
    if ($result === true) {
        Show::message("Two-Factor authentication applied");
    } else {
        Show::error("Unable to save two-factor authentication");
    }
}
main();
