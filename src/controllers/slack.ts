import { Request, Response } from "express";
import { ClimbClient } from "../climb_client/climb";
import { CLIMB_URI, SLACK_WEBHOOK } from "../util/secrets";
import logger from "../util/logger";
import moment from "moment";
import Axios, { AxiosPromise } from "axios";

export const postLeagues = async (req: Request, res: Response) => {
    const climbClient = new ClimbClient(CLIMB_URI);
    const leagues = await climbClient.getAllLeagues();

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

export const sendSetReminders = async () => {
    logger.info("Sending Slack set reminders.");

    const climbClient = new ClimbClient(CLIMB_URI);
    const leagues = await climbClient.getAllLeagues();

    const targetDate = moment().add(7, "d");
    const targetDateString = targetDate.format("dddd MM/DD");

    for (let i = 0; i < leagues.length; i++) {
        const sets = await climbClient.getSets(leagues[i].id, targetDate.toDate());
        if (!sets) {
            logger.error(`Couldn't get sets for league ${leagues[i].id}.`);
            continue;
        }

        sets.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        if (sets && sets.length > 0) {
            let message = `${leagues[i].name} sets due by ${targetDateString}\n`;
            message += sets.map(s => `<${CLIMB_URI}/sets/fight/${s.id}|Fight> *${s.player1Name}* v *${s.player2Name}* due _${moment(s.dueDate).format("dddd MM/DD")}_`).join("\n");

            await postMessage(message);
        } else {
            logger.info("No sets found.");
        }
    }
};

function postMessage(message: string): AxiosPromise<any> {
    const payload = {
        "text": message,
    };

    return Axios.post(SLACK_WEBHOOK, payload);
}