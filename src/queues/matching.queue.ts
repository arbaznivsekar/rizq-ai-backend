import { matchingQueue } from "./index.js";
export async function enqueueMatching(userId: string) {
await matchingQueue.add("compute-matches", { userId }, { attempts: 3 });
return { enqueued: true };
}

