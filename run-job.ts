#!/usr/bin/env bun
import { $ } from "bun";

const { stdout, stderr } = await $`hive run ${Bun.argv.slice(2)}`;

Bun.write("stdout", stdout);
Bun.write("stderr", stderr);

if (!stdout.includes("Results accepted.")) {
  throw new Error("Job failed");
}

const ipfsUrl = stdout
  .toString()
  .match(/https:\/\/ipfs\.io\/ipfs\/[a-zA-Z0-9]+/g)?.[0];

console.log("IPFS URL: ", ipfsUrl);
