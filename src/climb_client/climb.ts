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
            })
            .catch(logger.error);

        return sets;
    }
}