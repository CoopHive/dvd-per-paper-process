import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers-6";
import { signerFromPkey } from "@desci-labs/nodes-lib/dist/util/signing";
import {
  NODESLIB_CONFIGS,
  setApiKey,
  setNodesLibConfig,
} from "@desci-labs/nodes-lib";

const missingEnvVars = [
  "TABLELAND_PKEY",
  "TABLELAND_NETWORK",
  "TABLELAND_TABLE_PREFIX",
  "TABLELAND_TABLE_NAME",
  "DESCI_NODE_UUID",
  "DESCI_API_KEY",
  "DESCI_PKEY",
  "DESCI_SERVER",
  "COOPHIVE_PKEY",
].filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length) {
  throw new Error(
    `Missing environment variables: ${missingEnvVars.join(", ")}`
  );
}

if (
  !process.env.DESCI_SERVER ||
  !["dev", "prod", "local", "staging"].includes(process.env.DESCI_SERVER)
) {
  throw new Error("DESCI_SERVER must be 'dev', 'prod', 'local', or 'staging'");
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
  instruction_count: number;
  addr_resource_provider: string;
  addr_mediator: string;
  addr_solver: string;
}

const wallet = new Wallet(process.env.TABLELAND_PKEY as string);
const provider = getDefaultProvider(process.env.TABLELAND_NETWORK as string);
const signer = wallet.connect(provider);
export const db = new Database<RunsSchema>({ signer });

setApiKey(process.env.DESCI_API_KEY as string);
setNodesLibConfig(
  NODESLIB_CONFIGS[
    process.env.DESCI_SERVER as "dev" | "prod" | "local" | "staging"
  ]
);
export const nodesSigner = signerFromPkey(process.env.DESCI_PKEY as string);
