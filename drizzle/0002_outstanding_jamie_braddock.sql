CREATE TABLE `cloudflare_daily_usage` (
	`account_id` text NOT NULL,
	`day` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL,
	`reserved_neurons` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`account_id`, `day`)
);
