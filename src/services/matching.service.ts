// Simple scoring based on overlap of skills and requirements
export function scoreMatch(job: { requirements: string[] }, resume: { skills: string[] }) {
const jobSkills = new Set((job.requirements || []).map((s) => s.toLowerCase()));
const skills = (resume.skills || []).map((s) => s.toLowerCase());
const matches = skills.filter((s) => Array.from(jobSkills).some((j) => j.includes(s)));
const ratio = skills.length ? Math.min(1, matches.length / skills.length) : 0;
const score = Math.round(50 * ratio + (jobSkills.size ? Math.min(50, (matches.length / jobSkills.size) * 50) : 0));
const reasons = [];
if (matches.length) reasons.push(`${matches.length} matching skills`);
return { score, reasons };
}
