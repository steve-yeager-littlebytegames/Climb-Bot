import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import logger from "./util/logger";
import lusca from "lusca";
import dotenv from "dotenv";
import mongo from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import expressValidator from "express-validator";
import bluebird from "bluebird";
import { MONGODB_URI } from "./util/secrets";
import schedule from "node-schedule";
import { Request, Response } from "express";

const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env.example" });

// Controllers (route handlers)
import * as slackController from "./controllers/slack";
import { JobDto } from "./models/JobDto";
import moment = require("moment");

// Create Express server
const app = express();

const dbUrl = initDB();
initExpress(dbUrl);
registerRoutes();
scheduleMessages();

function initDB(): string {
  const mongoUrl = MONGODB_URI;
  (<any>mongoose).Promise = bluebird;
  mongoose.connect(mongoUrl, { useMongoClient: true }).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
  ).catch(err => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
    // process.exit();
  });
  return mongoUrl;
}

function initExpress(mongoUrl: string): void {
  app.set("port", process.env.PORT || 3000);
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressValidator());
  app.use(flash());
  app.use(lusca.xframe("SAMEORIGIN"));
  app.use(lusca.xssProtection(true));
  app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
  });

  app.use(
    express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
  );
}

function registerRoutes(): void {
  app.post("/leagues", slackController.postLeagues);
  app.post("/sets", slackController.postSets);
  app.get("/test", (req: Request, res: Response) => res.status(200).send("Hello World!"));
  app.get("/jobs", (req: Request, res: Response) => res.status(200).json(JobDto.getJobs()));
  app.post("/jobs/reset", (req: Request, res: Response) => {
    for (const key in schedule.scheduledJobs) {
      schedule.cancelJob(key);
    }
    scheduleMessages();
    res.status(200).json(JobDto.getJobs());
  });
  app.post("/jobs/invoke", (req: Request, res: Response) => {
    const jobName = req.body.jobName;
    const job = schedule.scheduledJobs[jobName];
    if (!job) {
      res.status(404).send(`No job '${jobName}' found.`);
    } else {
      job.invoke();
      res.status(200).send(`Job '${jobName}' invoked.`);
    }
  });
  app.post("/jobs/clear", (req: Request, res: Response) => {
    lastSetReminder = -1;
    res.status(200).send(`Job last time run cleared.`);
  });
}

function scheduleMessages(): void {
  schedule.scheduleJob("Power Rankings", { hour: 17, dayOfWeek: 1 }, () => {
    console.info("Messaging: Power Ranks");
  });

  schedule.scheduleJob("Set Reminders", { hour: 17, dayOfWeek: [1, 4] }, sendSetReminders);
}

let lastSetReminder: number;

async function sendSetReminders(): Promise<void> {

  const today = moment().dayOfYear();
  if (today == lastSetReminder) {
    logger.warn("Set reminders have already run today.");
    return;
  }
  lastSetReminder = today;

  logger.info("Sending set reminders.");
  await slackController.sendSetReminders()
    .then(() => {
      logger.info("Sent set reminders.");
    })
    .catch(error => {
      logger.error(`Could not send set reminders.\n${error}`);
    });

  logger.info("Done sending set reminders.");
}

export default app;