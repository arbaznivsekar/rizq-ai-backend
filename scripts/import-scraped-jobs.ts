/**
 * Import scraped jobs from JSON files to MongoDB
 * Processes all REAL-naukri-jobs-*.json files in the current directory
 * Prevents duplicates based on source + externalId combination
 */

import dotenv from 'dotenv-flow';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import { readdirSync } from 'fs';
import { join } from 'path';
import JobModel from '../dist/src/models/Job.js';

dotenv.config();

async function importJobs() {
  try {
    console.log('\n🚀 Starting Job Import to MongoDB...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rizq-ai';
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all JSON files matching the pattern
    const currentDir = process.cwd();
    const jsonFiles = readdirSync(currentDir)
      .filter(file => file.startsWith('REAL-naukri-jobs-') && file.endsWith('.json'))
      .sort();

    if (jsonFiles.length === 0) {
      console.log('❌ No job JSON files found matching pattern: REAL-naukri-jobs-*.json');
      console.log('   Please ensure JSON files are in the current directory.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`📂 Found ${jsonFiles.length} JSON file(s) to process:\n`);
    jsonFiles.forEach((file, idx) => {
      console.log(`   ${idx + 1}. ${file}`);
    });
    console.log('');

    // Global statistics
    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalProcessed = 0;

    // Process each file
    for (const filename of jsonFiles) {
      try {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`📄 Processing: ${filename}`);
        console.log('='.repeat(70));

        const filePath = join(currentDir, filename);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        const jobsInFile = data.jobs || data.jobListings || [];
        console.log(`📊 Found ${jobsInFile.length} jobs in file\n`);

        let fileImported = 0;
        let fileSkipped = 0;
        let fileErrors = 0;

        for (const job of jobsInFile) {
          try {
            totalProcessed++;

            // Parse experience
            let experienceMin: number | undefined;
            let experienceMax: number | undefined;
            if (job.experience && job.experience !== 'Not specified') {
              const expMatch = job.experience.match(/(\d+)-(\d+)/);
              if (expMatch) {
                experienceMin = parseInt(expMatch[1]);
                experienceMax = parseInt(expMatch[2]);
              }
            }

            // Parse salary
            let salaryMin: number | undefined;
            let salaryMax: number | undefined;
            let salaryCurrency = 'INR';
            if (job.salary && job.salary !== 'Not disclosed' && job.salary !== 'Not specified') {
              // Try to parse salary (e.g., "10-15 Lacs P.A.")
              const salMatch = job.salary.match(/(\d+)-(\d+)\s*Lacs?/i);
              if (salMatch) {
                salaryMin = parseInt(salMatch[1]) * 100000;
                salaryMax = parseInt(salMatch[2]) * 100000;
              }
            }

            // Generate externalId - use jobId, extract from URL, or generate unique ID
            let externalId = job.jobId;
            if (!externalId && job.link) {
              // Extract ID from URL (e.g., ...011025917191)
              const urlMatch = job.link.match(/\d{12}/);
              if (urlMatch) {
                externalId = urlMatch[0];
              } else {
                // Use last part of URL path
                externalId = job.link.split('/').pop()?.split('-').pop() || undefined;
              }
            }
            if (!externalId) {
              // Generate fallback ID (but this should be rare)
              externalId = `naukri-${Date.now()}-${totalProcessed}`;
              console.warn(`⚠️  Generated fallback ID for: ${job.title}`);
            }

            // Check if job already exists (for better duplicate reporting)
            const existingJob = await JobModel.findOne({
              source: 'naukri',
              externalId: externalId
            }).lean();

            if (existingJob) {
              fileSkipped++;
              totalSkipped++;
              continue; // Skip duplicate
            }

            // Create job document matching the schema
            const jobDoc: any = {
              source: 'naukri',
              externalId: externalId,
              title: job.title,
              company: job.company,
              location: job.location,
              description: job.description || '',
              requirements: job.keySkills || [],
              salaryMin: salaryMin,
              salaryMax: salaryMax,
              jobType: 'Full-time' as const,
              url: job.link,
              postedAt: new Date(job.extractedAt || Date.now())
            };

            // Derive branding fields (domain + logo)
            try {
              const { logoService } = await import('../src/services/logo.service.js');
              const branding = await logoService.resolve(job.company, job.link, undefined);
              if (branding.companyDomain) jobDoc.companyDomain = branding.companyDomain;
              if (branding.logoUrl) jobDoc.logoUrl = branding.logoUrl;
            } catch (_) {
              // Best-effort; ignore errors in enrichment
            }

            // Upsert (insert or update) based on externalId
            // This is redundant now since we check above, but keeps safety
            const result = await JobModel.findOneAndUpdate(
              { source: 'naukri', externalId: jobDoc.externalId },
              jobDoc,
              { upsert: true, new: true }
            );

            if (result) {
              fileImported++;
              totalImported++;
              if (fileImported <= 5 || fileImported % 10 === 0) {
                console.log(`✅ ${fileImported}. ${job.title} - ${job.company}`);
              }
            } else {
              fileSkipped++;
              totalSkipped++;
            }

          } catch (error: any) {
            fileErrors++;
            totalErrors++;
            console.error(`❌ Error importing job "${job.title}": ${error.message}`);
          }
        }

        console.log(`\n📊 File Summary (${filename}):`);
        console.log(`   ✅ Imported: ${fileImported}`);
        console.log(`   ⚠️  Skipped:  ${fileSkipped}`);
        console.log(`   ❌ Errors:    ${fileErrors}`);

      } catch (error: any) {
        console.error(`\n❌ Error processing file ${filename}:`, error.message);
        totalErrors++;
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL IMPORT SUMMARY');
    console.log('='.repeat(70));
    console.log(`📁 Files processed:        ${jsonFiles.length}`);
    console.log(`📋 Total jobs processed:   ${totalProcessed}`);
    console.log(`✅ Successfully imported:  ${totalImported} jobs`);
    console.log(`⚠️  Skipped (duplicates):   ${totalSkipped} jobs`);
    console.log(`❌ Errors:                 ${totalErrors} jobs`);
    console.log('='.repeat(70));

    // Check final count in database
    const finalCount = await JobModel.countDocuments();
    console.log(`\n📊 Total jobs in database: ${finalCount}\n`);

    console.log('✅ Job import completed!');
    console.log('\n🔍 Test the API:');
    console.log('   curl "http://localhost:8080/api/v1/workflow/search?query=software&limit=5"\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

importJobs();

