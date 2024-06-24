<?php
require_once "../common/Show.php";
require_once "../common/Secrets.php";
require_once "get_next_file.php";
require_once "parse_logs.php";

function main()
{

// Show::error("Unauthorized");
// exit;

    $dir = Secrets::reveal("ERROR_DIR");
    if ($dir === false) {
        Show::error("Unable to retrieve ERROR_DIR");
        exit;
    }

    if (!file_exists($dir)) {
        Show::error("ERROR_DIR does not exist on the file system.");
        exit;
    }

    $files = glob($dir . DIRECTORY_SEPARATOR . "*$ext");
    // find file that ends with .log
    if (empty($files)) {
        Show::message("ERROR_DIR has no *$ext files");
        exit;
    }

    $file_name = Secrets::reveal("ERROR_LOG");
    $path = realpath($dir . DIRECTORY_SEPARATOR . $file_name);
    if ($file_name === false || file_exists($file_name) === false) {
        $file_name = basename($files[0]);
        $offset = 0;
        $path = realpath($dir . DIRECTORY_SEPARATOR . $file_name);
    }

    $next_file = get_next_file($files, $file_name);

    $offset = isset($_GET["offset"]) ? (int) $_GET["offset"] : 0;
    $size = isset($_GET["size"]) ? (int) $_GET["size"] : 10;

    if (!file_exists($path)) {
        Show::error("Log file does not exist.");
        exit;
    }
    $file_size = filesize($path);
    if ($file_size === false) {
        Show::error("Unable to get file size of log file.");
        exit;
    }
    if ($offset > $file_size) {
        Show::error("Offset greater than fize size: $file_size bytes");
        exit;
    }

    $result = parse_logs($path, $offset, $size);

    Show::data($result);
}
try {
    main();
} catch (Exception $e) {
    Show::error("Unhandled Exception. Message: " . $e->getMessage());
}
