export class SetDto {
    public readonly id: number;
    public readonly user1ID: string;
    public readonly user2ID: string;
    public readonly player1ID: number;
    public readonly player2ID: number;
    public readonly player1Name: string;
    public readonly player2Name: string;
    public readonly dueDate: Date;

    constructor(data: any) {
        this.id = data.id;
        this.user1ID = data.user1ID;
        this.user2ID = data.user2ID;
        this.player1ID = data.player1ID;
        this.player2ID = data.player2ID;
        this.player1Name = data.player1Name;
        this.player2Name = data.player2Name;
        this.dueDate = new Date(data.dueDate);
    }
}