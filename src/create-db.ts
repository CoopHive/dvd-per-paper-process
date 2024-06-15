import { prefix, db } from "./config.ts";

const main = async () => {
  const { meta: create } = await db
    .prepare(
      `CREATE TABLE ${prefix} (
      id INTEGER PRIMARY KEY,
      uuid TEXT NOT NULL,
      status_code INTEGER DEFAULT 2,
      ts_start INTEGER NOT NULL,
      ts_end INTEGER,

      command TEXT NOT NULL,
      result_ipfs_url TEXT,
      instruction_count INTEGER,
      addr_solver TEXT,
      addr_job_creator TEXT,
      addr_resource_provider TEXT,
      addr_mediator TEXT
      );`
    )
    .run();

  await create.txn?.wait();
  const tableName = create.txn?.names[0] ?? "";
  console.log("Table created: ", tableName);
};

main();
