<?php
require_once "../common/Show.php";
require_once "../common/Secrets.php";

function main()
{

// Show::error("Unauthorized");
// exit;

    $path = Secrets::reveal("ERROR_LOG");
    if ($path === false) {
        Show::error("Unable to retrieve ERROR_LOG");
        exit;
    }

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
            $path = $matches[4];
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
                'path' => $path,
                'line' => $line,
            ];
        } else if (count($logs) === 0) {
            $logs[] = [
                'message' => $line,
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
    $result = [
        'logs' => $logs,
        'has_more' => $has_more,
    ];
    if ($has_more === true) {
        $result['next_offset'] = $next_offset;
    }
    Show::data($result);
}
try {
    main();
} catch (Exception $e) {
    Show::error("Unhandled Exception. Message: " . $e->getMessage());
}
