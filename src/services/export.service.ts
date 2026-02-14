import { toCSV } from "../utils/csv.js";
export async function exportApplicationsCSV(rows: any[]) {
const fields = ["_id", "jobId", "status", "notes", "createdAt", "updatedAt"];
return toCSV(rows, fields);
}

