import { ICustomer, ICustomerAddress, ICustomerType } from '../interfaces/customer';
import conn from '../database/connectDB';
import { Db, Filter, UpdateFilter } from "mongodb";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import * as https from 'https';
import { ITeknisaCustomer, ITeknisaGetByCpf } from "../interfaces/teknisa";
import { saveLogError } from './logErrorServices';
import { IAlphaCodeClientAuth, IAlphaCodeGetClient } from '../interfaces/alphaCode';
import { getValidToken } from './alphaCodeTokenServices';


export function mountCustomer() {
    const plainCustomer: ICustomer = {
        id: "",
        nome: "",
        email: "",
        telefone: "",
        dataNascimento: "",
        tipo: [],
        endereco: [],
        fidelidade: false,
        clienteApp: false,
    }
    return plainCustomer;
}

export async function getCustomerFromTeknisa(cpfCnpj: string) {
  try {
    const config: AxiosRequestConfig = {
      /* httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }), */
    };
    const sendToTeknisa = await axios.post<any, AxiosResponse<ITeknisaGetByCpf>, any>(
        `${process.env.TECNIZA_URL!}/consumer/getByCpf`,
        { "cpf": cpfCnpj },
        config
      );

    if(sendToTeknisa.data.data.length > 1) {
        // Loga erro
        saveLogError(
          `getCustomerFromTeknisa has thrown an error, id(${cpfCnpj}).`,
          { message: "Multiple customers returned from the same id(CPF/CNPJ)" }
          );
        console.log("Multiple customers returned from the same id(CPF/CNPJ)");
    }
    
    return sendToTeknisa.data.data[0];
  } catch (error) {
    // Loga erro
    /* saveLogError(`getCustomerFromTeknisa has thrown an error, id(${cpfCnpj}).`, error); */
    console.log("Error retrieving customer from teknisa");
    throw error;
  }
}

export function findTeknisaCustomerPhone(teknisaCustomer: ITeknisaCustomer) {
  const principalAddress = teknisaCustomer.addresses.find((address) => address.isPrincipal);
  if(principalAddress){
    return principalAddress.cellphone? principalAddress.cellphone : "";
  } else {
    const otherAddress = teknisaCustomer.addresses.find((address) => (address.phone != "" && address.phone != null));
    if(otherAddress){
      return otherAddress.cellphone? otherAddress.cellphone : "";
    }
  }
  return "";
}

export function getTeknisaAddresses(teknisaCustomer: ITeknisaCustomer) {
  let customerAddresses: ICustomerAddress[] = [];

  teknisaCustomer.addresses.forEach((teknisaAddress) => {
    if(teknisaAddress.zipCode || teknisaAddress.streetAddress) {
      customerAddresses.push({
        identificador: teknisaAddress.identifier,
        descricao: teknisaAddress.description,
        cep: teknisaAddress.zipCode,
        enderecoRua: teknisaAddress.streetAddress,
        numero: teknisaAddress.number,
        cidade: teknisaAddress.city,
        estado: teknisaAddress.state,
        pais: teknisaAddress.country,
        enderecoRua2: teknisaAddress.addressLine2,
        bairro: teknisaAddress.neighborhood,
        telefone: teknisaAddress.phone,
        celular: teknisaAddress.cellphone,
        principal: teknisaAddress.isPrincipal,
      });
    }
  })
  
  return customerAddresses;
}

export function getTeknisaCustomerTypes(teknisaCustomer: ITeknisaCustomer) {
  let customerTypes: ICustomerType[] = [];
  teknisaCustomer.consumerGroups.map((group) => {
    if(customerTypes.find((fType) => fType.tipo === group.clientCode)){
      return;
    } else {
      customerTypes.push({ tipo: group.clientCode});
    }
  })

  if(customerTypes.length > 0) {
    return customerTypes;
  }
  
  //Loga erro, cliente sem nehum tipo
  saveLogError(`getTeknisaCustomerTypes has thrown an error, id(${teknisaCustomer.cpf}).`, { message: "customer have no type."});
  return [];
}

