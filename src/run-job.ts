// third-party sdks
import { publishDraftNode, uploadFiles } from "@desci-labs/nodes-lib";
import type { ValuesType } from "@tableland/sdk";
import ethers from "ethers";
// node
import { spawn } from "child_process";
import fs from "fs";
// config
import { db, desciUuid, nodesSigner, tableName } from "./config.ts";

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
    fs.writeFileSync(
      `tmp/${fileName}.json`,
      JSON.stringify(data, undefined, 2)
    );
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

  const sharedMetadata = {
    uuid: runUuid,
    ts_start: tsStart,
    ts_end: tsEnd,
    command: commandBody.join(" "),
    result_ipfs_url: ipfsUrl,
    status_code: 0,
  };

  await tablelandInsert(tableName as string, {
    ...sharedMetadata,
    addr_requester: pubKey,
    addr_resource_provider: runInfo["Members"]["ResourceProvider"],
    addr_mediator: runInfo["Members"]["Mediators"][0],
    addr_solver: runInfo["Members"]["Solver"],
  });

  console.log("Job successfully saved to DB");
  await uploadJsonToDesci(desciUuid as string, `${tsStart}_${runUuid}`, {
    ...sharedMetadata,
    result_ipfs_url: ipfsUrl,
    deal_data: runInfo,
  });
  console.log("Job successfully published to DeSci Nodes");
};

main();
