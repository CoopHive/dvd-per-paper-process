# run data persister

## Dev
1. Install dependencies: `npm i`
2. Start local Tableland node: `npx local-tableland`
3. `cp .env.example .env` and edit `TABLELAND_PKEY` to a valid private key for any account. Optionally edit `TABLELAND_TABLE_PREFIX` too to change the log table name
4. Create DB: `npm run create-db`
5. Edit `TABLELAND_TABLE_NAME` in `.env` to the table that was just created
6. Edit `DESCI_PKEY and DESCI_API_KEY` in `.env` to your [DeSci Nodes (dev network)](https://nodes-dev.desci.com) credentials. Make sure the account of `DESCI_PKEY` has some Sepolia testnet SepETH
7. Edit `res/metadata.json` to appropriate node-level metadata for the Desci node.
8. Create DeSci node: `npm run create-node`
9. Edit `DESCI_NODE_UUID` in `.env` to the node that was just created
10. Run job: e.g. `npm run run-job cowsay:v0.0.1 -i Message=moo`

## Prod
1. Change `TABLELAND_NETWORK` in `.env` to a real [provider](https://docs.tableland.xyz/validator/) (e.g. [Alchemy](https://www.alchemy.com/) or [QuickNode](https://www.quicknode.com/)) for the [chain](https://docs.tableland.xyz/fundamentals/supported-chains) you want to index on.
2. Change `DESCI_SERVER` in `.env` to `"prod"`
3. Change `DESCI_PKEY` and `TABLELAND_PKEY` to mainnet private keys. Change `DESCI_API_KEY` to a [mainnet](https://nodes.desci.com) API key.

Note: `run-job.ts` and `create-desci-node.ts` *must* be run with Node.js, not Bun or Deno, because `nodes-lib` depends on the Node.js filesystem API to upload files. `bun run run-job` is fine because `run-job` is defined as `tsx --env-file=.env run-job.ts` in `package.json`, but `bun run run-job.ts` won't work.

Other docs:
- [Tableland CLI](https://docs.tableland.xyz/quickstarts/cli-quickstart#4-write-data)
- [Tableland SDK](https://docs.tableland.xyz/quickstarts/sdk-quickstart)
- [DeSci Labs nodes-lib](https://github.com/desci-labs/nodes/tree/develop/nodes-lib)

This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
