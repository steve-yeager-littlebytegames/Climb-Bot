import axios from "axios";
import { League } from "./models/leagueDto";
import { SetDto } from "./models/SetDto";
import logger from "../util/logger";

export class ClimbClient {
    readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    async getAllLeagues(): Promise<League[] | null> {
        logger.info("Getting all leagues.");

        let leagues;

        await axios.get(this.url + "/api/v1/leagues")
            .then(response => {
                leagues = <League[]>response.data;
                logger.info(`Got ${leagues.length} leagues.`);
            })
            .catch(error => {
                logger.error("Couldn't get list of leagues.");
            });

        return leagues;
    }

    async getSets(leagueID: number, dueDate: Date): Promise<SetDto[] | null> {
        logger.info(`Getting sets for league ${leagueID} with due date ${dueDate}.`);

        const sets = Array<SetDto>();

        await axios.get(this.url + "/api/v1/leagues/sets", {
            params: {
                leagueID: leagueID,
                dueDate: dueDate,
            }
        })
            .then(response => {
                for (let i = 0; i < response.data.length; i++) {
                    sets.push(new SetDto(response.data[i]));
                }

                logger.info(`Got ${sets.length} sets.`);
            })
            .catch(error => {
                logger.error("Failed to load sets.");
            });

        return sets;
    }
}