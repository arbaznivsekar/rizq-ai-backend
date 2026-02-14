import crypto from 'crypto';
import { JobDTO } from '../../types/job.types.js';

function normalizeUrl(u?: string | null): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    url.search = '';
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    return url.toString();
  } catch {
    return u;
  }
}

export class JobDeduplicator {
  buildHash(input: JobDTO): string {
    const keyBase = [
      (input.title || '').toLowerCase(),
      (input.company?.name || '').toLowerCase(),
      (input.location?.city || '').toLowerCase(),
      (input.location?.country || '').toLowerCase(),
      (input.description || '').substring(0, 300).toLowerCase(),
    ].join('|');
    return crypto.createHash('sha256').update(keyBase).digest('hex');
  }

  compositeKey(input: JobDTO, hash: string): string {
    if (input.source && input.externalId) return `${input.source}:${input.externalId}`;
    const canon = normalizeUrl(input.canonicalUrl || undefined);
    if (canon) return `${input.source}:${canon}`;
    return `${input.source}:${hash}`;
  }
}


