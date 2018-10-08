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
}

function scheduleMessages(): void {
  schedule.scheduleJob("Power Rankings", { hour: 10, dayOfWeek: 1 }, () => {
    console.info("Messaging: Power Ranks");
  });

  schedule.scheduleJob("Set Reminders", { hour: 10, dayOfWeek: [1, 2, 3, 4, 5] }, slackController.sendSetReminders);
}

export default app;