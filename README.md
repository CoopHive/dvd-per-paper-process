# run data persister

1. Get [Bun](https://bun.sh/docs/installation)
2. Install dependencies: `bun i`
3. Start local Tableland node: `bunx local-tableland`
4. edit `privateKey` in `config.ts` to a valid private key for any account
5. Create db: `./create-db.ts`
6. edit `tableName` in `config.ts` to the table that was just created
7. Run job: e.g. `./run-job.ts cowsay:v0.0.1 -i Message=moo`

This project was created using `bun init` in bun v1.1.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
