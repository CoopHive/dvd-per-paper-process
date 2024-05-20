import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

const missingEnvVars = [
  "TABLELAND_PKEY",
  "TABLELAND_NETWORK",
  "TABLELAND_TABLE_PREFIX",
  "TABLELAND_TABLE_NAME",
  "DESCI_NODE_UUID",
].filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length) {
  throw new Error(
    `Missing environment variables: ${missingEnvVars.join(", ")}`
  );
}

export const prefix = process.env.TABLELAND_TABLE_PREFIX;
export const tableName = process.env.TABLELAND_TABLE_NAME;
export const desciUuid = process.env.DESCI_NODE_UUID;

export interface RunsSchema {
  id: number;
  ts_start: number;
  ts_end: number;
  command: string;
  result_ipfs_url: string;
  addr_resource_provider: string;
  addr_mediator: string;
  addr_solver: string;
}

const wallet = new Wallet(process.env.TABLELAND_PKEY as string);
const provider = getDefaultProvider(process.env.TABLELAND_NETWORK as string);
const signer = wallet.connect(provider);
export const db = new Database<RunsSchema>({ signer });
