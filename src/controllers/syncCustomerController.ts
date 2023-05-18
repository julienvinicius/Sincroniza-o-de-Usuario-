import { Request, Response } from "express";
import { ICustomer } from "../interfaces/customer";
import { syncTeknisa, saveCustomerMongo, mountCustomer, syncApp } from "../services/syncCustomerServices";


export async function syncCustomer(req: Request, res: Response) {
  const { cpfCnpj } = req.body;    
  // Monta obj padrão
  let mergedCustomer: ICustomer | null = {...mountCustomer(), id: cpfCnpj};
  //syncroniza teknisa
  const mergeTeknisa = await syncTeknisa(mergedCustomer);
  mergedCustomer = mergeTeknisa || mergedCustomer;
  //syncroniza App alphacode
  const mergeApp = await syncApp(mergedCustomer);
  mergedCustomer = mergeApp || mergeTeknisa;

  try {
    //salva no mongo
    if(mergedCustomer) {
      const saveResult = await saveCustomerMongo(mergedCustomer, cpfCnpj);
      res.status(201).json({
        syncedCustomer: saveResult
      })
    } else {
      res.status(404).json({
        error: true,
        message: "Cliente não encontrado em nenhuma fonte"
      })
    }
  } catch (error: any) {
    res.status(500).json({
      error: true,
      message: error.message
    })
  }
}

export async function syncManyCustomers(req: Request, res: Response) {
  const { cpfCnpj } = req.body;
  let syncedCustomers:  any[] = [];
  let syncedCustomersResult:  any[] = [];
  let syncCustomersNotFound:  any[] = [];
  let syncCustomersErrors:  any[] = [];

  Promise.all(
    cpfCnpj.map(async (document: string) => {
      // Monta obj padrão
      let mergedCustomer: ICustomer | null = {...mountCustomer(), id: document};
      //syncroniza teknisa
      const mergeTeknisa = await syncTeknisa(mergedCustomer);
      mergedCustomer = mergeTeknisa || mergedCustomer;
      //syncroniza App alphacode
      const mergeApp = await syncApp(mergedCustomer);
      mergedCustomer = mergeApp || mergeTeknisa;

      try {
        //salva no mongo
        if(mergedCustomer) {
          const saveResult = await saveCustomerMongo(mergedCustomer, document);
          syncedCustomersResult.push(mergedCustomer);
          syncedCustomers.push(document);
        } else {
          syncCustomersNotFound.push(document);
        }
      } catch (error: any) {
        syncCustomersErrors.push(document)
      }
    })
  ).then(() => {
    res.status(syncedCustomersResult.length > 0? 201 : 200).json({
      syncedCustomers,
      syncCustomersNotFound,
      invalidDocuments: req.body.invalidCpfCnpj,
      syncCustomersErrors,
      syncedCustomersResult
    })
  }).catch((error) => {
    res.status(500).json({
      receivedCustomers: cpfCnpj,
      invalidDocuments: req.body.invalidCpfCnpj,
      error: true,
      message: "Falha na execução da sincronização de clientes"
    })
  })
}