export function mergeTeknisaCustomerIntoICustomer(teknisaCustomer: ITeknisaCustomer, iCustomer : ICustomer) {
    const mergedCustomer : ICustomer = {
        id: teknisaCustomer.cpf,
        nome: teknisaCustomer.consumerName,
        email: teknisaCustomer.email,
        telefone: findTeknisaCustomerPhone(teknisaCustomer),
        dataNascimento: teknisaCustomer.consumerBirthDate,
        tipo: getTeknisaCustomerTypes(teknisaCustomer),
        endereco: getTeknisaAddresses(teknisaCustomer),
        fidelidade: false,
        clienteApp: false,
    }

    return mergedCustomer;
}

export async function syncTeknisa(customer: ICustomer) {
  //Puxa da teknisa
  try {
    const customerTek = await getCustomerFromTeknisa(customer.id);
    return mergeTeknisaCustomerIntoICustomer(customerTek, customer);
  } catch (error) {
    saveLogError(`syncTeknisa has thrown an error, id(${customer.id}).`, error);
    return null;
  }
}

export async function getCustomerFromApp(cpfCnpj: string) {
  
  try {
    const alphaCodeToken = await getValidToken();
    let aplhaCodeCustomer: IAlphaCodeGetClient | undefined;
    const config: AxiosRequestConfig = {
      /* withCredentials: true, */
      headers: { Authorization: `Bearer ${alphaCodeToken?.access_token}` }
    };

    //Puxa token
    const getAplhaCodeCustomer = await axios.get<any, AxiosResponse<IAlphaCodeGetClient>, any>(
      `${process.env.ALPHACODE_URL!}/clients/GetClient/${cpfCnpj}`,
      config
    );
    aplhaCodeCustomer = getAplhaCodeCustomer.data;
    return aplhaCodeCustomer;
  } catch (error) {
    /* saveLogError(`getCustomerFromApp has thrown an error, id(${cpfCnpj}).`, error); */
    console.log("Error retrieving customer from alphacode");
    throw error;
  }
}

/**
 * Prioritize one field over the others
 * 
 * @param fieldValues feed the values as lowest to highest priority
 * @return {T}
 * return the highest priority value if it is valid
 */
 export function prioritizeValue<T>(fieldValues: T[]): T{
  let returnIndex = fieldValues.length - 1;
  
  fieldValues.forEach((value, index) => {
    if(value) {
      returnIndex = index;
    }
  });

  return fieldValues[returnIndex];
}

export function mergeCustomerAddresses(iCustomer : ICustomer, alphaCodeCustomer: IAlphaCodeGetClient) {
  let mergedAddresses: ICustomerAddress[] = [];

  if(alphaCodeCustomer.adresses.length < 1) {
    return iCustomer.endereco;
  }
  
  iCustomer.endereco.forEach((customerAddress) => {
    const duplicatedAddress = alphaCodeCustomer.adresses.find((alphaCodeAddress) => {
        return (customerAddress.cep === alphaCodeAddress.postalCode &&
        customerAddress.numero === alphaCodeAddress.streetNumber)
    });

    if(duplicatedAddress) {
      //Endereço duplicado e atualizado
      mergedAddresses.push({
        identificador: customerAddress.identificador,
        descricao: customerAddress.descricao,
        cep: prioritizeValue<string | null>([customerAddress.cep, duplicatedAddress.postalCode]),
        enderecoRua: prioritizeValue<string | null>([customerAddress.enderecoRua, duplicatedAddress.streetName]),
        numero: prioritizeValue<string | null>([customerAddress.numero, duplicatedAddress.streetNumber]),
        cidade: prioritizeValue<string | null>([customerAddress.cidade, duplicatedAddress.city]),
        estado: prioritizeValue<string | null>([customerAddress.estado, duplicatedAddress.state]),
        pais: prioritizeValue<string | null>([customerAddress.pais, duplicatedAddress.country]),
        enderecoRua2: customerAddress.enderecoRua2,
        bairro: prioritizeValue<string | null>([customerAddress.bairro, duplicatedAddress.neighborhood]),
        telefone: customerAddress.telefone,
        celular: customerAddress.celular,
        principal: customerAddress.principal,
      });
    } else {
      //Endereço sem atualização
      mergedAddresses.push(customerAddress);
    }
  })

  alphaCodeCustomer.adresses.forEach((alphaCodeAddress) => {
    const duplicatedAddress = iCustomer.endereco.find((customerAddress) => {
        return (customerAddress.cep === alphaCodeAddress.postalCode &&
        customerAddress.numero === alphaCodeAddress.streetNumber)
    });
    //Se não existe ainda e contem CEP ou rua
    if(!duplicatedAddress && (alphaCodeAddress.postalCode || alphaCodeAddress.streetName)) {
      //Novo endereço
      mergedAddresses.push({
        identificador: "",
        descricao: "",
        cep: alphaCodeAddress.postalCode,
        enderecoRua: alphaCodeAddress.streetName,
        numero: alphaCodeAddress.streetNumber,
        cidade: alphaCodeAddress.city,
        estado: alphaCodeAddress.state,
        pais: alphaCodeAddress.country,
        enderecoRua2: "",
        bairro: alphaCodeAddress.neighborhood,
        telefone: "",
        celular: "",
        principal: false,
      });
    }
  });
    
  return mergedAddresses;
}

