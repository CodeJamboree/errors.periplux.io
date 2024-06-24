<?php

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
