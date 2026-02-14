import { connectMongo } from "../src/db/mongo.js";
import { JobModel } from "../src/data/models/Job.js";
import { env } from "../src/config/env.js";

async function main() {
  await connectMongo();
  await JobModel.createIndexes();
  // eslint-disable-next-line no-console
  console.log("Indexes ensured on Job collection.");
  process.exit(0);
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error("ensure-indexes failed", err);
  process.exit(1);
});


