export class League {
    public readonly id: number;
    public readonly gameID: number;
    public readonly organizationID: number | null;
    public readonly name: string;
    public readonly setsTillRank: number;
    public readonly dateCreated: Date;
    public readonly adminID: number;
    public readonly activeSeasonID: number | null;
}