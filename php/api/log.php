<?php
require_once "../common/access_control.php";
require_once "../common/Show.php";
require_once "../common/DatabaseHelper.php";
require_once "../common/Secrets.php";

function main()
{
    $id = $_GET['id'] ?? 1;

    $credentials = Secrets::revealAs("ERROR_DATABASE", 'array');
    if ($credentials === false) {
        Show::error("Unable to retrieve ERROR_DATABASE");
        exit;
    }
    try {
        $db = new DatabaseHelper($credentials);
    } catch (Exception $e) {
        Show::error("Failed to open database. $e");
        exit;
    }

    $rows = $db->selectRows(
        'CALL sp_select_log(?)',
        'i',
        $id
    );

    if ($rows !== false && count($rows) > 0) {
        Show::data(["data" => $rows[0]]);
    } else {
        Show::error("Not found", HTTP_STATUS_NOT_FOUND);
    }
    exit;
}

main();
