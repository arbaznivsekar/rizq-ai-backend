import { IngestJobPipeline } from './IngestJobPipeline.js';
import { BulkIngestPipeline } from './BulkIngestPipeline.js';
// @ts-ignore
import type { JobDTO } from '../../types/job.types';

const single = new IngestJobPipeline();
const bulk = new BulkIngestPipeline();

export async function ingestJob(job: JobDTO) {
  return single.process(job);
}

export async function ingestBulk(jobs: JobDTO[]) {
  return bulk.process(jobs);
}


