DROP PROCEDURE IF EXISTS sp_log_stack_trace;

DELIMITER //

CREATE PROCEDURE sp_log_stack_trace (
  IN p_log_id INT,
  IN p_stack_trace TEXT
)
this_proc: BEGIN

  DECLARE v_stack_trace_id INT;
  DECLARE v_hash CHAR(64);

  IF p_stack_trace IS NULL OR p_stack_trace = '' THEN
    LEAVE this_proc;
  END IF;

  SET p_stack_trace = TRIM(p_stack_trace);

  IF p_stack_trace = '' THEN
    LEAVE this_proc;
  END IF;

  SET v_hash = SHA2(p_stack_trace, 256);

  SELECT `id` INTO v_stack_trace_id FROM `stack_traces` WHERE `hash` = v_hash LIMIT 1;

  IF v_stack_trace_id IS NULL THEN
    INSERT INTO `stack_traces` (`hash`, `stack_trace`) VALUES (v_hash, p_stack_trace);
    SET v_stack_trace_id = LAST_INSERT_ID();
  END IF;

  IF NOT EXISTS(
    SELECT 0 FROM `log_stack_traces` WHERE `log_id` = p_log_id AND `stack_trace_id` = v_stack_trace_id LIMIT 1
  ) THEN
    INSERT INTO `log_stack_traces` (`log_id`, `stack_trace_id`) VALUES (p_log_id, v_stack_trace_id);
  END IF;

END
//

DELIMITER ;