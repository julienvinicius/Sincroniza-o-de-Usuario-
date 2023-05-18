export interface ITeknisaGetByCpf {
    error: boolean,
    message: string,
    data: ITeknisaCustomer[],
}

export interface ITeknisaCustomer {
    cpf: string,
    consumerName: string,
    updateDate: string,
    email: string,
    consumerBirthDate: string,
    addresses: ITeknisaCustomerAddress[],
    consumerGroups: ITeknisaCustomerConsumerGroups[],
    isActive: boolean,
    gender: string
}

interface ITeknisaCustomerAddress {
    identifier: string,
    description: string | null,
    zipCode: string | null,
    streetAddress: string | null,
    number: string | null,
    city: string | null,
    state: string | null,
    country: string | null,
    addressLine2: string | null,
    neighborhood: string | null,
    phone: string | null,
    cellphone: string | null,
    isPrincipal: boolean
}

interface ITeknisaCustomerConsumerGroups {
    clientCode: string,
    consumerType: string,
    consumerCode: string,
    costCenter: string,
    balanceValue: number,
    updateDate: string,
    typeDescription: string,
    isActive: boolean
}