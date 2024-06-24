DROP PROCEDURE IF EXISTS sp_log_date;

DELIMITER //

CREATE PROCEDURE sp_log_date (
  IN p_log_id INT,
  IN p_created_at BIGINT
)
this_proc: BEGIN

  DECLARE v_date_id INT;
  DECLARE v_first_at BIGINT;
  DECLARE v_last_at BIGINT;
  DECLARE v_consolidate_seconds INT;
  SET v_consolidate_seconds = 60;

  IF p_created_at IS NULL OR p_log_id IS NULL THEN
    LEAVE this_proc;
  END IF;

  SELECT `id`, `first_at`, `last_at`
  INTO v_date_id, v_first_at, v_last_at
  FROM `log_dates`
  WHERE
    `log_id` = p_log_id
    AND p_created_at BETWEEN `first_at` - v_consolidate_seconds AND `last_at` + v_consolidate_seconds
  LIMIT 1;

  IF v_date_id IS NULL THEN
    INSERT INTO `log_dates` (`log_id`, `first_at`, `last_at`) VALUES (p_log_id, p_created_at, p_created_at);
  ELSE
    UPDATE `log_dates` SET `count` = `count` + 1 WHERE `id` = v_date_id LIMIT 1;
    IF p_created_at < v_first_at THEN
      UPDATE `log_dates` SET `first_at` = p_created_at WHERE `id` = v_date_id LIMIT 1;
    END IF;
    IF p_created_at > v_last_at THEN
      UPDATE `log_dates` SET `last_at` = p_created_at WHERE `id` = v_date_id LIMIT 1;
    END IF;
  END IF;

END
//

DELIMITER ;