import { JobModel } from '../models/Job.js';

export class JobIndexer {
  private ensured = false;

  async ensureIndexes() {
    if (this.ensured) return;
    await JobModel.createIndexes();
    this.ensured = true;
  }
}