export function mergeAlphaCodeCustomerIntoICustomer(alphaCodeCustomer: IAlphaCodeGetClient, iCustomer : ICustomer) {
  const mergedCustomer : ICustomer = {
      id: prioritizeValue<string>([iCustomer.id, alphaCodeCustomer.document]),
      nome: prioritizeValue<string>([iCustomer.nome, alphaCodeCustomer.name]),
      email: prioritizeValue<string>([iCustomer.email, alphaCodeCustomer.email]),
      telefone: prioritizeValue<string>([iCustomer.telefone, alphaCodeCustomer.phone]),
      dataNascimento: prioritizeValue<string | null>([iCustomer.dataNascimento, alphaCodeCustomer.birthdate]),
      tipo: iCustomer.tipo,
      endereco: mergeCustomerAddresses(iCustomer, alphaCodeCustomer),
      fidelidade: alphaCodeCustomer.fidelity,
      clienteApp: alphaCodeCustomer.status === "Ativo",
  }

  return mergedCustomer;
}

export async function syncApp(customer: ICustomer) {
  //Puxa do app
  try {
    const customerApp = await getCustomerFromApp(customer.id);
    return mergeAlphaCodeCustomerIntoICustomer(customerApp, customer);
  } catch (error) {
    saveLogError(`syncApp has thrown an error, id(${customer.id}).`, error);
    return null;
  }
}

export async function getCustomerFromMongo(cpfCnpj: string) {
  const customerMongo = await conn.db().collection<ICustomer>('clientes').findOne({ id: cpfCnpj });
  return customerMongo;
}

export async function saveCustomerMongo(customer: ICustomer, cpfCnpj: string) {
  try {
      let result = null;
      const existCustomer = await getCustomerFromMongo(cpfCnpj);
      if(existCustomer) {
          const filter: Filter<ICustomer> = { id : cpfCnpj };
          const updateDoc: UpdateFilter<ICustomer> = {
            $set : {
              id: cpfCnpj,
              nome: customer.nome,
              email: customer.email,
              telefone: customer.telefone,
              dataNascimento: customer.dataNascimento,
              tipo: customer.tipo,
              dataUltimaAtualizacao: Date.now(),
              endereco: customer.endereco,
              fidelidade: customer.fidelidade,
              clienteApp: customer.clienteApp,
            }
          };
          result = await conn.db().collection<ICustomer>('clientes').findOneAndUpdate(filter, updateDoc);

      } else {
        result = await conn.db().collection<ICustomer>('clientes').insertOne({
          ...customer,
          dataUltimaAtualizacao: Date.now(),
          dataCriacao: Date.now()
        })
      }

      return await getCustomerFromMongo(cpfCnpj);
  } catch (error) {
    //Loga erro
    console.log("Erro ao salvar cliente na base de dados");
    saveLogError(`saveCustomerMongo has thrown an error, id(${customer.id}).`, error);
    throw new Error("Erro ao salvar cliente na base de dados");
  }
}