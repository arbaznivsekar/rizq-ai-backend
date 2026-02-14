import { JobDTO, ValidationResult } from '../../types/job.types.js';

export class JobValidator {
  validate(input: JobDTO): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    if (!input.title || !input.title.trim()) errors.push({ code: 'TITLE_REQUIRED', message: 'title required', field: 'title' });
    if (!input.company || !input.company.name) errors.push({ code: 'COMPANY_REQUIRED', message: 'company.name required', field: 'company.name' });
    if (!input.location || (!input.location.country && !input.location.remoteType)) errors.push({ code: 'LOCATION_REQUIRED', message: 'location.country or remoteType required', field: 'location' });
    if (!input.postedAt) errors.push({ code: 'POSTED_AT_REQUIRED', message: 'postedAt required', field: 'postedAt' });
    if (input.salary && input.salary.min && input.salary.max && input.salary.min > input.salary.max) errors.push({ code: 'SALARY_RANGE_INVALID', message: 'salary min > max', field: 'salary' });
    if (input.postedAt && new Date(input.postedAt) > new Date()) errors.push({ code: 'POSTED_AT_FUTURE', message: 'postedAt in future', field: 'postedAt' });
    if (input.expiresAt && input.postedAt && new Date(input.expiresAt) < new Date(input.postedAt)) errors.push({ code: 'EXPIRES_AT_LT_POSTED', message: 'expiresAt < postedAt', field: 'expiresAt' });
    return { ok: errors.length === 0, errors: errors.length ? errors : undefined };
  }
}


