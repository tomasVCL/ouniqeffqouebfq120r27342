import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await mysql.createConnection(url);

const tables = [
  `CREATE TABLE IF NOT EXISTS projects (
    id int AUTO_INCREMENT NOT NULL,
    analystId int NOT NULL,
    title varchar(255) NOT NULL,
    clientName varchar(255) NOT NULL,
    industry varchar(255),
    geographyAllowed text,
    geographyExcluded text,
    reportDate varchar(32),
    analystContactName varchar(255),
    analystContactEmail varchar(320),
    analystContactPhone varchar(64),
    passkey varchar(128),
    status enum('draft','published') NOT NULL DEFAULT 'draft',
    stepsCompleted json,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS publish_log (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    action enum('published','unpublished') NOT NULL,
    analystId int NOT NULL,
    createdAt timestamp NOT NULL DEFAULT (now()),
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS requirements (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    name varchar(255) NOT NULL,
    category varchar(255),
    weight float NOT NULL DEFAULT 0,
    mandatory boolean NOT NULL DEFAULT false,
    evidence text,
    sortOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS formulas (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    name varchar(255) NOT NULL,
    type enum('Revenue','Cost Savings','Risk Reduction','Time Savings') NOT NULL,
    expression text NOT NULL,
    description text,
    variables json,
    result float,
    sortOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS startups (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    name varchar(255) NOT NULL,
    tagline varchar(255),
    hqCity varchar(128),
    hqCountry varchar(128),
    foundedYear int,
    fundingStage enum('Pre-seed','Seed','Series A','Series B','Series B+'),
    trlLevel int,
    employeeRange varchar(64),
    eligibilityFlag enum('eligible','excluded') DEFAULT 'eligible',
    eligibilityReason text,
    clusterId int,
    sortOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS matrix_criteria (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    matrixType enum('wsm','pugh','capfit') NOT NULL,
    name varchar(255) NOT NULL,
    description text,
    weight float DEFAULT 0,
    sortOrder int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS wsm_scores (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    startupId int NOT NULL,
    criterionId int NOT NULL,
    score float NOT NULL DEFAULT 0,
    aiScore float,
    justificationNote text,
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS pugh_scores (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    startupId int NOT NULL,
    criterionId int NOT NULL,
    score int NOT NULL DEFAULT 0,
    aiScore int,
    justificationNote text,
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
  `CREATE TABLE IF NOT EXISTS recommendations (
    id int AUTO_INCREMENT NOT NULL,
    projectId int NOT NULL,
    startupId int NOT NULL,
    aiDraft text,
    analystText text,
    decision enum('recommended','not_recommended'),
    notRecommendedReason enum('below threshold','geography','TRL','other'),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  )`,
];

for (const sql of tables) {
  const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
  try {
    await conn.execute(sql);
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}

await conn.end();
console.log("Migration complete");
