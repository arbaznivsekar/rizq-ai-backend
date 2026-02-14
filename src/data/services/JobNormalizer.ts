// Lightweight HTML sanitizer to avoid external dependency
function sanitizeHtml(s?: string) {
  return s ? s.replace(/<[^>]*>/g, '') : s;
}
import { dataConfig } from '../../config/data.config.js';
import { JobDTO, RemoteType, SalaryPeriod, Seniority } from '../../types/job.types.js';

const titleSynonyms: Record<string,string> = {
  's/w eng': 'software engineer',
  'sde': 'software development engineer',
};

function toTitleCase(s: string) {
  return s.replace(/\s+/g,' ').trim().replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

function normalizeTitle(title: string): string {
  const t = title.toLowerCase().trim();
  for (const k of Object.keys(titleSynonyms)) {
    if (t.includes(k)) return toTitleCase(titleSynonyms[k]);
  }
  return toTitleCase(t);
}

function detectRemoteType(text: string): RemoteType {
  const t = text.toLowerCase();
  if (t.includes('remote')) return 'remote';
  if (t.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

function normalizeSeniority(title: string, description?: string): Seniority {
  const t = (title + ' ' + (description || '')).toLowerCase();
  if (/intern|graduate|junior|entry/.test(t)) return 'entry';
  if (/senior|sr\.|iii|principal/.test(t)) return 'senior';
  if (/lead/.test(t)) return 'lead';
  if (/director/.test(t)) return 'director';
  if (/(vp|vice president)/.test(t)) return 'vp';
  if (/c[o|t]o|ceo|cmo|cfo/.test(t)) return 'cxo';
  return 'mid';
}

function toAnnual(amount: number, period?: SalaryPeriod): number {
  switch (period) {
    case 'hour': return amount * 8 * 260;
    case 'day': return amount * 260;
    case 'month': return amount * 12;
    case 'year':
    default: return amount;
  }
}

export class JobNormalizer {
  normalize(input: JobDTO): JobDTO {
    const title = normalizeTitle(input.title);
    const location = {
      city: input.location.city?.trim(),
      state: input.location.state?.trim(),
      country: (input.location.country || dataConfig.defaultCountry).toUpperCase(),
      remoteType: input.location.remoteType || detectRemoteType([input.title, input.description || ''].join(' ')),
    };
    let sanitizedDescription = input.description ? sanitizeHtml(input.description) : undefined;
    let salary = input.salary;
    if (salary && (salary.min || salary.max)) {
      const minAnnual = salary.min ? toAnnual(salary.min, salary.period) : undefined;
      const maxAnnual = salary.max ? toAnnual(salary.max, salary.period) : undefined;
      salary = {
        ...salary,
        normalizedAnnualMin: minAnnual,
        normalizedAnnualMax: maxAnnual,
        normalizedCurrency: dataConfig.baseCurrency,
      };
    }
    const seniority = input.seniority && input.seniority !== 'unknown' ? input.seniority : normalizeSeniority(input.title, input.description);
    return { ...input, title, location, salary, seniority, rawHtml: undefined, description: sanitizedDescription ?? input.description };
  }
}


