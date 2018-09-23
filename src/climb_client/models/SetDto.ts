export class SetDto {
    public readonly id: number;
    public readonly player1ID: number;
    public readonly player2ID: number;
    public readonly dueDate: Date;

    constructor(data: any) {
        this.id = data.id;
        this.player1ID = data.player1ID;
        this.player2ID = data.player2ID;
        this.dueDate = new Date(data.dueDate);
    }
}