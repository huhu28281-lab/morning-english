CREATE TABLE `ai_connections` (
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`encrypted_secret` text NOT NULL,
	`endpoint` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `provider`)
);
--> statement-breakpoint
CREATE TABLE `ai_usage` (
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`window` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `provider`, `window`)
);
--> statement-breakpoint
CREATE TABLE `vocabulary` (
	`user_id` text NOT NULL,
	`word_key` text NOT NULL,
	`english` text NOT NULL,
	`meaning` text NOT NULL,
	`example` text NOT NULL,
	`example_ko` text NOT NULL,
	`known` integer DEFAULT 0 NOT NULL,
	`saved` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `word_key`)
);
