CREATE TABLE `log_dates` (
	`id` INT AUTO_INCREMENT PRIMARY KEY,
  `log_id` INT NOT NULL,
  `first_at` BIGINT NOT NULL,
  `last_at` BIGINT NOT NULL,
  `count` INT DEFAULT 1,
  FOREIGN KEY(`log_id`) REFERENCES `logs`(`id`),
  INDEX(`log_id`, `last_at`),
  INDEX(`log_id`, `first_at`),
  UNIQUE(`log_id`, `first_at`)
)