import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

export const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const wallet = new Wallet(privateKey);
export const provider = getDefaultProvider("http://127.0.0.1:8545");
export const signer = wallet.connect(provider);

export const prefix = "test_runs";
export const tableName = "test_runs_31337_4";

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
export const db = new Database<RunsSchema>({ signer });
