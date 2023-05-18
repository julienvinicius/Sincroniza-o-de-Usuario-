export interface ILogError {
    date: Date,
    message: string,
    error: IError,
}

interface IError {
    name: any,
    message: any,
    stack: any,
}