#!/usr/bin/env bun
import { $ } from "bun";

import { tableName, db } from "./config.ts";

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
