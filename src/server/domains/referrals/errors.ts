export class ReferralWorkflowError extends Error {
    status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = "ReferralWorkflowError";
        this.status = status;
    }
}