DROP PROCEDURE IF EXISTS sp_log;

DELIMITER //

CREATE PROCEDURE sp_log (
  IN p_scope VARCHAR(64),
  IN p_created_at BIGINT,
  IN p_type VARCHAR(64),
  IN p_message VARCHAR(1024),
  IN p_path VARCHAR(1024),
  IN p_line INT,
  IN p_stack_trace TEXT,
  IN p_details TEXT
)
this_proc: BEGIN

  DECLARE v_error_message TEXT;
  DECLARE v_affected_rows INT;
  DECLARE v_scope_id INT;
  DECLARE v_detail_id INT;
  DECLARE v_stack_trace_id INT;
  DECLARE v_path_id INT;
  DECLARE v_message_id INT;
  DECLARE v_type_id INT;
  DECLARE v_log_id INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
    SELECT v_error_message AS `proc_message`;
  END;

  CALL sp_get_scope_id(p_scope, v_scope_id);
  CALL sp_get_path_id(p_path, v_path_id);
  CALL sp_get_message_id(p_message, v_message_id);
  CALL sp_get_type_id(p_type, v_type_id);
  CALL sp_get_log_id(
    p_scope_id,
    p_created_at,
    v_type_id,
    v_message_id,
    v_path_id,
    p_line,
    v_log_id
  );
  CALL sp_log_details(v_log_id, p_details);
  CALL sp_log_stack_trace(v_log_id, p_stack_trace);
  CALL sp_log_date(v_log_id, p_created_at);

END
//

DELIMITER ;