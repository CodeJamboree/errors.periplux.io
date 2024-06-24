<?php
require_once "../common/Show.php";
require_once "../common/DatabaseHelper.php";
require_once "../common/Secrets.php";
require_once "get_next_file.php";
require_once "parse_logs.php";

function main()
{
    $size = 100;
    $ext = '.log';
    $offset = Secrets::revealAs("ERROR_OFFSET", 'int');
    if ($offset === false) {
        $offset = 0;
    }

    $dir = Secrets::reveal("ERROR_DIR");
    if ($dir === false) {
        Show::error("Unable to retrieve ERROR_DIR");
        exit;
    }

    if (!file_exists($dir)) {
        Show::error("ERROR_DIR does not exist on the file system.");
        exit;
    }
    if (!is_dir($dir)) {
        Show::error("ERROR_DIR is not a directory.");
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

    $file_size = filesize($path);

    if ($file_size === false) {
        Show::error("Unable to get file size of '$file'.");
        exit;
    }
    if ($offset > $file_size) {
        Show::error("Offset greater than fize size: $file_size bytes");
        exit;
    }

    $parsed = parse_logs($path, $offset, $size);
    $logs = $parsed['logs'];
    $next_offset = $parsed['next_offset'];
    $has_more = $parsed['has_more'];

    if (count($logs) === 0) {
        Show::error("Unable to parse logs in $file_name");
        exit;
    }

    // Let's store them in the database
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

    $scope = substr($file_name, 0, -(strlen($ext)));
    foreach ($logs as $log) {
        $log_id = $db->selectScalar(
            'CALL sp_log(?, ?, ?, ?, ?, ?)',
            'sisssi',
            $scope,
            $log['timestamp'],
            $log['type'],
            $log['message'],
            $log['path'],
            $log['line']
        );

        if ($log_id === false) {
            Show::error("Failed to log to database.");
            exit;
        }
        if (array_key_exists('stack_trace', $log)) {
            $db->affectAny(
                "CALL sp_log_details(?, ?, ?)",
                'iss',
                $log_id,
                'Stack Trace',
                $log['stack_trace']
            );
        }
        if (array_key_exists('details', $log)) {
            $db->affectAny(
                "CALL sp_log_details(?, ?, ?)",
                'iss',
                $log_id,
                'Details',
                $log['details']
            );
        }
    }

    // Read file_size again - more logs may have arrived
    $file_size = filesize($path);
    $has_more = $file_size !== 0 && $next_offset !== 0 && $file_size > $next_offset;

    // Remember where we left off
    if ($has_more) {
        Secrets::keep("ERROR_LOG", $file_name);
        Secrets::keep("ERROR_OFFSET", $next_offset);
    } else {
        // purge error log
        if (unlink($path)) {
            $next_offset = 0;
            Secrets::keep("ERROR_OFFSET", 0);
            Secrets::keep("ERROR_LOG", $next_file);
        } else {
            $next_offset = $file_size;
            Secrets::keep("ERROR_OFFSET", $file_size);
            Secrets::keep("ERROR_LOG", $file_name);
        }
    }

    $count = count($logs);
    Show::data([
        "file" => $file_name,
        "transferred" => $count,
        "offset" => $next_offset,
    ]);
    exit;
}

try {
    main();
} catch (Exception $e) {
    Show::error("Unhandled Exception. Message: " . $e->getMessage());
}
