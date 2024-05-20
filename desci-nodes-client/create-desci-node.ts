import {
  createNewFolder,
  setApiKey,
  uploadFiles,
  publishDraftNode,
  createDraftNode,
} from "@desci-labs/nodes-lib";
import { signerFromPkey } from "@desci-labs/nodes-lib/dist/util/signing";

if (!process.env.DESCI_API_KEY || !process.env.DESCI_PKEY) {
  throw new Error("DESCI_API_KEY and DESCI_PKEY must be set");
}

const main = async () => {
  setApiKey(process.env.DESCI_API_KEY as string);
  const nodesSigner = signerFromPkey(process.env.DESCI_PKEY as string);

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
