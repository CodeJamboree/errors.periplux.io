DROP PROCEDURE IF EXISTS sp_get_scope_id;

DELIMITER //

CREATE PROCEDURE sp_get_scope_id (
  IN p_scope VARCHAR(64),
  OUT p_scope_id INT
)
this_proc: BEGIN

  DECLARE v_id INT;

  SET p_scope_id = NULL;

  IF p_scope IS NULL THEN
    SET p_scope = '';
  END IF;

  SET p_scope = TRIM(p_scope);

  SELECT `id` INTO p_scope_id FROM `scopes` WHERE `scope` = p_scope LIMIT 1;

  IF p_scope_id IS NOT NULL THEN
    LEAVE this_proc;
  END IF;

  INSERT INTO `scopes` (`scope`) VALUES (p_scope);

  SET p_scope_id = LAST_INSERT_ID();
  
END
//

DELIMITER ;