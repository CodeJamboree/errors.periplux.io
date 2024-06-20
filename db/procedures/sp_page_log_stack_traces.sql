DROP PROCEDURE IF EXISTS sp_page_log_stack_traces;

DELIMITER //

CREATE PROCEDURE sp_page_log_stack_traces (
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
    st.`stack_trace`
  FROM
    `log_stack_traces` AS lst
    INNER JOIN `stack_traces` AS st ON lst.`stack_trace_id` = st.`id`
  WHERE
    lst.`log_id` = p_log_id
  ORDER BY
    st.`id`
  LIMIT p_page_size OFFSET v_page_offset;
  
  SET p_affected_rows = FOUND_ROWS();
END
//

DELIMITER ;