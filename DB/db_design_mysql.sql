CREATE TABLE IF NOT EXISTS `users` (
	`user_id` bigint AUTO_INCREMENT NOT NULL,
	`email` varchar(100) NOT NULL UNIQUE,
	`phone` varchar(20) NOT NULL UNIQUE,
	`password_hash` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`user_id`)
);

CREATE TABLE IF NOT EXISTS `user_profiles` (
	`profile_id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`full_name` varchar(100) NOT NULL,
	`avatar_url` varchar(255) NOT NULL,
	`dob` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`profile_id`)
);

CREATE TABLE IF NOT EXISTS `wallets` (
	`wallet_id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`balance` decimal(10,2) NOT NULL DEFAULT '0',
	`last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`wallet_id`)
);

CREATE TABLE IF NOT EXISTS `wallet_transactions` (
	`txn_id` bigint AUTO_INCREMENT NOT NULL,
	`wallet_id` bigint NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`reference_id` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`txn_id`)
);

CREATE TABLE IF NOT EXISTS `game_sessions` (
	`session_id` bigint AUTO_INCREMENT NOT NULL,
	`session_start` timestamp NOT NULL,
	`session_end` timestamp NOT NULL,
	`bidding_end` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`session_id`)
);

CREATE TABLE IF NOT EXISTS `bids` (
	`bid_id` bigint AUTO_INCREMENT NOT NULL,
	`session_id` bigint NOT NULL,
	`user_id` bigint NOT NULL,
	`chosen_number` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`bid_id`)
);

CREATE TABLE IF NOT EXISTS `session_results` (
	`result_id` bigint AUTO_INCREMENT NOT NULL,
	`session_id` bigint NOT NULL,
	`winning_number` int NOT NULL,
	`declared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`result_id`)
);

CREATE TABLE IF NOT EXISTS `payment_orders` (
	`order_id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` bigint NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`gateway` varchar(50) NOT NULL,
	`gateway_order_id` varchar(100) NOT NULL,
	`gateway_payment_id` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`order_id`)
);


ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_fk1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`);
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_fk1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`);
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_fk1` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`wallet_id`);

ALTER TABLE `bids` ADD CONSTRAINT `bids_fk1` FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`session_id`);

ALTER TABLE `bids` ADD CONSTRAINT `bids_fk2` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`);
ALTER TABLE `session_results` ADD CONSTRAINT `session_results_fk1` FOREIGN KEY (`session_id`) REFERENCES `game_sessions`(`session_id`);
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_fk1` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`);