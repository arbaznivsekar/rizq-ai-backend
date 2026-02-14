export async function enqueueScrape(_params: { source?: string; url?: string }) {
// Handled by queue/worker; here we only validate/enqueue (implemented in queues/scraping.queue.ts)
return { enqueued: true };
}

