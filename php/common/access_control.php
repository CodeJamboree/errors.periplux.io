<?php
namespace error_log\access_control;

require_once 'Secrets.php';
require_once 'Show.php';
require_once 'HTTP_STATUS.php';
require_once 'PostedJson.php';
require_once 'get_token.php';

function main()
{
    $token = \get_token();

    $authentication = \Secrets::revealAs("AUTHENTICATION", 'array');

    if (
        $authentication['authenticated'] !== true ||
        $authentication["token"] !== $token ||
        $authentication['otp_required'] === true) {
        \Show::error('Unauthorized', HTTP_STATUS_UNAUTHORIZED);
        exit;
    }
}
main();
