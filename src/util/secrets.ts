import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

export const ENVIRONMENT = process.env.NODE_ENV ? process.env.NODE_ENV : "local";

const configPath = `.env.${ENVIRONMENT}`;

if (fs.existsSync(configPath)) {
    logger.info(`Using ${configPath} file to supply config environment variables`);
    dotenv.config({ path: configPath });
} else {
    logger.info(`No .env config file found at ${configPath}.`);
}

export const MONGODB_URI = process.env["MONGODB_URI"];

if (!MONGODB_URI) {
    logger.error("No mongo connection string. Set MONGODB_URI environment variable.");
    process.exit(1);
}

export const CLIMB_URI = process.env["CLIMB_URI"];
if (!CLIMB_URI) {
    logger.error("No Climb URI. Set CLIMB_URI environment variable.");
    process.exit(1);
}

export const SLACK_WEBHOOK = process.env["SLACK_WEBHOOK"];
if (!SLACK_WEBHOOK) {
    logger.error("No Slack webhook. Set SLACK_WEBHOOK environment variable.");
    process.exit(1);
}