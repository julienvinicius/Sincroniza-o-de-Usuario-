export interface IAlphaCodeClientAuth {
    statusCode: number;
    status: string;
    body: IAlphaCodeClientAuthBody;
}

export interface IAlphaCodeClientAuthBody {
    access_token: string;
    expiration: number;
}

export interface IAlphaCodeGetClient {
    externalId: string,
    shortId: number,
    name: string,
    email: string,
    phone: string,
    document: string,
    birthdate: string | null,
    adresses: IAlphaCodeGetClientAddress[],
    fidelity: false,
    status: string,
    date: string
}

export interface IAlphaCodeGetClientAddress {
    clientId: number,
    streetName: string,
    streetNumber: string,
    neighborhood: string,
    city: string,
    state: string,
    postalCode: string,
    country: string
}

export interface IAlphacCodeToken {
    access_token: string,
    expiration: number,
    createdAt: number,
    expired: boolean
}