<?php
require_once "common/Show.php";
require_once "common/DatabaseHelper.php";
require_once "common/Secrets.php";

function main()
{
    $log_id = $_GET['log_id'] ?? 1;
    $page = $_GET['page'] ?? 1;
    $size = $_GET['size'] ?? 10;

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

    $affected_rows = -1;
    $rows = $db->selectRows(
        'CALL sp_page_log_details(?, ?, ?, ?)',
        'iiii',
        $log_id,
        $page,
        $size,
        $affected_rows
    );

    Show::data([
        "data" => $rows,
        "total" => $affected_rows,
    ]);
    exit;
}

try {
    main();
} catch (Exception $e) {
    Show::error("Unhandled Exception. Message: " . $e - getMessage());
}
