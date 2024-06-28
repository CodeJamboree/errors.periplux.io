<?php
require_once "../common/access_control.php";
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "../common/PostedJson.php";

function main()
{
    try {
        $posted = new PostedJson(2);
    } catch (Exception $e) {
        Show::error($e->getMessage(), $e->getCode());
        exit;
    }

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

    $salt = openssl_random_pseudo_bytes(16);
    $salt_hex = bin2hex($salt);

    $hash = hash('sha256', $password . $salt_hex);
    $hash_hex = bin2hex($hash);

    $credentials = [
        'username' => $username,
        'password_salt' => $salt_hex,
        'password_hash' => $hash_hex,
    ];

    $json = json_encode($credentials, JSON_PRETTY_PRINT);

    $result = Secrets::keep("CREDENTIALS", $json);

    if ($result === true) {
        Show::message("Login credentials updated");
    } else {
        Show::error("Unable to save credentials");
    }
}
main();
