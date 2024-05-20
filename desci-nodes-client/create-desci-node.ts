import {
  createNewFolder,
  setApiKey,
  uploadFiles,
  publishDraftNode,
  createDraftNode,
} from "@desci-labs/nodes-lib";
import { signerFromPkey } from "@desci-labs/nodes-lib/dist/util/signing";

const main = async () => {
  setApiKey("qlGutU1RHtejpmlzYx2s6jbmJqZVdfTS7pMF2WMogbg=");
  const nodesSigner = signerFromPkey(
    "0x9602eb5f82003cd0faa5eef377b6d417a84a1ab04f6ecc55ea0e13dd134c96de"
  );

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
