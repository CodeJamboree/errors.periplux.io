DROP PROCEDURE IF EXISTS sp_get_type_id;

DELIMITER //

CREATE PROCEDURE sp_get_type_id (
  IN p_type VARCHAR(64),
  OUT p_type_id INT
)
this_proc: BEGIN

  DECLARE v_id INT;

  SET p_type_id = NULL;

  IF p_type IS NULL THEN
    SET p_type = '';
  END IF;

  SET p_type = TRIM(p_type);

  SELECT `id` INTO p_type_id FROM `types` WHERE `type` = p_type LIMIT 1;

  IF p_type_id IS NOT NULL THEN
    LEAVE this_proc;
  END IF;

  INSERT INTO `types` (`type`) VALUES (p_type);

  SET p_type_id = LAST_INSERT_ID();
  
END
//

DELIMITER ;