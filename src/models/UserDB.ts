class UserMap {
    public readonly slack: string;
    public readonly climb: string;

    constructor(slack: string, climb: string) {
        this.slack = slack;
        this.climb = climb;
    }
}

export class UserDB {
    private readonly users: UserMap[];

    constructor() {
        this.users = new Array<UserMap>();
    }

    public getSlackID(climbID: string): string | undefined {
        const user = this.users.find(u => u.climb == climbID);
        if (user) {
            return `<@${user.slack}>`;
        }

        return undefined;
    }

    public count(): number {
        return this.users.length;
    }

    public static Create(data: any): UserDB {
        const userDB = new UserDB();
        for (let i = 0; i < data.users.length; i++) {
            const userData = data.users[i];
            const user = new UserMap(userData.slack, userData.climb);
            userDB.users.push(user);
        }

        return userDB;
    }
}