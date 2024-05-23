// third-party sdks
import {
  publishDraftNode,
  setApiKey,
  uploadFiles,
} from "@desci-labs/nodes-lib";
import { signerFromPkey } from "@desci-labs/nodes-lib/dist/util/signing";
// node
import { spawn } from "child_process";
import fs from "fs";
// config
import { db, desciUuid, tableName } from "./config.ts";

if (!process.env.DESCI_API_KEY || !process.env.DESCI_PKEY) {
  throw new Error("DESCI_API_KEY and DESCI_PKEY must be set");
}
setApiKey(process.env.DESCI_API_KEY as string);
const nodesSigner = signerFromPkey(process.env.DESCI_PKEY as string);

// util
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

const uploadJsonToDesci = async (
  nodeUuid: string,
  fileName: string,
  data: any
) => {
  try {
    fs.writeFileSync(`tmp/${fileName}.json`, JSON.stringify(data));

    await uploadFiles({
      uuid: nodeUuid,
      contextPath: "/runs",
      files: [`tmp/${fileName}.json`],
    });

    await publishDraftNode(nodeUuid, nodesSigner);
  } finally {
    await fs.rmSync(`tmp/${fileName}.json`);
  }
};

// main
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

  await uploadJsonToDesci(desciUuid as string, `${tsStart}_${runUuid}`, {
    ts_start: tsStart,
    ts_end: tsEnd,
    command: commandBody.join(" "),
    result_ipfs_url: ipfsUrl,
  });
  console.log("Job successfully published to DeSci Nodes");
};

main();
