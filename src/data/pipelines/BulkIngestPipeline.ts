import pLimit from 'p-limit';
import { IngestJobPipeline } from './IngestJobPipeline.js';
import { JobDTO } from '../../types/job.types.js';
import { dataConfig } from '../../config/data.config.js';

export class BulkIngestPipeline {
  private ingest = new IngestJobPipeline();

  async process(stream: JobDTO[]) {
    const limit = pLimit(8);
    const results: any[] = [];
    let success = 0, failed = 0;
    const tasks = stream.slice(0, dataConfig.batches.maxBatchSize).map(item => limit(async () => {
      try {
        const r = await this.ingest.process(item);
        results.push(r);
        success++;
      } catch (e: any) {
        results.push({ error: e?.message || 'error', details: e?.details });
        failed++;
      }
    }));
    await Promise.all(tasks);
    return { success, failed, results };
  }
}


