DROP PROCEDURE IF EXISTS sp_get_path_id;

DELIMITER //

CREATE PROCEDURE sp_get_path_id (
  IN p_path VARCHAR(1024),
  OUT p_path_id INT
)
this_proc: BEGIN

  DECLARE v_id INT;

  SET p_path_id = NULL;

  IF p_path IS NULL OR p_path = '' THEN
    LEAVE this_proc;
  END IF;

  SET p_path = TRIM(p_path);

  IF p_path = '' THEN
    LEAVE this_proc;
  END IF;

  SELECT `id` INTO p_path_id FROM `paths` WHERE `path` = p_path LIMIT 1;

  IF p_path_id IS NOT NULL THEN
    LEAVE this_proc;
  END IF;

  INSERT INTO `paths` (`path`) VALUES (p_path);

  SET p_path_id = LAST_INSERT_ID();
  
END
//

DELIMITER ;