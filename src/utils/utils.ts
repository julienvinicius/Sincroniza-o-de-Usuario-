import { cpf } from "cpf-cnpj-validator";

export function containOnlyNumber(text: string) {
    return /^[0-9]*$/.test(text);
}

export function removeAll(text: string, searches: string[]) {
    var target = text;
    searches.map((search) => {
        target = target.split(search).join("");
    })
    return target;
  };

export function validateCpf(num: string){
  return cpf.isValid(num);
}

export function validateCnpj(num: string){
  return cpf.isValid(num);
}