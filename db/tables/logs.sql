CREATE TABLE `logs` (
	`id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_at` BIGINT NOT NULL,
  `last_at` BIGINT NOT NULL,
  `type_id` INT NOT NULL,
  `message_id` INT NOT NULL,
  `path_id` INT NOT NULL,
  `line` INT NOT NULL,
  FOREIGN KEY(`type_id`) REFERENCES `types`(`id`),
  FOREIGN KEY(`message_id`) REFERENCES `messages`(`id`),
  FOREIGN KEY(`path_id`) REFERENCES `paths`(`id`),
  UNIQUE(`type_id`, `message_id`, `path_id`, `line`),
  INDEX(`path_id`),
  INDEX(`last_at`),
  INDEX(`first_at`)
)
