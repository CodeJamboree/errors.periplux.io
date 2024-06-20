CREATE TABLE `log_stack_traces` (
	`log_id` INT NOT NULL,
  `stack_trace_id` INT NOT NULL,
  FOREIGN KEY(`log_id`) REFERENCES `logs`(`id`),
  FOREIGN KEY(`stack_trace_id`) REFERENCES `stack_traces`(`id`),
  PRIMARY KEY(`log_id`, `stack_trace_id`)
)