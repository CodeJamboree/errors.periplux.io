DROP PROCEDURE IF EXISTS sp_delete_log;

DELIMITER //

CREATE PROCEDURE sp_delete_log (
  IN p_log_id INT
)
this_proc: BEGIN

  DECLARE v_error_message TEXT;
  DECLARE v_sql_safe_updates INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION, SQLWARNING
  BEGIN
      ROLLBACK;
      GET DIAGNOSTICS CONDITION 1 v_error_message = MESSAGE_TEXT;
      SELECT v_error_message AS `proc_message`;
      SET SQL_SAFE_UPDATES = v_sql_safe_updates;
  END;

  SET v_sql_safe_updates = @@SQL_SAFE_UPDATES;

  START TRANSACTION;

  DELETE FROM `log_dates` WHERE `log_id` = p_log_id;
  DELETE FROM `log_details` WHERE `log_id` = p_log_id;
  DELETE FROM `log_stack_traces` WHERE `log_id` = p_log_id;
  DELETE FROM `logs` WHERE `id` = p_log_id;

  -- About to remove notifications without directly using id
  SET SQL_SAFE_UPDATES = 0;

  -- Remove orphans
  DELETE FROM `details` WHERE `id` NOT IN(
    SELECT `detail_id` FROM `log_details`
  );
  DELETE FROM `stack_traces` WHERE `id` NOT IN(
    SELECT `stack_trace_id` FROM `log_stack_traces`
  );
  DELETE FROM `messages` WHERE `id` NOT IN(
    SELECT `message_id` FROM `logs`
  );
  DELETE FROM `paths` WHERE `id` NOT IN(
    SELECT `path_id` FROM `logs`
  );
  DELETE FROM `types` WHERE `id` NOT IN(
    SELECT `type_id` FROM `logs`
  );

  SET SQL_SAFE_UPDATES = v_sql_safe_updates;

  COMMIT;

END
//

DELIMITER ;