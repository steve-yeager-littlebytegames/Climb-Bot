import { Request, Response } from "express";
import { WebClient } from "@slack/client";
import { ClimbClient } from "../climb_client/climb";
import { CLIMB_URI, SLACK_BOT_TOKEN, SLACK_CHANNEL_ID } from "../util/secrets";

export const getLeagues = async (req: Request, res: Response) => {
    const climbClient = new ClimbClient(CLIMB_URI);
    const leagues = await climbClient.getAllLeagues();

    const slackClient = new WebClient(SLACK_BOT_TOKEN);

    slackClient.chat.postMessage({
        channel: SLACK_CHANNEL_ID,
        text: leagues.map(l => `<${CLIMB_URI}/leagues/home/${l.id}|${l.name}>`).join("\n"),
    })
        .then(res => console.log("Message set: ", res))
        .catch(console.error);
};