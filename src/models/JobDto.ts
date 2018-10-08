import { Job } from "node-schedule";
import schedule from "node-schedule";

export class JobDto {
    public readonly name: string;
    public readonly nextDate: Date;
    public readonly pending: number;

    constructor(job: Job) {
        this.name = job.name;
        this.nextDate = job.nextInvocation();
        this.pending = job.pendingInvocations.length;
    }

    static getJobs(): JobDto[] {
        const jobDtos = new Array<JobDto>();
        for (const key in schedule.scheduledJobs) {
            const job = schedule.scheduledJobs[key];
            jobDtos.push(new JobDto(job));
        }
        return jobDtos;
    }
}