import axios from "axios";
import { League } from "./models/leagueDto";
import { SetDto } from "./models/SetDto";
import logger from "../util/logger";

export class ClimbClient {
    readonly url: string;

    constructor(url: string) {
        this.url = url;
    }

    async getAllLeagues(): Promise<League[]> {
        let leagues;

        await axios.get(this.url + "/api/v1/leagues")
            .then(response => {
                leagues = <League[]>response.data;
            })
            .catch(logger.error);

        return leagues;
    }

    async getSets(leagueID: number, dueDate: Date): Promise<SetDto[]> {
        let sets;

        await axios.get(this.url + "/api/v1/leagues/sets", {
            params: {
                leagueID: leagueID,
                dueDate: dueDate,
            }
        })
            .then(response => {
                sets = <SetDto[]>response.data;
            })
            .catch(logger.error);

        return sets;
    }
}