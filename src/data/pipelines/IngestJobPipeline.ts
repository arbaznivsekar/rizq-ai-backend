import { JobDTO } from '../../types/job.types.js';
import { JobValidator } from '../services/JobValidator.js';
import { JobNormalizer } from '../services/JobNormalizer.js';
import { JobDeduplicator } from '../services/JobDeduplicator.js';
import { JobEnricher } from '../services/JobEnricher.js';
import { JobIndexer } from '../services/JobIndexer.js';
import { CacheService } from '../services/CacheService.js';
import { AuditService } from '../services/AuditService.js';
import { PIIService } from '../services/PIIService.js';
import { JobRepository } from '../repositories/JobRepository.js';

export class IngestJobPipeline {
  private validator = new JobValidator();
  private normalizer = new JobNormalizer();
  private deduper = new JobDeduplicator();
  private enricher = new JobEnricher();
  private indexer = new JobIndexer();
  private cache = new CacheService();
  private audit = new AuditService();
  private jobRepo = new JobRepository();
  private pii = new PIIService();

  async process(input: JobDTO) {
    const v = this.validator.validate(input);
    if (!v.ok) {
      throw Object.assign(new Error('validation_failed'), { details: v.errors });
    }
    let job = this.normalizer.normalize(input);
    // PII redaction on description
    job.description = this.pii.redact(job.description);

    const hash = this.deduper.buildHash(job);
    const compositeKey = this.deduper.compositeKey(job, hash);
    const now = new Date();

    const toPersist: any = {
      ...job,
      hash,
      compositeKey,
      audit: { firstSeenAt: now, lastSeenAt: now, lastSource: job.source },
      sanitizedDescription: job.description,
      postedAt: new Date(job.postedAt),
      ...(job.expiresAt ? { expiresAt: new Date(job.expiresAt) } : {}),
    };

    // Enrichment
    job = this.enricher.enrich(job);
    toPersist.skills = job.skills;
    toPersist.benefits = job.benefits;

    // Ensure indexes (no-op after first)
    await this.indexer.ensureIndexes();

    // Upsert
    const res = await this.jobRepo.upsertByCompositeKey(toPersist);

    // Cache warm
    await this.cache.warmHotLists({ source: job.source, location: job.location, skills: job.skills });

    // Audit
    await this.audit.append({ jobId: res.doc._id, action: res.created ? 'create' : 'update', source: job.source, diff: res.updatedFields });

    return { compositeKey, upsertedId: res.doc._id, deduped: !res.created, updatedFields: res.updatedFields };
  }
}


