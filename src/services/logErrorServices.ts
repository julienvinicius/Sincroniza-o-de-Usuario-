import { ILogError } from "../interfaces/logError";
import conn from '../database/connectDB';

export async function saveLogError(message: string, error: any, date?: Date) {
    try {
        await conn.db().collection<ILogError>('erros').insertOne({
            message,
            date: new Date(),
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },

        });
    } catch (error) {
        //Se não salvo o erro chora né
        //dev.chorar();
        console.log("Erro ao salvar erro")
    }
    return;
}