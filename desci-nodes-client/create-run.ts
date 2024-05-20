import {
  setApiKey,
  uploadFiles,
  publishDraftNode,
} from "@desci-labs/nodes-lib";
import { signerFromPkey } from "@desci-labs/nodes-lib/dist/util/signing";

if (!process.env.DESCI_API_KEY || !process.env.DESCI_PKEY) {
  throw new Error("DESCI_API_KEY and DESCI_PKEY must be set");
}

const main = async () => {
  setApiKey(process.env.DESCI_API_KEY as string);
  const nodesSigner = signerFromPkey(process.env.DESCI_PKEY as string);

  const [uuid, dataFile] = process.argv.slice(2);

  await uploadFiles({
    uuid,
    contextPath: "/runs",
    files: [dataFile],
  });

  await publishDraftNode(uuid, nodesSigner);
};

main();
