# TEST: Pagination & Scroll Restoration

## Scenario
User loads more jobs, clicks a job from the paginated batch, then goes back.

## Steps to Test

1. **Start Both Servers**
   ```bash
   # Terminal 1 - Backend
   cd /home/arbaz/projects/rizq-ai/rizq-ai-backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd /home/arbaz/projects/rizq-ai/rizq-ai-frontend
   npm run dev
   ```

2. **Open Browser**
   - Go to http://localhost:3000
   - Open Console (F12)

3. **Test Pagination Restoration**
   
   **Step 1:** Initial Load
   - Page loads with jobs 1-20
   - Console shows: Initial search results
   
   **Step 2:** Load More
   - Scroll down, click "Load More"
   - Now you see jobs 1-40
   - Console shows: Load more completed
   
   **Step 3:** Click a Job from Second Batch
   - Find a job in the 21-40 range (e.g., the 25th job)
   - Click "View Details"
   - Console shows:
     ```
     💾 Saved job ID and pagination state: [job-id]
     ```
   
   **Step 4:** Go Back
   - Click "Back to search" on job details page
   - Console should show:
     ```
     🔄 Restoring pagination state: {offset: 20, ...}
     🔄 Loaded all jobs up to offset: 20, Total jobs: 40
     🔍 Triggering scroll restoration after pagination load: [job-id]
     ✅ Scrolled to job: [job-id]
     ✅ Scroll restoration completed after pagination load
     ```
   
   **Expected Result:**
   - ✅ You should see jobs 1-40 loaded (not just 1-20)
   - ✅ The selected job (#25) should be scrolled into view
   - ✅ The job should be centered on your screen

## What to Check in Console

**Success Indicators:**
- ✅ "Restoring pagination state" appears
- ✅ "Loaded all jobs up to offset: 20, Total jobs: 40"
- ✅ "Scrolled to job" appears
- ✅ Page shows 40 jobs, not 20

**Failure Indicators:**
- ❌ "Job element not found" 
- ❌ "Job not in current batch"
- ❌ Only 20 jobs showing instead of 40

## Troubleshooting

**If scroll doesn't work:**
1. Check console logs for errors
2. Verify job ID is in the loaded jobs list
3. Check if DOM element exists: `document.getElementById('job-card-[id]')`

**If pagination doesn't restore:**
1. Check sessionStorage: `sessionStorage.getItem('paginationState')`
2. Check if state was saved: `sessionStorage.getItem('lastViewedJobId')`

## Success Criteria

✅ Jobs 1-40 are loaded (not just 1-20)
✅ Selected job is scrolled into view
✅ User sees the exact paginated state they left
✅ No need to click "Load More" again

