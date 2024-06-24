DROP PROCEDURE IF EXISTS sp_select_log;

DELIMITER //

CREATE PROCEDURE sp_select_log (
  IN p_log_id INT
)
this_proc: BEGIN

  SELECT
    l.`id`,
    s.`scope`,
    MIN(ld.`first_at`) AS `first_at`,
    MAX(ld.`last_at`) AS `last_at`,
    t.`type`,
    m.`message`,
    p.`path`,
    l.`line`,
    SUM(ld.`count`) AS `count`
  FROM
    `logs` AS l
    INNER JOIN `scopes` AS s ON l.`scope_id` = s.`id`
    INNER JOIN `types` AS t ON l.`type_id` = t.`id`
    INNER JOIN `messages` AS m ON l.`message_id` = m.`id`
    INNER JOIN `paths` AS p ON l.`path_id` = p.`id`
    INNER JOIN `log_dates` AS ld ON ld.`log_id` = l.`id`
  WHERE
    l.`id` = p_log_id
  GROUP BY
    l.`id`,
    s.`scope`,
    t.`type`,
    m.`message`,
    p.`path`,
    l.`line`
  ORDER BY
    MAX(ld.`last_at`) DESC,
    MIN(ld.`first_at`) ASC
  LIMIT 1;

END
//

DELIMITER ;