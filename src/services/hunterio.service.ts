import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { redis } from '../db/redis.js';

type HunterDomainSearch = {
  data?: {
    domain: string;
    emails: Array<{
      value: string;
      first_name?: string;
      last_name?: string;
      position?: string;
      department?: string;
      seniority?: string;
      confidence?: number;
      source?: string;
    }>;
  };
  meta?: { params?: any };
};

export class HunterIOService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: 'https://api.hunter.io/v2', timeout: 10000 });
  }

  private roleFromDepartment(dep?: string, position?: string): 'recruiter'|'hr'|'talent_acquisition'|'hiring_manager'|'unknown' {
    const text = `${dep || ''} ${position || ''}`.toLowerCase();
    if (/talent|acquisition/.test(text)) return 'talent_acquisition';
    if (/recruit|talent/.test(text)) return 'recruiter';
    if (/human\s*resources|hr/.test(text)) return 'hr';
    if (/hiring|manager/.test(text)) return 'hiring_manager';
    return 'unknown';
  }

  private async cacheGet(key: string) {
    if (!redis) return null;
    const v = await redis.get(key);
    return v ? JSON.parse(v) : null;
  }

  private async cacheSet(key: string, value: any, ttlSec = 3600) {
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
  }

  async discoverCompanyEmails(companyName: string, domain?: string) {
    const d = (domain || '').toLowerCase();
    const cacheKey = `hunter:domain:${d || companyName.toLowerCase()}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) return { fromCache: true, ...cached };

    if (!env.HUNTER_API_KEY) {
      logger.warn('HUNTER_API_KEY not set');
      return { fromCache: false, domain: d, emails: [], credits: 0, responseMs: 0 };
    }

    const start = Date.now();
    try {
      const params: any = { api_key: env.HUNTER_API_KEY };
      if (d) params.domain = d;
      else params.company = companyName;
      const res = await this.client.get<HunterDomainSearch>('/domain-search', { params });
      const responseMs = Date.now() - start;
      type HunterEmail = NonNullable<HunterDomainSearch['data']>['emails'][number];
      const rawEmails = (res.data.data?.emails ?? []) as HunterEmail[];
      const emails = rawEmails.map((record: HunterEmail) => ({
        email: record.value,
        role: this.roleFromDepartment(record.department, record.position),
        confidence_score: Math.round((record.confidence ?? 0) * 100),
        source: 'hunter.io',
        discovered_at: new Date(),
        status: 'unverified' as const,
      }));
      const out = { domain: res.data.data?.domain || d, emails, credits: 1, responseMs };
      await this.cacheSet(cacheKey, out, 60 * 15);
      return { fromCache: false, ...out };
    } catch (err: any) {
      logger.warn(`Hunter.io error: ${err?.response?.status} ${err?.message}`);
      return { fromCache: false, domain: d, emails: [], credits: 0, responseMs: Date.now() - start };
    }
  }
}


