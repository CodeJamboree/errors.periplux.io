CREATE TABLE `log_details` (
	`log_id` INT NOT NULL,
  `detail_id` INT NOT NULL,
  FOREIGN KEY(`log_id`) REFERENCES `logs`(`id`),
  FOREIGN KEY(`detail_id`) REFERENCES `details`(`id`),
  PRIMARY KEY(`log_id`, `detail_id`)
)