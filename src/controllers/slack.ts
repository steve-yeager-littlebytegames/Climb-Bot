import { Request, Response } from "express";
import { ClimbClient } from "../climb_client/climb";
import { CLIMB_URI, SLACK_WEBHOOK } from "../util/secrets";
import logger from "../util/logger";
import moment from "moment";
import "moment-timezone";
import Axios, { AxiosPromise } from "axios";
import { UserDB } from "../models/UserDB";
import fs from "fs";
import path from "path";

export const postLeagues = async (req: Request, res: Response) => {
    const leagueApi = new ClimbClient.LeagueApi(CLIMB_URI);
    const leagues = await leagueApi.getAll();

    const message = leagues.map(l => `<${CLIMB_URI}/leagues/home/${l.id}|${l.name}>`).join("\n");
    await postMessage(message);

    res.status(200).send();
};

export const postSets = async (req: Request, res: Response) => {
    try {
        await sendSetReminders();
    } catch (error) {
        return res.status(500).send(error);
    }
    res.status(200).send();
};

export const postCompletedSets = async (req: Request, res: Response) => {
    try {
        // TODO: Get hours from request.
        const hours = 1;

        await sendCompletedSetsAsync(hours);
    } catch (error) {
        logger.error(`Failed to send completed sets! Error: ${JSON.stringify(error)}`);
        return res.status(500).send(error);
    }
    res.status(200).send();
};

export const sendSetReminders = async () => {
    logger.info("---Start: Sending Slack Reminders");

    const leagueApi = new ClimbClient.LeagueApi(CLIMB_URI);
    const leagues = await leagueApi.getAll();

    const targetDate = moment().utc().add(7, "d");
    const targetDateString = targetDate.tz("America/Los_Angeles").format("dddd MM/DD");

    const userDB = createUserDB();

    for (let i = 0; i < leagues.length; i++) {
        const league = leagues[i];
        try {
            const sets = await leagueApi.sets(league.id, targetDate.toDate());
            if (!sets) {
                logger.error(`Couldn't get sets for league ${leagues[i].name}.`);
                continue;
            }

            sets.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

            if (sets && sets.length > 0) {
                const message = `*${league.name} sets due by ${targetDateString}*\n`;
                await postMessage(message);

                logger.info(`Sending ${sets.length} for league '${league.name}'.`);
                for (let i = 0; i < sets.length; i++) {
                    const set = sets[i];
                    const message = `<${CLIMB_URI}/sets/fight/${set.id}|Fight> *${getPlayerName(set, true, userDB)}* v *${getPlayerName(set, false, userDB)}* due _${moment(set.dueDate).format("dddd MM/DD")}_`;
                    await postMessage(message);
                }
            } else {
                logger.info(`No sets found for league '${league.name}'.`);
            }
        } catch (exception) {
            logger.error(`Could not get/send sets for league '${league.name}' because of error: ${exception}`);
        }
    }

    logger.info("-----End: Sending Slack Reminders");
};

export const sendCompletedSetsAsync = async (hours: number) => {
    logger.info("Sending completed sets to Slack.");

    const leagueApi = new ClimbClient.LeagueApi(CLIMB_URI);
    const leagues = await leagueApi.getAll();

    const userDB = createUserDB();

    const targetDate = moment().subtract(hours, "h").toDate();

    for (let i = 0; i < leagues.length; i++) {
        const league = leagues[i];
        const completedSets = await leagueApi.getCompletedSets(league.id, targetDate);

        if (completedSets.length > 0) {
            await postMessage(`*${league.name} Completed Sets*`);

            for (let j = 0; j < completedSets.length; j++) {
                const set = completedSets[j];
                const message = `<${CLIMB_URI}/sets/fight/${set.id}|Details> *${getPlayerName(set, true, userDB)}* ${set.player1Score} - ${set.player2Score} *${getPlayerName(set, false, userDB)}*`;

                await postMessage(message);
            }
        } else {
            logger.info(`No sets for league ${league.id}.`);
        }
    }
};

function createUserDB(): UserDB {
    const userDataPath = path.resolve(__dirname, "..\\..\\users.json");
    const usersList = fs.readFileSync(userDataPath, "utf8");
    const usersDB = UserDB.Create(JSON.parse(usersList));
    return usersDB;
}

function postMessage(message: string): AxiosPromise<any> {
    const payload = {
        "text": message,
    };

    return Axios.post(SLACK_WEBHOOK, payload);
}

function getPlayerName(set: ClimbClient.SetDto, isPlayer1: boolean, usersDB: UserDB): string {
    if (isPlayer1) {
        return usersDB.getSlackID(set.user1ID) || set.player1Name;
    }

    return usersDB.getSlackID(set.user2ID) || set.player2Name;
}