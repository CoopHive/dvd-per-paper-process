// third-party sdks
import {
  addExternalCid,
  createDraftNode,
  publishDraftNode,
  uploadFiles,
} from "@desci-labs/nodes-lib";
import {
  ResearchObjectComponentType,
  ResearchObjectComponentDocumentSubtype,
  ResearchObjectComponentDataSubtype,
  type ResearchField,
} from "@desci-labs/desci-models";
import type { ValuesType } from "@tableland/sdk";
import ethers from "ethers";
// node
import { spawn } from "child_process";
import fs from "fs";
// config
import {
  db,
  desciUuid,
  nodesSigner,
  tableName,
  type RunsSchema,
} from "./config.ts";

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

type RunSchemaKeys = keyof RunsSchema;
const tablelandInsert = async (
  table: string,
  data: Partial<Record<RunSchemaKeys, ValuesType>>
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
    if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");
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
const runMarker = async (cid: string, doi: string) => {
  process.env["WEB3_PRIVATE_KEY"] = process.env.COOPHIVE_PKEY;
  const commandBody = [
    "marker:v2.0.0",
    "-i",
    `ipfs="https://gateway.lighthouse.storage/ipfs"`,
    "-i",
    `cid="${cid}"`,
  ];

  const tsStart = Math.floor(new Date().getTime() / 1000);
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
      addr_job_creator: pubKey,
      doi,
    });

    throw new Error(`Job ${doi}, ${cid} failed: ${hiveRunOut}`);
  }

  // success
  const outIpfsMatch = hiveRunOut.match(
    /https:\/\/ipfs\.io\/ipfs\/(?<cid>[a-zA-Z0-9]+)/
  );
  const outIpfsUrl = outIpfsMatch?.[0];
  const outIpfsCid = outIpfsMatch?.groups?.cid;
  if (typeof outIpfsUrl !== "string" || typeof outIpfsCid !== "string") {
    throw new Error("IPFS URL not found in output");
  }

  const inIpfsMatch = commandBody
    .join(" ")
    .match(/input=\/inputs\/(?<cid>[a-zA-Z0-9]+)/);
  const inIpfsCid = inIpfsMatch?.groups?.cid;
  if (typeof inIpfsCid !== "string") {
    throw new Error("IPFS CID not found in input");
  }

  const dealId = hiveRunOut.match(/hive inspect (?<id>[a-zA-Z0-9]+)/)?.groups
    ?.id;
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
    result_ipfs_url: outIpfsUrl,
    status_code: 0,
    doi,
  };

  await tablelandInsert(tableName as string, {
    ...sharedMetadata,
    addr_solver: runInfo["Deal"]["Members"]["Solver"],
    addr_job_creator: pubKey,
    addr_resource_provider: runInfo["Deal"]["Members"]["ResourceProvider"],
    addr_mediator: runInfo["Deal"]["Members"]["Mediators"][0],
    instruction_count: runInfo["Result"]["InstructionCount"],
  });
  console.log("Job successfully saved to Tableland DB");

  await uploadJsonToDesci(desciUuid as string, `${tsStart}_${runUuid}`, {
    ...sharedMetadata,
    deal_data: runInfo,
  });
  console.log("Job successfully published to DeSci Nodes");

  return hiveRunOut;
};

const processPaper = async (pdfCid: string, doi: string) => {
  // convert pdf to markdown with marker

  // optional: chunk pdfs

  // generate embedding

  // upload embedding to vector db (name after doi)

  return;
};

async function makePaperNode(
  pdfCid: string,
  mdCid: string,
  doi: string,
  title: string,
  researchFields: ResearchField[]
) {
  // TODO make node metadata match paper metadata
  const {
    node: { uuid },
  } = await createDraftNode({
    title,
    defaultLicense: "CC-BY-4.0",
    researchFields,
  });
  console.log("uuid: ", uuid);

  await addExternalCid({
    uuid,
    contextPath: "/",
    componentType: ResearchObjectComponentType.PDF,
    componentSubtype: ResearchObjectComponentDocumentSubtype.RESEARCH_ARTICLE,
    externalCids: [{ cid: pdfCid, name: `${doi}.pdf` }],
  });
  await addExternalCid({
    uuid,
    contextPath: "/",
    componentType: ResearchObjectComponentType.DATA,
    componentSubtype: ResearchObjectComponentDataSubtype.PROCESSED_DATA,
    externalCids: [{ cid: mdCid, name: `${doi}.md` }],
  });

  await publishDraftNode(uuid, nodesSigner);
  console.log("Node published");
}
