import { dataConfig } from '../../config/data.config.js';

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g;

export class PIIService {
  redact(text?: string): string | undefined {
    if (!dataConfig.pii.enabled || !text) return text;
    return text.replace(emailRegex, '[redacted-email]').replace(phoneRegex, '[redacted-phone]');
  }
}


