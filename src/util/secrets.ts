import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
} else {
    logger.debug("Using .env.example file to supply config environment variables");
    dotenv.config({ path: ".env.example" });  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'

export const SESSION_SECRET = process.env["SESSION_SECRET"];
export const MONGODB_URI = prod ? process.env["MONGODB_URI"] : process.env["MONGODB_URI_LOCAL"];
export const CLIMB_URI = prod ? process.env["CLIMB_URI"] : process.env["CLIMB_URI_LOCAL"];
export const SLACK_BOT_TOKEN = process.env["SLACK_BOT_TOKEN"];
export const SLACK_CHANNEL_ID = process.env["SLACK_CHANNEL_ID"];

if (!SESSION_SECRET) {
    logger.error("No client secret. Set SESSION_SECRET environment variable.");
    process.exit(1);
}

if (!MONGODB_URI) {
    logger.error("No mongo connection string. Set MONGODB_URI environment variable.");
    process.exit(1);
}

if (!CLIMB_URI) {
    logger.error("No Climb URI. Set CLIMB_URI environment variable.");
    process.exit(1);
}

if (!SLACK_BOT_TOKEN) {
    logger.error("No Slack bot token. Set SLACK_BOT_TOKEN environment variable.");
    process.exit(1);
}

if (!SLACK_CHANNEL_ID) {
    logger.error("No Slack channel ID. Set SLACK_CHANNEL_ID environment variable.");
    process.exit(1);
}