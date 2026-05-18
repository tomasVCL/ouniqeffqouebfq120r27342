CREATE TABLE `capfit_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`startupId` int NOT NULL,
	`criterionId` int NOT NULL,
	`score` enum('High','Med','Low') NOT NULL DEFAULT 'Low',
	`aiScore` enum('High','Med','Low'),
	`justificationNote` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capfit_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clusters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`differentiator` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clusters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formulas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('Revenue','Cost Savings','Risk Reduction','Time Savings') NOT NULL,
	`expression` text NOT NULL,
	`description` text,
	`variables` json DEFAULT ('[]'),
	`result` float,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formulas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matrix_criteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`matrixType` enum('wsm','pugh','capfit') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`weight` float DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matrix_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analystId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`industry` varchar(255),
	`geographyAllowed` text,
	`geographyExcluded` text,
	`reportDate` varchar(32),
	`analystContactName` varchar(255),
	`analystContactEmail` varchar(320),
	`analystContactPhone` varchar(64),
	`passkey` varchar(128),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`stepsCompleted` json DEFAULT ('{}'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `publish_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`action` enum('published','unpublished') NOT NULL,
	`analystId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publish_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pugh_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`startupId` int NOT NULL,
	`criterionId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`aiScore` int,
	`justificationNote` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pugh_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`startupId` int NOT NULL,
	`aiDraft` text,
	`analystText` text,
	`decision` enum('recommended','not_recommended'),
	`notRecommendedReason` enum('below threshold','geography','TRL','other'),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(255),
	`weight` float NOT NULL DEFAULT 0,
	`mandatory` boolean NOT NULL DEFAULT false,
	`evidence` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `startups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`tagline` varchar(255),
	`hqCity` varchar(128),
	`hqCountry` varchar(128),
	`foundedYear` int,
	`fundingStage` enum('Pre-seed','Seed','Series A','Series B','Series B+'),
	`trlLevel` int,
	`employeeRange` varchar(64),
	`eligibilityFlag` enum('eligible','excluded') DEFAULT 'eligible',
	`eligibilityReason` text,
	`clusterId` int,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `startups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wsm_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`startupId` int NOT NULL,
	`criterionId` int NOT NULL,
	`score` float NOT NULL DEFAULT 0,
	`aiScore` float,
	`justificationNote` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wsm_scores_id` PRIMARY KEY(`id`)
);
