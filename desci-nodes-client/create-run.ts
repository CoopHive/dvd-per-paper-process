import {
  setApiKey,
  uploadFiles,
  publishDraftNode,
} from "@desci-labs/nodes-lib";
import { signerFromPkey } from "@desci-labs/nodes-lib/dist/util/signing";

const main = async () => {
  setApiKey("qlGutU1RHtejpmlzYx2s6jbmJqZVdfTS7pMF2WMogbg=");
  const nodesSigner = signerFromPkey(
    "0x9602eb5f82003cd0faa5eef377b6d417a84a1ab04f6ecc55ea0e13dd134c96de"
  );

  const [uuid, dataFile] = process.argv.slice(2);

  await uploadFiles({
    uuid,
    contextPath: "/runs",
    files: [dataFile],
  });

  await publishDraftNode(uuid, nodesSigner);
};

main();
