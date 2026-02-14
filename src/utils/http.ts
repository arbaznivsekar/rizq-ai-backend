export function paginate(page = 1, pageSize = 20) {
const p = Math.max(1, Number(page));
const s = Math.min(100, Math.max(1, Number(pageSize)));
return { skip: (p - 1) * s, limit: s };
}

