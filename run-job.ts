#!/usr/bin/env bun
import { $ } from "bun";

import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

// configurable
const privateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const provider = getDefaultProvider("http://127.0.0.1:8545");
const tableName = "test_runs_31337_3";

// body
interface RunsSchema {
  id: number;
  status_code: number;
  ts_start: number;
  ts_end: number;

  command: string;
  result_ipfs_url: string;
  addr_resource_provider: string;
  addr_mediator: string;
  addr_solver: string;
}

const wallet = new Wallet(privateKey);
const signer = wallet.connect(provider);
const db = new Database<RunsSchema>({ signer });
const commandBody = Bun.argv.slice(2);

const tsStart = Math.floor(new Date().getTime() / 1000);
const { stderr, stdout } = await $`hive run ${commandBody}`;
const tsEnd = Math.floor(new Date().getTime() / 1000);

// failure
if (!stdout.includes("Results accepted.")) {
  await db
    .prepare(
      `INSERT INTO ${tableName} (ts_start, ts_end, command, status_code) VALUES (?, ?, ?, ?);`
    )
    .bind(tsStart, tsEnd, commandBody, 1)
    .run()
    .then(({ meta: insert }) => insert.txn?.wait());
  throw new Error("Job failed");
}

// success
const ipfsUrl = stdout
  .toString()
  .match(/https:\/\/ipfs\.io\/ipfs\/[a-zA-Z0-9]+/g)?.[0];
if (typeof ipfsUrl !== "string") {
  throw new Error("IPFS URL not found");
}

await db
  .prepare(
    `INSERT INTO ${tableName} (ts_start, ts_end, command, result_ipfs_url, status_code) VALUES (?, ?, ?, ?, ?);`
  )
  .bind(tsStart, tsEnd, commandBody.join(" "), ipfsUrl, 0)
  .run()
  .then(({ meta: insert }) => insert.txn?.wait());
console.log("Job successfully saved to DB");
