import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { JobModel } from '../src/data/models/Job.js';
import { ScrapedJobStore } from '../src/scraping/store/ScrapedJobStore.js';

describe('ScrapedJobStore.upsertMany', () => {
  const store = new Map<string, any>();

  beforeAll(async () => {
    vi.spyOn(JobModel as any, 'bulkWrite').mockImplementation(async (...args: unknown[]) => {
      const ops = (args[0] as any[]) || [];
      const upsertedIds: Record<number, string> = {};
      let matchedCount = 0;
      let modifiedCount = 0;
      ops.forEach((op, idx) => {
        const filterKey = op.updateOne.filter.compositeKey as string;
        const $set = op.updateOne.update.$set || {};
        const $setOnInsert = op.updateOne.update.$setOnInsert || {};
        const existing = store.get(filterKey);
        if (existing) {
          matchedCount += 1;
          store.set(filterKey, { ...existing, ...$set, audit: { ...(existing.audit||{}), ...($set.audit||{}), lastSeenAt: $set['audit.lastSeenAt'] || existing.audit?.lastSeenAt, lastSource: $set['audit.lastSource'] || existing.audit?.lastSource } });
          modifiedCount += 1;
        } else {
          const doc = { ...$setOnInsert, ...$set };
          store.set(filterKey, doc);
          upsertedIds[idx] = `${idx}`;
        }
      });
      return { upsertedIds, matchedCount, modifiedCount } as any;
    });

    vi.spyOn(JobModel as any, 'findOne').mockImplementation(async (...args: unknown[]) => {
      const q = (args[0] as any) || {};
      const doc = store.get(q.compositeKey);
      if (!doc) return null;
      return {
        ...doc,
        audit: {
          ...doc.audit,
          lastSeenAt: doc.audit?.lastSeenAt ? new Date(doc.audit.lastSeenAt) : new Date(),
        }
      };
    });
  });

  it('is idempotent on compositeKey and updates lastSeenAt', async () => {
    const compositeKey = `test:source:12345`;
    const first = {
      source: 'test',
      externalId: '12345',
      canonicalUrl: 'https://example.com/job/12345',
      title: 'Test Engineer',
      company: { name: 'Acme' },
      location: { remoteType: 'remote' as const },
      postedAt: new Date('2024-01-01T00:00:00Z'),
      hash: 'h1',
      compositeKey,
    };

    const r1 = await ScrapedJobStore.upsertMany([first]);
    expect(r1.insertedCount).toBe(1);

    const pre = await JobModel.findOne({ compositeKey });
    expect(pre).toBeTruthy();
    const lastSeen1 = pre!.audit.lastSeenAt;

    const second = { ...first, title: 'Senior Test Engineer', hash: 'h2' };
    const r2 = await ScrapedJobStore.upsertMany([second]);
    expect(r2.insertedCount).toBe(0);

    const post = await JobModel.findOne({ compositeKey });
    expect(post!.title).toBe('Senior Test Engineer');
    expect(post!.audit.lastSeenAt.getTime()).toBeGreaterThanOrEqual(lastSeen1.getTime());
  });

  afterAll(async () => {
    store.clear();
    vi.restoreAllMocks();
  });
});


