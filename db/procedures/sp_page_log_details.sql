DROP PROCEDURE IF EXISTS sp_page_log_details;

DELIMITER //

CREATE PROCEDURE sp_page_log_details (
  IN p_log_id INT,
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
    d.`details`
  FROM
    `log_details` AS ld
    INNER JOIN `details` AS d ON ld.`detail_id` = d.`id`
  WHERE
    ld.`log_id` = p_log_id
  ORDER BY
    d.`id`
  LIMIT p_page_size OFFSET v_page_offset;
  
  SET p_affected_rows = FOUND_ROWS();
END
//

DELIMITER ;