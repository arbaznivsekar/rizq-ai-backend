#!/usr/bin/env ts-node

import dotenv from 'dotenv-flow';
import mongoose from 'mongoose';
import JobModel from '../dist/src/models/Job.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rizq-ai';

// Keep in sync with LogoService alias map
const ALIASES: Record<string, string> = {
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
  'ibm': 'ibm.com',
  'accenture': 'accenture.com',
  'deloitte': 'deloitte.com',
  'ey': 'ey.com',
  'pwc': 'pwc.com',
  'kpmg': 'kpmg.com',
  'national payments corporation of india npci': 'npci.org.in',
  'npci': 'npci.org.in',
  'perfios software solutions': 'perfios.com',
  'perfios': 'perfios.com',
  'advanced micro devices inc': 'amd.com',
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
  'e plus technologies': 'eplustechnologies.com',
  'e plus': 'eplustechnologies.com',
 
  'people staffing solutions': 'peoplestaffing.in',
  'people staffing': 'peoplestaffing.in',
  'rearck': 'rearck.com',
  'prl developers': 'prldevelopers.com',
  'double ticks': 'doubleticks.com',
  'datavista solutions': 'datavistasolutions.com',
  'datavista': 'datavistasolutions.com',
  

};

function buildRegex(name: string): RegExp {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

async function main() {
  console.log(`\n🛠  Forcing alias logos for known companies`);
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  let totalUpdated = 0;
  for (const [alias, domain] of Object.entries(ALIASES)) {
    const re = buildRegex(alias);
    const update = {
      companyDomain: domain,
      logoUrl: `https://logo.clearbit.com/${domain}`,
    } as any;

    const res = await JobModel.updateMany({ company: re }, { $set: update });
    const modified = (res as any).modifiedCount ?? (res as any).nModified ?? 0;
    totalUpdated += modified;
    console.log(`✅ ${alias} → ${domain} | updated: ${modified}`);
  }

  await mongoose.disconnect();
  console.log(`\n🎉 Done. Total updated: ${totalUpdated}`);
}

main().catch(async (e) => {
  console.error('❌ Failed:', e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});



