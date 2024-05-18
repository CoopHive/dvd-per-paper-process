import { tableName, db } from "./config.ts";
import { spawn } from "child_process";

const sh = (command: string, args: string[]) => {
  const child = spawn(command, args);
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (data) => {
    process.stdout.write(data);
    stdout += data.toString();
  });
  child.stderr.on("data", (data) => {
    process.stderr.write(data);
    stderr += data.toString();
  });

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
};

const main = async () => {
  const commandBody = process.argv.slice(2);

  const tsStart = Math.floor(new Date().getTime() / 1000);
  const { stdout } = await sh("hive", ["run", ...commandBody]);
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
};
main();
