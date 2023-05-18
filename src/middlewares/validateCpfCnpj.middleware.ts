import { Request, Response } from "express";
import { containOnlyNumber, removeAll, validateCnpj, validateCpf } from "../utils/utils";


export async function validateCpfCnpj(req: Request, res: Response, next: any) {
  let validateCpfCnpj: string = req.body.cpfCnpj;
  
  if(!validateCpfCnpj) {
    res.status(400).json({
      error: true,
      message: "O cpfCnpj não foi informado"
    })
  }

  validateCpfCnpj = removeAll(validateCpfCnpj,[".","-","/"]);

  if(
    containOnlyNumber(validateCpfCnpj) 
    && (validateCpf(validateCpfCnpj)
    || validateCnpj(validateCpfCnpj))) {
    req.body.cpfCnpj = validateCpfCnpj;
    next();
  } else {
    res.status(400).json({
      error: true,
      message: "CPF/CNPJ em formato invalido"
    })
  }
}

export async function validateManyCpfCnpj(req: Request, res: Response, next: any) {
  let validateManyCpfCnpj: string[] | undefined = req.body.cpfCnpj;
  
  if(!validateManyCpfCnpj || validateManyCpfCnpj.length < 1) {
    res.status(400).json({
      error: true,
      message: "Nenhum cpfCnpj foi informado"
    })
  }

  let validCpfCnpj: string[] = [];
  let invalidCpfCnpj: string[] = [];
  
  validateManyCpfCnpj!.forEach((validateCpfCnpj) => {
    validateCpfCnpj = removeAll(validateCpfCnpj,[".","-","/"]);
    if(
      containOnlyNumber(validateCpfCnpj) 
      && (validateCpf(validateCpfCnpj)
      || validateCnpj(validateCpfCnpj))) {
        validCpfCnpj.push(validateCpfCnpj);
    } else {
      invalidCpfCnpj.push(validateCpfCnpj);
    }
  })

  if(validCpfCnpj.length < 1) {
    res.status(400).json({
      error: true,
      message: "todos CPF/CNPJ informados estão em formato inválido"
    })
  } else {
    req.body.cpfCnpj = validCpfCnpj;
    req.body.invalidCpfCnpj = invalidCpfCnpj;
    next();
  }
}
