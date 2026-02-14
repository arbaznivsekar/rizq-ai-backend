export interface DataConfig {
  baseCurrency: string;
  defaultCountry: string;
  dedupe: {
    fuzzyThreshold: number;
  };
  cache: {
    ttlSeconds: number;
    hotListTtlSeconds: number;
  };
  audit: {
    enabled: boolean;
  };
  pii: {
    enabled: boolean;
    redactedFields: string[];
  };
  batches: {
    maxBatchSize: number;
  };
  indexes: {
    ensureOnStart: boolean;
  };
}

export const dataConfig: DataConfig = {
  baseCurrency: process.env.DATA_BASE_CURRENCY || 'USD',
  defaultCountry: process.env.DATA_DEFAULT_COUNTRY || 'IN',
  dedupe: {
    fuzzyThreshold: Number(process.env.DATA_DEDUPE_FUZZY_THRESHOLD || 0.88),
  },
  cache: {
    ttlSeconds: Number(process.env.DATA_CACHE_TTL || 300),
    hotListTtlSeconds: Number(process.env.DATA_CACHE_HOT_TTL || 120),
  },
  audit: {
    enabled: process.env.DATA_AUDIT_ENABLED !== 'false',
  },
  pii: {
    enabled: process.env.DATA_PII_ENABLED === 'true',
    redactedFields: (process.env.DATA_PII_FIELDS || 'email,phone').split(',').map(s => s.trim()).filter(Boolean),
  },
  batches: {
    maxBatchSize: Number(process.env.DATA_MAX_BATCH || 500),
  },
  indexes: {
    ensureOnStart: process.env.DATA_INDEX_ENSURE !== 'false',
  },
};


