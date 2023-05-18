import { ILogError } from "../interfaces/logError";
import conn from '../database/connectDB';
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { IAlphacCodeToken, IAlphaCodeClientAuth } from "../interfaces/alphaCode";
import { Filter, UpdateFilter } from "mongodb";
import { saveLogError } from "./logErrorServices";

async function saveAlphaCodeToken(alphaCodeToken: IAlphacCodeToken) {
  try {
    const filter: Filter<IAlphacCodeToken> = { expired: false };
    const updateDoc: UpdateFilter<IAlphacCodeToken> = {
      $set : {
        expired: true
      }
    };
    const updateResult = await conn.db().collection<IAlphacCodeToken>('alphaCodeToken').updateMany(filter,updateDoc);
  } catch (error) {
    console.log("Error trying to update external api token")
  }
  try {
    const insertResult = await conn.db().collection<IAlphacCodeToken>('alphaCodeToken').insertOne(alphaCodeToken);
    return insertResult;
  } catch (error) {
    console.log("Error trying to save new external api token");
    throw new Error("Error retrieving token from external api");
  }
}

async function getAlphaCodeToken() {
  try {
    const config: AxiosRequestConfig = {};
    const getAplhaCodeToken = await axios.post<any, AxiosResponse<IAlphaCodeClientAuth>, any>(
      `${process.env.ALPHACODE_URL!}/clients/auth`,
      {
        "clientId": process.env.ALPHACODE_CLIENT_ID,
        "clientSecret": process.env.ALPHACODE_CLIENT_SECRET
      },
      config
    );
    
    return getAplhaCodeToken.data.body;
  } catch (error) {
    // Loga erro
    console.log("Error retrieving token from external api");
    throw new Error("Error retrieving token from external api");
  }
}

export async function getValidToken() {
  try {
    const filter: Filter<IAlphacCodeToken> = { expired: false };
    const result = await conn.db().collection<IAlphacCodeToken>('alphaCodeToken').findOne(filter);
    if(result && (Date.now() < (result!.createdAt + result!.expiration))){
      return result;
    } else {
      const newToken = await getAlphaCodeToken();
      if(newToken) {
        await saveAlphaCodeToken({ 
          ...newToken!,
          expired: false,
          createdAt: Date.now()
        });
        return newToken;
      }
    }
  } catch (error) {
    saveLogError(`getValidToken has thrown an error.`, error);
    throw error;
  }
}