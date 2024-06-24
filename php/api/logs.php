<?php
require_once "../common/Show.php";
require_once "../common/DatabaseHelper.php";
require_once "../common/Secrets.php";

function main()
{
    $page = $_GET['page'] ?? 1;
    $size = $_GET['size'] ?? 5;
    $search = $_GET['search'] ?? '';

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
        'CALL sp_page_logs(?, ?, ?, @affected_rows)',
        'iis',
        $page,
        $size,
        $search
    );

    $total = $db->selectScalar('SELECT @affected_rows');

    Show::data([
        "data" => $rows,
        "total" => $total,
    ]);
    exit;
}

main();
