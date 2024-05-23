import {
  createNewFolder,
  uploadFiles,
  publishDraftNode,
  createDraftNode,
} from "@desci-labs/nodes-lib";

import { nodesSigner } from "./config";

const main = async () => {
  const {
    node: { uuid },
  } = await createDraftNode({
    title: "CoopHive Runs Test 3",
    defaultLicense: "CC-BY-4.0",
    researchFields: ["Computer Science"],
  });
  console.log("uuid: ", uuid);

  await uploadFiles({
    uuid,
    contextPath: "/",
    files: [`res/metadata.json`],
  });
  await createNewFolder({
    uuid,
    contextPath: "/",
    newFolderName: "runs",
  });

  await publishDraftNode(uuid, nodesSigner);
  console.log("Node published");
};

main();
