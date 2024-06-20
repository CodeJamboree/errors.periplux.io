CREATE TABLE `details` (
	`id` INT AUTO_INCREMENT PRIMARY KEY,
	`detail_type_id` INT,
  `hash` CHAR(64) NOT NULL UNIQUE,
	`details` TEXT NOT NULL,
	FOREIGN KEY(`detail_type_id`) REFERENCES `detail_types`(`id`)
)