import { JobModel } from "../../data/models/Job.js";
import { logger } from "../../config/logger.js";

export type UpsertResult = {
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  upsertedIds: string[];
};

export type ScrapedJobInput = {
  source: string;
  externalId?: string | null;
  canonicalUrl?: string | null;
  title: string;
  company: { name: string; domain?: string | null; companyId?: string | null };
  location: { city?: string; state?: string; country?: string; remoteType: 'onsite'|'hybrid'|'remote' };
  salary?: any;
  seniority?: string;
  description?: string;
  sanitizedDescription?: string;
  skills?: string[];
  benefits?: string[];
  postedAt: Date;
  expiresAt?: Date | null;
  applicationCount?: number;
  referralAvailable?: boolean;
  hash: string;
  compositeKey: string; // unique per job across sources
  audit?: { firstSeenAt: Date; lastSeenAt: Date; lastSource?: string };
};

export class ScrapedJobStore {
  public static async upsertMany(scrapedJobs: ScrapedJobInput[]): Promise<UpsertResult> {
    if (!scrapedJobs || scrapedJobs.length === 0) {
      return { insertedCount: 0, matchedCount: 0, modifiedCount: 0, upsertedIds: [] };
    }

    const now = new Date();
    const ops = scrapedJobs.map(j => {
      const audit = j.audit ?? { firstSeenAt: now, lastSeenAt: now, lastSource: j.source };
      return {
        updateOne: {
          filter: { compositeKey: j.compositeKey },
          update: {
            $setOnInsert: { audit: { ...audit, firstSeenAt: audit.firstSeenAt ?? now } },
            $set: {
              source: j.source,
              externalId: j.externalId ?? null,
              canonicalUrl: j.canonicalUrl ?? null,
              title: j.title,
              company: j.company,
              location: j.location,
              salary: j.salary,
              seniority: j.seniority ?? 'unknown',
              description: j.description,
              sanitizedDescription: j.sanitizedDescription,
              skills: j.skills ?? [],
              benefits: j.benefits ?? [],
              postedAt: j.postedAt,
              expiresAt: j.expiresAt ?? null,
              applicationCount: j.applicationCount,
              referralAvailable: j.referralAvailable,
              hash: j.hash,
              compositeKey: j.compositeKey,
              'audit.lastSeenAt': now,
              'audit.lastSource': j.source
            }
          },
          upsert: true
        }
      };
    });

    const bulk = await JobModel.bulkWrite(ops, { ordered: false });
    const upsertedIds = Object.values(bulk.upsertedIds ?? {}).map(v => String(v));
    const result = {
      insertedCount: upsertedIds.length,
      matchedCount: bulk.matchedCount ?? 0,
      modifiedCount: bulk.modifiedCount ?? 0,
      upsertedIds
    } as UpsertResult;
    logger.info(`ScrapedJobStore.upsertMany: inserted=${result.insertedCount} matched=${result.matchedCount} modified=${result.modifiedCount}`);
    return result;
  }
}


