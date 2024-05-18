import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

export const prefix = "test_runs";
export const tableName = "test_runs_31337_2";
export const desciUuid = "SBOXWV_zGM8_lsGnG0GRQs6rXH6MVkCXb78-9IkBdLM";

export const desciNodeUuid = "JLJqlZn1XfE3iJgfG4TR8RZPRdSvI-0jXag9kvTZqBc";

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

const wallet = new Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const provider = getDefaultProvider("http://127.0.0.1:8545");
const signer = wallet.connect(provider);
export const db = new Database<RunsSchema>({ signer });
