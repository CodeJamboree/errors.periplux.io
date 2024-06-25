<?php
require_once "./common/HTTP_STATUS.php";

$DOMAIN_APP = getenv('DOMAIN_APP');
$SERVER_NAME = $_SERVER['SERVER_NAME'];

$HTTP_ORIGIN = "*";
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $HTTP_ORIGIN = $_SERVER['HTTP_ORIGIN'];
    if (empty($HTTP_ORIGIN)) {
        $HTTP_ORIGIN = "*";
    }
}

function isOrigin($origin)
{
    global $HTTP_ORIGIN;
    return $HTTP_ORIGIN === $origin || $HTTP_ORIGIN === $origin . '/';
}
function allow()
{
    global $HTTP_ORIGIN;
    // Set CORS headers
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header('Access-Control-Allow-Credentials: true');
    header("Access-Control-Allow-Origin: $HTTP_ORIGIN");
    http_response_code(HTTP_STATUS_OK);
}

function deny($code, $reason)
{
    http_response_code($code);
    echo $reason;
}

if ($_SERVER['REQUEST_METHOD'] !== "OPTIONS") {
    deny(HTTP_STATUS_METHOD_NOT_ALLOWED, "Method not allowed. Expected OPTIONS");
} elseif (isOrigin("https://$DOMAIN_APP")) {
    allow();
} elseif (isOrigin('http://localhost:4200')) {
    allow();
} elseif (empty($HTTP_ORIGIN)) {
    deny(HTTP_STATUS_BAD_REQUEST, "OPTIONS request is missing 'Origin' header");
} else {
    deny(HTTP_STATUS_FORBIDDEN, "Unrecognized origin $HTTP_ORIGIN");
}
