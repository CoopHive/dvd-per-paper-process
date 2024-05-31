// third-party sdks
import { publishDraftNode, uploadFiles } from "@desci-labs/nodes-lib";
import ethers from "ethers";
// node
import { spawn } from "child_process";
import fs from "fs";
// config
import { db, desciUuid, nodesSigner, tableName } from "./config.ts";
import type { ValuesType } from "@tableland/sdk";

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

const tablelandInsert = async (
  table: string,
  data: Record<string, ValuesType>
) => {
  await db
    .prepare(
      `INSERT INTO ${table} (${Object.keys(data).join(
        ", "
      )}) VALUES (${Object.keys(data)
        .map(() => "?")
        .join(", ")});`
    )
    .bind(...Object.values(data))
    .run()
    .then(({ meta: insert }) => insert.txn?.wait());
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
  process.env["WEB3_PRIVATE_KEY"] = process.env.COOPHIVE_PKEY;
  const { stdout: hiveRunOut } = await sh("hive", ["run", ...commandBody]);
  const tsEnd = Math.floor(new Date().getTime() / 1000);
  const runUuid = crypto.randomUUID();
  const pubKey = ethers.utils.computePublicKey(
    process.env.COOPHIVE_PKEY as string
  );

  // failure
  if (!hiveRunOut.includes("Results accepted.")) {
    /*
    await db
      .prepare(
        `INSERT INTO ${tableName} 
        (uuid, ts_start, ts_end, command, status_code, addr_requester) 
        VALUES (?, ?, ?, ?, ?, ?);`
      )
      .bind(runUuid, tsStart, tsEnd, commandBody.join(" "), 1, pubKey)
      .run()
      .then(({ meta: insert }) => insert.txn?.wait());
    */
    await tablelandInsert(tableName as string, {
      uuid: runUuid,
      ts_start: tsStart,
      ts_end: tsEnd,
      command: commandBody.join(" "),
      status_code: 1,
      addr_requester: pubKey,
    });
    throw new Error("Job failed");
  }

  // success
  const ipfsUrl = hiveRunOut.match(
    /https:\/\/ipfs\.io\/ipfs\/[a-zA-Z0-9]+/
  )?.[0];
  if (typeof ipfsUrl !== "string") {
    throw new Error("IPFS URL not found");
  }

  const dealId = hiveRunOut.match(/hive inspect (?<cid>[a-zA-Z0-9]+)/)?.groups
    ?.cid;
  if (typeof dealId !== "string") {
    throw new Error("Deal ID not found");
  }

  const { stdout: hiveInspectOut } = await sh("hive", ["inspect", dealId]);
  const inspectOutLines = hiveInspectOut.split("\n");
  const lastLine = inspectOutLines[inspectOutLines.length - 2];
  const runInfo = JSON.parse(lastLine);

  /*
  await db
    .prepare(
      `INSERT INTO ${tableName} 
      (uuid, ts_start, ts_end, command, result_ipfs_url, status_code, 
        addr_requester, addr_resource_provider, addr_mediator, addr_solver) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
    )
    .bind(
      runUuid,
      tsStart,
      tsEnd,
      commandBody.join(" "),
      ipfsUrl,
      0,
      pubKey,
      runInfo["Members"]["ResourceProvider"],
      runInfo["Members"]["Mediators"][0], // TODO change table schema to fit SharedStructsDeal
      runInfo["Members"]["Solver"]
    )
    .run()
    .then(({ meta: insert }) => insert.txn?.wait());
  */

  await tablelandInsert(tableName as string, {
    uuid: runUuid,
    ts_start: tsStart,
    ts_end: tsEnd,
    command: commandBody.join(" "),
    result_ipfs_url: ipfsUrl,
    status_code: 0,
    addr_requester: pubKey,
    addr_resource_provider: runInfo["Members"]["ResourceProvider"],
    addr_mediator: runInfo["Members"]["Mediators"][0],
    addr_solver: runInfo["Members"]["Solver"],
  });

  console.log("Job successfully saved to DB");
  await uploadJsonToDesci(desciUuid as string, `${tsStart}_${runUuid}`, {
    ts_start: tsStart,
    ts_end: tsEnd,
    command: commandBody.join(" "),
    result_ipfs_url: ipfsUrl,
    dealData: runInfo,
  });
  console.log("Job successfully published to DeSci Nodes");
};

main();
