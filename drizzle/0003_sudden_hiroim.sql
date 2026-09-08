CREATE TABLE `weekly_curriculum` (
	`week_start` text NOT NULL,
	`level` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`week_start`, `level`)
);
--> statement-breakpoint
CREATE TABLE `weekly_generation_attempts` (
	`week_start` text NOT NULL,
	`level` text NOT NULL,
	`attempt_day` text NOT NULL,
	PRIMARY KEY(`week_start`, `level`, `attempt_day`)
);
