import Job from "../../models/Job.js";
import { RawJob, scrapeListingPage } from "./crawler.js";

export type NormalizedJob = {
  source: string;
  externalId?: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string[];
  url: string;
  postedAt?: Date;
};

export function normalize(raw: RawJob): NormalizedJob | null {
  if (!raw.title || !raw.url) return null;
  return {
    source: raw.source,
    externalId: raw.externalId,
    title: raw.title,
    company: raw.company,
    location: raw.location,
    description: raw.description,
    requirements: [],
    url: raw.url,
    postedAt: raw.postedAt ? new Date(raw.postedAt) : undefined,
  };
}

export async function upsertJobs(jobs: NormalizedJob[]) {
  const ops = jobs.map((j) => ({
    updateOne: {
      filter: { source: j.source, url: j.url },
      update: { $set: j },
      upsert: true,
    },
  }));
  if (ops.length === 0) return { upserted: 0 };
  const res = await Job.bulkWrite(ops, { ordered: false });
  return { upserted: (res.upsertedCount || 0) + (res.modifiedCount || 0) };
}

export async function crawlAndStore(source: string, url: string) {
  const raws = await scrapeListingPage(source, url);
  const normalized = raws.map(normalize).filter(Boolean) as NormalizedJob[];
  return upsertJobs(normalized);
}


