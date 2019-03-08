import { Request, Response } from "express";
import { ClimbClient } from "../climb_client/climb";
import { CLIMB_URI, SLACK_WEBHOOK } from "../util/secrets";
import logger from "../util/logger";
import moment from "moment";
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
        return res.status(500).send(error);
    }
    res.status(200).send();
};

export const sendSetReminders = async () => {
    logger.info("Sending Slack set reminders.");

    const leagueApi = new ClimbClient.LeagueApi(CLIMB_URI);
    const leagues = await leagueApi.getAll();

    const targetDate = moment().add(7, "d");
    const targetDateString = targetDate.format("dddd MM/DD");

    const userDB = createUserDB();

    for (let i = 0; i < leagues.length; i++) {
        const sets = await leagueApi.sets(leagues[i].id, targetDate.toDate());
        if (!sets) {
            logger.error(`Couldn't get sets for league ${leagues[i].id}.`);
            continue;
        }

        sets.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        if (sets && sets.length > 0) {
            let message = `${leagues[i].name} sets due by ${targetDateString}\n`;
            message += sets.map(s => `<${CLIMB_URI}/sets/fight/${s.id}|Fight> *${getPlayerName(s, true, userDB)}* v *${getPlayerName(s, false, userDB)}* due _${moment(s.dueDate).format("dddd MM/DD")}_`).join("\n");

            await postMessage(message);
        } else {
            logger.info("No sets found.");
        }
    }
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