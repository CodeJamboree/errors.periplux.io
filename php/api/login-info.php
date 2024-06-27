<?php
require_once "../common/access_control.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";

function main()
{
    $credentials = Secrets::revealArray("CREDENTIALS");
    if ($credentials === false) {
        Show::error('Unable to retrieve username.');
        exit;
    }

    $username = $credentials['username'];
    if (empty($username)) {
        Show::error('Unable to retrieve username.');
        exit;
    }
    $secret = Secrets::reveal("OTP_SECRET");
    $tfa_enabled = !($secret === false || $secret === '');

    Show::data([
        'username' => $username,
        'tfa_enabled' => $tfa_enabled,
    ]);
}
main();
