import { JobIndexer } from '../services/JobIndexer.js';

export class IndexEnsureTask {
  private indexer = new JobIndexer();
  async run() {
    await this.indexer.ensureIndexes();
  }
}


