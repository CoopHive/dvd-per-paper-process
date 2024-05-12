import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

// configurable
const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new Wallet(privateKey);
const provider = getDefaultProvider("http://127.0.0.1:8545");
const signer = wallet.connect(provider);
const prefix = "test_runs";

// body
interface RunsSchema {
  id: number;
  ts_start: number;
  ts_end: number;
  command: string;
  result_ipfs_url: string;
  addr_resource_provider: string;
  addr_mediator: string;
  addr_solver: string;
}
const db = new Database<RunsSchema>({ signer });

const { meta: create } = await db
  .prepare(
    `CREATE TABLE ${prefix} (
      id INTEGER PRIMARY KEY,
      status_code INTEGER DEFAULT 2,
      ts_start INTEGER NOT NULL,
      ts_end INTEGER,

      command TEXT NOT NULL,
      result_ipfs_url TEXT,
      addr_resource_provider TEXT,
      addr_mediator TEXT,
      addr_solver TEXT
    );`
  )
  .run();
await create.txn?.wait();
const tableName = create.txn?.names[0] ?? "";

console.log("Table created: ", tableName);
