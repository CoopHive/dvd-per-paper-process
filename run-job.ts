import { tableName, db, desciUuid } from "./config.ts";
import { $ } from "bun";

const main = async () => {
  const commandBody = Bun.argv.slice(2);

  const tsStart = Math.floor(new Date().getTime() / 1000);
  const { stdout } = await $`hive run ${commandBody}`;
  const tsEnd = Math.floor(new Date().getTime() / 1000);
  const runUuid = crypto.randomUUID();

  // failure
  if (!stdout.includes("Results accepted.")) {
    await db
      .prepare(
        `INSERT INTO ${tableName} (uuid, ts_start, ts_end, command, status_code) VALUES (?, ?, ?, ?, ?);`
      )
      .bind(runUuid, tsStart, tsEnd, commandBody.join(" "), 1)
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
      `INSERT INTO ${tableName} (uuid, ts_start, ts_end, command, result_ipfs_url, status_code) VALUES (?, ?, ?, ?, ?, ?);`
    )
    .bind(runUuid, tsStart, tsEnd, commandBody.join(" "), ipfsUrl, 0)
    .run()
    .then(({ meta: insert }) => insert.txn?.wait());
  console.log("Job successfully saved to DB");

  try {
    Bun.write(
      `tmp/${tsStart}_${runUuid}.json`,
      JSON.stringify({
        run_uuid: runUuid,
        ts_start: tsStart,
        ts_end: tsEnd,
        command: commandBody.join(" "),
        result_ipfs_url: ipfsUrl,
      })
    );
    await $`tsx desci-nodes-client/create-run.ts ${desciUuid} tmp/${tsStart}_${runUuid}.json`;
    console.log("Job successfully published to DeSci Nodes");
  } finally {
    await $`rm tmp/${tsStart}_${runUuid}.json`;
  }
};

main();
