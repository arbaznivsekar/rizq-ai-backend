import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function generateResumePDF(resume: any) {
const doc = await PDFDocument.create();
const page = doc.addPage([595.28, 841.89]); // A4
const { width, height } = page.getSize();
const font = await doc.embedFont(StandardFonts.Helvetica);
let y = height - 50;

function drawText(text: string, size = 12, color = rgb(0, 0, 0)) {
page.drawText(text, { x: 50, y, size, font, color });
y -= size + 8;
}

// Header
drawText("Resume", 20);
y -= 8;

// Summary
if (resume?.professionalSummary) {
drawText("Professional Summary", 14);
drawText(resume.professionalSummary, 12);
}

// Experience
if (Array.isArray(resume?.experience) && resume.experience.length) {
drawText("Experience", 14);
for (const e of resume.experience) {
const line = [e.title, e.company].filter(Boolean).join(" - ");
if (line) drawText(line, 12);
if (e.description) drawText(e.description, 11, rgb(0.2, 0.2, 0.2));
}
}

// Education
if (Array.isArray(resume?.education) && resume.education.length) {
drawText("Education", 14);
for (const ed of resume.education) {
const line = [ed.degree, ed.school].filter(Boolean).join(" - ");
if (line) drawText(line, 12);
}
}

// Skills
if (Array.isArray(resume?.skills) && resume.skills.length) {
drawText("Skills", 14);
drawText(resume.skills.join(", "), 12);
}

const bytes = await doc.save();
return Buffer.from(bytes);
}

