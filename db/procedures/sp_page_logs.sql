DROP PROCEDURE IF EXISTS sp_page_logs;

DELIMITER //

CREATE PROCEDURE sp_page_logs (
  IN p_page_number INT,
  IN p_page_size INT,
  OUT p_affected_rows INT
)
this_proc: BEGIN

  DECLARE v_page_offset INT;

  IF p_page_number < 1 THEN
    LEAVE this_proc;
  END IF;
  IF NOT p_page_size BETWEEN 1 AND 100 THEN
    LEAVE this_proc;
  END IF;
  SET v_page_offset = p_page_size * (p_page_number - 1);

  SELECT
    l.`id`,
    s.`scope`,
    ld.`last_at`,
    t.`type`,
    m.`message`,
    p.`path`,
    l.`line`,
    ld.`count`
  FROM
    `logs` AS l
    INNER JOIN `scopes` AS s ON l.`scope_id` = s.`id`
    INNER JOIN `types` AS t ON l.`type_id` = t.`id`
    INNER JOIN `messages` AS m ON l.`message_id` = m.`id`
    INNER JOIN `paths` AS p ON l.`path_id` = p.`id`
    INNER JOIN `log_dates` AS ld ON ld.`log_id` = l.`id`
  ORDER BY
    ld.`last_at` DESC
  LIMIT p_page_size OFFSET v_page_offset;
  
  SET p_affected_rows = FOUND_ROWS();
END
//

DELIMITER ;