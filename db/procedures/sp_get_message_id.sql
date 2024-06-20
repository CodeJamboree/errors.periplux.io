DROP PROCEDURE IF EXISTS sp_get_message_id;

DELIMITER //

CREATE PROCEDURE sp_get_message_id (
  IN p_message VARCHAR(1024),
  OUT p_message_id INT
)
this_proc: BEGIN

  DECLARE v_id INT;

  SET p_message_id = NULL;

  IF p_message IS NULL OR p_message = '' THEN
    LEAVE this_proc;
  END IF;

  SET p_message = TRIM(p_message);

  IF p_message = '' THEN
    LEAVE this_proc;
  END IF;

  SELECT `id` INTO p_message_id FROM `messages` WHERE `message` = p_message LIMIT 1;

  IF p_message_id IS NOT NULL THEN
    LEAVE this_proc;
  END IF;

  INSERT INTO `messages` (`message`) VALUES (p_message);

  SET p_message_id = LAST_INSERT_ID();
  
END
//

DELIMITER ;