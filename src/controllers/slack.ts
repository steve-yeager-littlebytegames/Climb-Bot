import { Request, Response } from "express";
import { WebClient } from "@slack/client";
import { ClimbClient } from "../climb_client/climb";
import { CLIMB_URI, SLACK_BOT_TOKEN, SLACK_CHANNEL_ID } from "../util/secrets";
import logger from "../util/logger";
import moment from "moment";

export const postLeagues = async (req: Request, res: Response) => {
    const climbClient = new ClimbClient(CLIMB_URI);
    const leagues = await climbClient.getAllLeagues();

    const slackClient = new WebClient(SLACK_BOT_TOKEN);

    await slackClient.chat.postMessage({
        channel: SLACK_CHANNEL_ID,
        text: leagues.map(l => `<${CLIMB_URI}/leagues/home/${l.id}|${l.name}>`).join("\n"),
    })
        .then(slackRes => {
            res.status(200).send();
        })
        .catch(error => {
            logger.error(error);
            res.status(500).send();
        });
};

export const postSets = async (req: Request, res: Response) => {
    const climbClient = new ClimbClient(CLIMB_URI);
    const leagues = await climbClient.getAllLeagues();
    const targetDate = moment().add(7, "d");
    const targetDateString = targetDate.format("dddd MM/DD");
    const slackClient = new WebClient(SLACK_BOT_TOKEN);

    for (let i = 0; i < leagues.length; i++) {
        const sets = await climbClient.getSets(leagues[i].id, targetDate.toDate());
        sets.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        if (sets && sets.length > 0) {
            let message = `${leagues[i].name} sets due by ${targetDateString}\n`;
            message += sets.map(s => `<${CLIMB_URI}/sets/fight/${s.id}|Fight> *${s.player1Name}* v *${s.player2Name}* due _${moment(s.dueDate).format("dddd MM/DD")}_`).join("\n");

            await slackClient.chat.postMessage({
                channel: SLACK_CHANNEL_ID,
                text: message,
            });
        } else {
            logger.info("No sets found.");
        }
    }

    res.status(200).send();
};