<?php
function get_token()
{
    if (!function_exists('apache_request_headers')) {
        // $_SERVER['Authorization'] may work...
        Show::error('Unauthorized', HTTP_STATUS_INTERNAL_SERVER_ERROR);
        exit;
    }
    $headers = apache_request_headers();
    if (!isset($headers['Authorization'])) {
        Show::error('Unauthorized', HTTP_STATUS_UNAUTHORIZED);
        exit;
    }
    $authorizationHeader = trim($headers['Authorization']);
    $parts = explode(' ', $authorizationHeader);
    if (!isset($parts[0]) || $parts[0] !== 'Bearer' || !isset($parts[1])) {
        Show::error('Unauthorized', HTTP_STATUS_BAD_REQUEST);
        exit;
    }
    return $parts[1];
}
