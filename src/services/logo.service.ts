import { logger } from '../config/logger.js';
import axios from 'axios';

function extractDomain(input?: string | null): string | undefined {
  if (!input) return undefined;
  try {
    const url = input.startsWith('http') ? new URL(input) : new URL(`https://${input}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export class LogoService {
  private readonly SOURCE_DOMAINS = new Set([
    'naukri.com',
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monsterindia.com',
    'timesjobs.com'
  ]);

  private isSourceDomain(domain?: string): boolean {
    if (!domain) return false;
    const d = domain.toLowerCase();
    return Array.from(this.SOURCE_DOMAINS).some(s => d === s || d.endsWith(`.${s}`));
  }

  // Normalize company name for alias lookup
  private normalizeName(name?: string | null): string | undefined {
    if (!name) return undefined;
    const cleaned = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
      .replace(/\b(private|pvt|limited|ltd|llp|inc|corp|corporation|co|company|solutions|technologies|technology|india|global)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || undefined;
  }

  // Alias map: normalized name -> canonical domain
  private readonly ALIAS_MAP: Record<string, string> = {
    // Indian IT majors
    'tcs': 'tcs.com',
    'tata consultancy services': 'tcs.com',
    'infosys': 'infosys.com',
    'wipro': 'wipro.com',
    'hcl': 'hcltech.com',
    'hcl technologies': 'hcltech.com',
    'tech mahindra': 'techmahindra.com',
    'cognizant': 'cognizant.com',
    'capgemini': 'capgemini.com',
    'mindtree': 'mindtree.com',
    'larsen toubro infotech': 'ltimindtree.com',

    // Global tech
    'ibm': 'ibm.com',
    'google': 'google.com',
    'alphabet': 'abc.xyz',
    'microsoft': 'microsoft.com',
    'amazon': 'amazon.com',
    'meta': 'meta.com',
    'facebook': 'meta.com',
    'oracle': 'oracle.com',
    'sap': 'sap.com',
    'salesforce': 'salesforce.com',
    'adobe': 'adobe.com',
    'nvidia': 'nvidia.com',
    'intel': 'intel.com',
    'apple': 'apple.com',

    // Consulting
    'accenture': 'accenture.com',
    'deloitte': 'deloitte.com',
    'ey': 'ey.com',
    'pwc': 'pwc.com',
    'kpmg': 'kpmg.com',

    // Indian product/SaaS
    'zoho': 'zoho.com',
    'paytm': 'paytm.com',
    'flipkart': 'flipkart.com',
    'ola': 'olacabs.com',
    'swiggy': 'swiggy.com',
    'zomato': 'zomato.com',
    'phonepe': 'phonepe.com',

    // Recently detected from DB
    'national payments corporation of india npci': 'npci.org.in',
    'npci': 'npci.org.in',
    'perfios software solutions': 'perfios.com',
    'perfios': 'perfios.com',
    
    'amd': 'amd.com',
    'merkle b2b': 'merkle.com',
    'fynd shopsense retail technologies ltd': 'fynd.com',
    'fynd': 'fynd.com',
    'quantinsti quantitative learning': 'quantinsti.com',
    'quantinsti': 'quantinsti.com',
    'star union dai ichi life insurance sud life': 'sudlife.in',
    'sud life': 'sudlife.in',
    'bureau veritas consumer products services': 'bureauveritas.com',
    'bureau veritas': 'bureauveritas.com',
    
    // From current DB scan (variants included to survive normalization)
    'e plus technologies': 'eplustechnologies.com',
    'e plus': 'eplustechnologies.com',
    
    'advanced micro devices': 'amd.com',
    'people staffing solutions': 'peoplestaffing.in',
    'people staffing': 'peoplestaffing.in',
    'rearck': 'rearck.com',
    'prl developers': 'prldevelopers.com',
    'double ticks': 'doubleticks.com',
    'datavista solutions': 'datavistasolutions.com',
    'datavista': 'datavistasolutions.com',
  };
  /** Try to resolve domain via Clearbit suggest (no auth) */
  private async resolveDomainFromClearbit(company?: string | null): Promise<string | undefined> {
    if (!company) return undefined;
    try {
      const resp = await axios.get('https://autocomplete.clearbit.com/v1/companies/suggest', {
        params: { query: company },
        timeout: 5000
      });
      const items = Array.isArray(resp.data) ? resp.data : [];
      const domain = items[0]?.domain as string | undefined;
      return domain ? domain.replace(/^www\./, '') : undefined;
    } catch (error) {
      logger.debug('Clearbit suggest failed', { company, error: (error as any)?.message });
      return undefined;
    }
  }

  /** Builds a best-effort domain and logo URL using provider + favicon as fallback */
  public async resolve(company?: string | null, url?: string | null, existingDomain?: string | null): Promise<{ companyDomain?: string; logoUrl?: string }> {
    // Prefer existing domain if provided
    let domain = existingDomain || extractDomain(url || undefined);

    // Ignore source/listing domains (e.g., naukri.com) and force company resolution
    if (this.isSourceDomain(domain)) {
      domain = undefined;
    }

    // If domain could not be derived from URL and company looks like a domain
    if (!domain && company && /\./.test(company)) {
      domain = extractDomain(company);
    }

    // Alias map first (handles TCS/IBM/Wipro etc.)
    if (!domain && company) {
      const norm = this.normalizeName(company);
      if (norm && this.ALIAS_MAP[norm]) {
        domain = this.ALIAS_MAP[norm];
      }
    }

    // If still no domain, try Clearbit autocomplete to get real company domain
    if (!domain && company) {
      domain = await this.resolveDomainFromClearbit(company);
    }

    if (!domain) {
      return { companyDomain: undefined, logoUrl: undefined };
    }

    // Prefer high-resolution Clearbit logo when we have a real company domain
    // Fall back to favicon if Clearbit isn't suitable on the client side
    const clearbitLogo = `https://logo.clearbit.com/${domain}?size=128`;
    return { companyDomain: domain, logoUrl: clearbitLogo };
  }
}

export const logoService = new LogoService();


