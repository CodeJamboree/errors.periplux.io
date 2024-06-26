<?php
require_once "../common/Show.php";
require_once "../common/Secrets.php";
function main()
{
    $secret = Secrets::reveal("OTP_SECRET");
    if ($secret === false || $secret === '') {
        Show::data(['enabled' => false]);
        exit;
    }
    Show::data(['enabled' => true]);
    exit;
}
main();
