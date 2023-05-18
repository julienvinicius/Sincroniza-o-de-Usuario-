import { MongoClient } from 'mongodb';

const uri = `${process.env.CONNECTION_STRING}`;
const connectDB = new MongoClient(uri);

async function run(): Promise<any> {
  try {
    const connection = await connectDB.connect();
    return connection;
  } catch (error) {
    console.error(error);
  }
}

run()
  // .then((res) => console.log(res))
  .catch((error) => console.error(error));

export default connectDB;
