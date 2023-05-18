export interface ICustomerAddress {
    identificador: string,
    descricao: string | null,
    cep: string | null,
    enderecoRua: string | null,
    numero: string | null,
    cidade: string | null,
    estado: string | null,
    pais: string | null,
    enderecoRua2: string | null,
    bairro: string | null,
    telefone: string | null,
    celular: string | null,
    principal: boolean
}

export interface ICustomerType {
    tipo: string,
}

export interface ICustomer {
    id: string,
    nome: string,
    email: string,
    telefone: string,
    dataNascimento: string | null,
    tipo: ICustomerType[],
    dataUltimaAtualizacao?: number,
    dataCriacao?: number,
    endereco: ICustomerAddress[],
    fidelidade: boolean,
    clienteApp: boolean,
}