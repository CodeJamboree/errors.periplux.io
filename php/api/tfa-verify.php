<?php
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";
require_once "../common/Otp.php";

function main()
{
    $posted = new PostedJson(2);

    if (!$posted->keysExist('otp')) {
        Show::error($posted->lastError(), $posted->lastErrorCode());
        exit;
    }

    $otp = $posted->getValue('otp');

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

    Show::data(['verified' => true]);
    exit;
}
main();
