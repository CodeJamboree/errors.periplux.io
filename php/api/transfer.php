<?php
require_once "../common/Show.php";
require_once "../common/DatabaseHelper.php";
require_once "../common/Secrets.php";

function find_index_by_base_name(array $files, string $file_name)
{
    foreach ($files as $index => $full_path) {
        if (basename($full_path) === $file_name) {
            return $index;
        }
    }
    return -1;
}
function get_next_file(array $files, string $file_name)
{
    if (count($files) <= 1) {
        return null;
    }

    $i = find_index_by_base_name($files, $file_name);
    $i++;
    if ($i >= count($files)) {
        $i = 0;
    }

    $next_file = basename($files[$i]);
    if ($next_file === $file_name) {
        return null;
    }

    return $next_file;
}
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
    $file = fopen($path, "r");

    if ($offset > 0) {
        fseek($file, $offset);
    }
    $logs = [];
    $next_offset = ftell($file);
    $has_more = !feof($file);
    $in_stack = false;

    $max = $size * 10; // no more than 10 lines per log on average

    for ($i = 0; $i < $max && $has_more; $i++) {
        $line = fgets($file);
        if ($line === false) {
            $next_offset = 0;
            $has_more = false;
            break;
        }
        $found_match = preg_match('/^\\[([^\\]]+)\\]\\s*([^:]+):\s*(.*) in (.+)(:(\d+)| on line (\d+))/', $line, $matches);
        if ($found_match !== 0 && $found_match !== false) {
            if (count($logs) === $size) {
                break;
            }
            $in_stack = false;
            $timestamp = strtotime($matches[1]);
            $type = $matches[2];
            $message = $matches[3];
            $err_path = $matches[4];
            if ($matches[5][0] === ':') {
                $line = (int) $matches[6];
            } else {
                $line = (int) $matches[7];
            }

            if ($type !== null) {
                $type = trim($type);
            }

            if ($message !== null) {
                $message = trim($message);
            }

            $logs[] = [
                'timestamp' => $timestamp,
                'type' => $type,
                'message' => $message,
                'path' => $err_path,
                'line' => $line,
            ];
        } else if (count($logs) === 0) {
            $logs[] = [
                'timestamp' => time(),
                'type' => 'Error Log Parse Failed',
                'message' => $line,
                'path' => '',
                'line' => -1,
            ];
        } else {
            $last_index = count($logs) - 1;
            $last_log = $logs[$last_index];
            $tag = 'details';
            if ($in_stack === false && strpos($line, "Stack trace:") !== false) {
                $in_stack = true;
                $last_log['stack_trace'] = "";
            } else if ($in_stack === true) {

                $last_log['stack_trace'] .= $line;
            } else if (array_key_exists('details', $last_log)) {
                $last_log['details'][] = $line;
            } else {
                $last_log['details'] = [$line];
            }
            $logs[$last_index] = $last_log;
        }
        $has_more = !feof($file);
        if ($has_more === false) {
            $next_offset = 0;
        } else {
            $next_offset = ftell($file);
        }
    }
    fclose($file);

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
