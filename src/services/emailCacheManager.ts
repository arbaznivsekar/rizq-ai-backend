import { CompanyEmailCacheModel } from '../data/models/CompanyEmailCache.js';
import { logger } from '../config/logger.js';

function normalizeName(name?: string) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export class EmailCacheManager {
  async getCachedEmails(company: { name?: string; domain?: string }) {
    const normalized_name = normalizeName(company.name);
    const now = new Date();
    const query: any = {
      $or: [
        company.domain ? { company_domain: company.domain.toLowerCase() } : null,
        normalized_name ? { normalized_name } : null,
        company.name ? { company_name: company.name } : null,
      ].filter(Boolean),
      $and: [
        { $or: [ { 'cache_metadata.expires_at': { $exists: false } }, { 'cache_metadata.expires_at': { $gt: now } } ] }
      ]
    };
    const doc = await CompanyEmailCacheModel.findOne(query).lean();
    if (!doc) return { hit: false };
    await CompanyEmailCacheModel.updateOne({ _id: (doc as any)._id }, { $inc: { 'cache_metadata.cache_hits': 1 }, $set: { 'cache_metadata.last_accessed': new Date() } });
    return { hit: true, doc };
  }

  async cacheEmailResults(company: { name: string; domain?: string }, emails: Array<{ email: string; role?: string; confidence_score?: number; source?: string }>, meta?: { responseMs?: number; credits?: number; search_query?: string }) {
    const normalized_name = normalizeName(company.name);
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const unique = new Map<string, any>();
    for (const e of emails) {
      if (!e.email) continue;
      unique.set(e.email.toLowerCase(), {
        email: e.email.toLowerCase(),
        role: (e.role as any) || 'unknown',
        confidence_score: Math.max(0, Math.min(100, e.confidence_score ?? 0)),
        source: e.source || 'hunter.io',
        discovered_at: new Date(),
        status: 'unverified'
      });
    }
    const setDoc: any = {
      company_name: company.name,
      company_domain: company.domain?.toLowerCase(),
      normalized_name,
      emails: Array.from(unique.values()),
      'hunter_metadata.credits_consumed': meta?.credits ?? 0,
      'hunter_metadata.search_query': meta?.search_query,
      'hunter_metadata.api_response_time': meta?.responseMs,
      'cache_metadata.updated_at': new Date(),
      'cache_metadata.created_at': new Date(),
      'cache_metadata.expires_at': expires,
    };
    const res = await CompanyEmailCacheModel.updateOne(
      { $or: [ { company_domain: setDoc.company_domain }, { normalized_name } ].filter(Boolean) },
      { $set: setDoc, $setOnInsert: { 'cache_metadata.cache_hits': 0 } },
      { upsert: true }
    );
    logger.info(`Cached ${unique.size} emails for ${company.name}`);
    return res;
  }
}


