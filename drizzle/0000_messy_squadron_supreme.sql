CREATE TABLE IF NOT EXISTS `study_progress` (
	`user_id` text NOT NULL,
	`lesson_id` integer NOT NULL,
	`stage_id` integer NOT NULL,
	`completed_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `lesson_id`, `stage_id`)
);
