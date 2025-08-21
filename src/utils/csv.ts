import { createObjectCsvWriter } from "csv-writer";
export function toCSV(rows: any[], fields?: string[]) {
if (!rows.length) return "";
const csvWriter = createObjectCsvWriter({
  path: 'temp.csv',
  header: fields ? fields.map(field => ({ id: field, title: field })) : Object.keys(rows[0]).map(key => ({ id: key, title: key }))
});
// For now, return a simple CSV string
// In production, you might want to write to a file or stream
const headers = fields || Object.keys(rows[0]);
const csvContent = [
  headers.join(','),
  ...rows.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
].join('\n');
return csvContent;
}
