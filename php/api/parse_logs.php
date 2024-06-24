<?php
function parse_logs(string $path, int $offset, int $size)
{
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

    return [
        'logs' => $logs,
        'next_offset' => $next_offset,
        'has_more' => $has_more,
    ];

}
