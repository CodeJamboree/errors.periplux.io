DROP PROCEDURE IF EXISTS sp_delete_all;

DELIMITER //

CREATE PROCEDURE sp_delete_all (
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

  -- About to remove notifications without directly using id
  SET SQL_SAFE_UPDATES = 0;

  DELETE FROM `log_dates`;
  DELETE FROM `log_details`;
  DELETE FROM `logs`;
  DELETE FROM `details`;
  DELETE FROM `detail_types`;
  DELETE FROM `messages`;
  DELETE FROM `paths`;
  DELETE FROM `types`;
  DELETE FROM `scopes`;

  SET SQL_SAFE_UPDATES = v_sql_safe_updates;

END
//

DELIMITER ;