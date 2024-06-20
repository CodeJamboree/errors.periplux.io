DROP PROCEDURE IF EXISTS sp_get_log_id;

DELIMITER //

CREATE PROCEDURE sp_get_log_id (
  IN p_created_at BIGINT,
  IN p_type_id INT,
  IN p_message_id INT,
  IN p_path_id INT,
  IN p_line INT,
  OUT p_log_id INT
)
this_proc: BEGIN

  DECLARE v_id INT;
  DECLARE v_first_at BIGINT;
  DECLARE v_last_at BIGINT;

  SET p_log_id = NULL;

  IF p_type_id IS NULL OR p_message_id IS NULL OR p_path_id IS NULL OR p_line IS NULL OR p_created_at IS NULL THEN
    LEAVE this_proc;
  END IF;


  SELECT
    `id`,
    `first_at`,
    `last_at`
  INTO
    p_log_id,
    v_first_at,
    v_last_at
  FROM
    `logs`
  WHERE
    `type_id` = p_type_id
    AND `message_id` = p_message_id
    AND `path_id` = p_path_id
    AND `line` = p_line
  LIMIT 1;

  IF p_log_id IS NOT NULL THEN

    IF p_created_at < v_first_at THEN
      UPDATE `logs` SET `first_at` = p_created_at WHERE `id` = p_log_id LIMIT 1;
    END IF;
  
    IF p_created_at > v_last_at THEN
      UPDATE `logs` SET `last_at` = p_created_at WHERE `id` = p_log_id LIMIT 1;
    END IF;

    LEAVE this_proc;
  END IF;

  INSERT INTO `logs` (
    `first_at`,
    `last_at`,
    `type_id`,
    `message_id`,
    `path_id`,
    `line`
  ) VALUES (
    p_created_at,
    p_created_at,
    p_type_id,
    p_message_id,
    p_path_id,
    p_line
  );

  SET p_log_id = LAST_INSERT_ID();
  
END
//

DELIMITER ;