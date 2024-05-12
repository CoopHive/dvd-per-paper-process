import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new Wallet(privateKey);
const provider = getDefaultProvider("http://127.0.0.1:8545");
const signer = wallet.connect(provider);
const db = new Database({ signer });

const prefix = "test_0";
const { meta: create } = await db
  .prepare(`CREATE TABLE ${prefix} (id integer primary key, val text);`)
  .run();
await create.txn?.wait();
const tableName = create.txn?.names[0] ?? "";

console.log("Table created: ", tableName);
