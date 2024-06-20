DROP PROCEDURE IF EXISTS sp_log_details;

DELIMITER //

CREATE PROCEDURE sp_log_details (
  IN p_log_id INT,
  IN p_details TEXT
)
this_proc: BEGIN

  DECLARE v_detail_id INT;
  DECLARE v_hash CHAR(64);

  IF p_details IS NULL OR p_details = '' THEN
    LEAVE this_proc;
  END IF;

  SET p_details = TRIM(p_details);

  IF p_details = '' THEN
    LEAVE this_proc;
  END IF;

  SET v_hash = SHA2(p_details, 256);

  SELECT `id` INTO v_detail_id FROM `details` WHERE `hash` = v_hash LIMIT 1;

  IF v_detail_id IS NULL THEN
    INSERT INTO `details` (`hash`, `details`) VALUES (v_hash, p_details);
    SET v_detail_id = LAST_INSERT_ID();
  END IF;

  IF NOT EXISTS(
    SELECT 0 FROM `log_details` WHERE `log_id` = p_log_id AND `detail_id` = v_detail_id LIMIT 1
  ) THEN
    INSERT INTO `log_details` (`log_id`, `detail_id`) VALUES (p_log_id, v_detail_id);
  END IF;

END
//

DELIMITER ;