# run data persister

1. Get [Bun](https://bun.sh/docs/installation)
2. Install dependencies: `bun i && cd desci-nodes-client && bun i`
3. Start local Tableland node: `bunx local-tableland`
4. `cp .env.example .env` and edit `TABLELAND_PKEY` to a valid private key for any account. Optionally edit `TABLELAND_TABLE_PREFIX` too to change the log table name
5. Create DB: `bun run create-db`
6. Edit `TABLELAND_TABLE_NAME` in `.env` to the table that was just created
7. Edit `DESCI_PKEY and DESCI_API_KEY` in `.env` to your [DeSci Nodes (dev network)](https://nodes-dev.desci.com) credentials. Make sure the account of `DESCI_PKEY` has some Sepolia testnet SepETH
8. Create DeSci node: `bun run create-desci-node`
9. Edit `DESCI_NODE_UUID` in `.env` to the node that was just created
10. Run job: e.g. `bun run run-job cowsay:v0.0.1 -i Message=moo`

Other docs:
- [Tableland CLI](https://docs.tableland.xyz/quickstarts/cli-quickstart#4-write-data)
- [Tableland SDK](https://docs.tableland.xyz/quickstarts/sdk-quickstart)
- [DeSci Labs nodes-lib](https://github.com/desci-labs/nodes/tree/develop/nodes-lib)
This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
