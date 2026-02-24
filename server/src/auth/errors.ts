export class AuthError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
        this.code = code;
    }
}
