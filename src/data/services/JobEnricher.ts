import { JobDTO } from '../../types/job.types.js';

const skillDict = [
  'javascript','typescript','node','react','angular','vue','python','java','c#','aws','azure','gcp','sql','nosql','mongodb','docker','kubernetes','linux','git','rest','graphql','html','css','ml','ai','nlp',
];

const benefitsDict = ['insurance','visa sponsorship','housing','travel','stock','equity','bonus','pto','remote'];

export class JobEnricher {
  enrich(input: JobDTO): JobDTO {
    const text = [(input.title || ''), (input.description || '')].join(' ').toLowerCase();
    const skills = Array.from(new Set([...(input.skills || []), ...skillDict.filter(s => text.includes(s))]));
    const benefits = Array.from(new Set([...(input.benefits || []), ...benefitsDict.filter(b => text.includes(b))]));
    return { ...input, skills, benefits };
  }
}


