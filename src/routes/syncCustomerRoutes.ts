import { Router } from 'express';
import * as syncCustomer from '../controllers/syncCustomerController';
import { validateCpfCnpj, validateManyCpfCnpj } from '../middlewares/validateCpfCnpj.middleware';

const routerSincCustomer = Router();

// Referente ao usuário
// Talvez mudar pra pt depois 
routerSincCustomer.post('/sync-customer', validateCpfCnpj, syncCustomer.syncCustomer);
routerSincCustomer.post('/sync-customer/many', validateManyCpfCnpj, syncCustomer.syncManyCustomers);

export default routerSincCustomer;
