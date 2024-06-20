DROP PROCEDURE IF EXISTS sp_get_detail_type_id;

DELIMITER //

CREATE PROCEDURE sp_get_detail_type_id (
  IN p_detail_type VARCHAR(64),
  OUT p_detail_type_id INT
)
this_proc: BEGIN

  DECLARE v_id INT;

  SET p_detail_type_id = NULL;

  IF p_detail_type IS NULL OR p_detail_type = '' THEN
    LEAVE this_proc;
  END IF;

  SET p_detail_type = TRIM(p_detail_type);

  IF p_detail_type = '' THEN
    LEAVE this_proc;
  END IF;

  SELECT `id` INTO p_detail_type_id FROM `detail_types` WHERE `detail_type` = p_detail_type LIMIT 1;

  IF p_detail_type_id IS NOT NULL THEN
    LEAVE this_proc;
  END IF;

  INSERT INTO `detail_types` (`detail_type`) VALUES (p_detail_type);

  SET p_detail_type_id = LAST_INSERT_ID();
  
END
//

DELIMITER ;