require('dotenv').config();
import express,{ Request,Response } from 'express';
import routerSincCustomer from './routes/syncCustomerRoutes';

const app = express();

app.use(express.urlencoded({extended: false}));

app.use(express.json());

app.get(`/`, (req: Request, res: Response) => {
    res.json({message: `Server running. Pong.`});
});

app.use(routerSincCustomer);

app.listen(process.env.SERVER_PORT, () => console.log(`App running on ${process.env.SERVER_PORT}`));
