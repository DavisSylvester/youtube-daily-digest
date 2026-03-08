CREATE TABLE `channel_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` integer NOT NULL,
	`channel_id` text NOT NULL,
	`preference_score` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `channel_preferences_topic_id_channel_id_unique` ON `channel_preferences` (`topic_id`,`channel_id`);--> statement-breakpoint
CREATE TABLE `keyword_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` integer NOT NULL,
	`keyword` text NOT NULL,
	`preference_score` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `keyword_preferences_topic_id_keyword_unique` ON `keyword_preferences` (`topic_id`,`keyword`);--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` integer NOT NULL,
	`video_id` text NOT NULL,
	`rating` integer NOT NULL,
	`feedback` text,
	`rated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`video_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `run_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`topic_id` integer NOT NULL,
	`video_id` text NOT NULL,
	`query_text` text NOT NULL,
	`rule_score` real DEFAULT 0 NOT NULL,
	`llm_score` real DEFAULT 0 NOT NULL,
	`final_score` real DEFAULT 0 NOT NULL,
	`reason` text,
	`summary` text,
	`included_in_email` integer DEFAULT 0 NOT NULL,
	`rank_position` integer,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`video_id`) REFERENCES `videos`(`video_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `run_videos_run_id_topic_id_video_id_unique` ON `run_videos` (`run_id`,`topic_id`,`video_id`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`topic_id` integer NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`status` text NOT NULL,
	`discovered_count` integer DEFAULT 0 NOT NULL,
	`shortlisted_count` integer DEFAULT 0 NOT NULL,
	`emailed_count` integer DEFAULT 0 NOT NULL,
	`html_path` text,
	`log_path` text,
	`last_published_after` text,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `topic_queries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` integer NOT NULL,
	`query_text` text NOT NULL,
	`priority` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_slug_unique` ON `topics` (`slug`);--> statement-breakpoint
CREATE TABLE `videos` (
	`video_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`channel_id` text,
	`channel_title` text,
	`published_at` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`thumbnail_url` text,
	`first_seen_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
