import axios from "axios";
import { League } from "./models/leagueDto";

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
                console.log(leagues);
            })
            .catch(console.error);

        return leagues;
    }
}