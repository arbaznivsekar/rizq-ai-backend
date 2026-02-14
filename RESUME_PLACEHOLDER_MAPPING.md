# Resume Placeholder Mapping - Complete Guide

## Overview
This document maps user profile data to resume template placeholders for the RIZQ.AI resume generation service.

**Total Placeholders Supported**: 100+ placeholders covering all profile aspects

---

## 📋 Profile Screenshot → Resume Template Mapping

Based on your profile page screenshot and resume template, here's the complete mapping:

### 1. Education Section 🎓

Your profile shows:
- **B.Sc Computer Science** at Mumbai University (Computer science) - Jun 2017 to Nov 2020
- **MS Data Science** at IT Vedant (DS, AI, ML) - Jan 2023 to Apr 2024

#### Individual Education Placeholders (NEW ✨)

**Education Entry 1:**
- `{{Education_1_Degree}}` → "B.Sc Computer Science"
- `{{Education_1_Institution}}` → "Mumbai University"
- `{{Education_1_Field}}` → "Computer science"
- `{{Education_1_StartDate}}` → "Jun 2017"
- `{{Education_1_EndDate}}` → "Nov 2020"
- `{{Education_1_DateRange}}` → "Jun 2017 - Nov 2020"

**Education Entry 2:**
- `{{Education_2_Degree}}` → "MS Data Science"
- `{{Education_2_Institution}}` → "IT Vedant"
- `{{Education_2_Field}}` → "DS, AI, ML"
- `{{Education_2_StartDate}}` → "Jan 2023"
- `{{Education_2_EndDate}}` → "Apr 2024"
- `{{Education_2_DateRange}}` → "Jan 2023 - Apr 2024"

**Education Entry 3:**
- `{{Education_3_Degree}}` → "" (empty if no third education)
- `{{Education_3_Institution}}` → ""
- `{{Education_3_Field}}` → ""
- `{{Education_3_StartDate}}` → ""
- `{{Education_3_EndDate}}` → ""
- `{{Education_3_DateRange}}` → ""

#### Legacy Education Placeholders (Backward Compatible)
- `{{Education}}` → "B.Sc Computer Science in Computer science from Mumbai University (2020); MS Data Science in DS, AI, ML from IT Vedant (2024)"
- `{{Latest Degree}}` → "B.Sc Computer Science"
- `{{Institution}}` → "Mumbai University"

---

### 2. Skills Section 💡

Your profile shows: **NLP, DL, Machine learning algorithms, python, data visualization, artificial intelligence, Gen AI, software Engineering**

**Placeholders:**
- `{{Skills}}` → "NLP, DL, Machine learning algorithms, python, data visualization, artificial intelligence, Gen AI, software Engineering"
- `{{Top Skills}}` → "NLP, DL, Machine learning algorithms, python, data visualization" (first 5 only)

---

### 3. Social Links Section 🔗

Your profile shows: **LinkedIn** and **GitHub** buttons

**Placeholders:**
- `{{LinkedIn}}` → User's LinkedIn profile URL
- `{{GitHub}}` → User's GitHub profile URL
- `{{Portfolio}}` → User's portfolio website URL (if provided)
- `{{Twitter}}` → User's Twitter profile URL (if provided)

---

### 4. Core Profile Information 👤

**Basic Details:**
- `{{Applicant Name}}` → User's full name
- `{{Email}}` → Email address
- `{{Phone}}` → Phone number
- `{{Location}}` → City/location
- `{{Headline}}` → Professional headline (e.g., "Senior Data Scientist")
- `{{Bio}}` → Professional bio/summary

**Job Application Specific:**
- `{{Position Applied}}` → Job title being applied for
- `{{Body}}` → AI-generated professional summary tailored to the specific job

---

### 5. Experience Section 💼

Up to **5 experience entries**, each with:

**Experience Entry N (N = 1 to 5):**
- `{{Experience_N_Title}}` → Job title
- `{{Experience_N_Company}}` → Company name
- `{{Experience_N_Location}}` → Work location
- `{{Experience_N_StartDate}}` → Start date (e.g., "Jan 2020")
- `{{Experience_N_EndDate}}` → End date (e.g., "Dec 2022" or "Present")
- `{{Experience_N_Description}}` → **Markdown-formatted description** authored on the profile page (supports `-` / `*` bullets and newlines)

> ⚠️ **Important:** `{{Experience_N_Description}}` is passed through as raw markdown from the profile editor.  
> The document automation/template side is responsible for rendering this markdown correctly (e.g., bullet lists).

**Legacy Experience Placeholders:**
- `{{Current Role}}` → Most recent job title
- `{{Current Company}}` → Most recent employer
- `{{Years Experience}}` → Total years of experience (calculated)
- `{{Experience}}` → Brief summary of current role
- `{{Experience Details}}` → Detailed list of all experiences

---

### 6. Projects Section 🚀

**Placeholders:**
- `{{Projects}}` → Formatted list of top 3 projects with descriptions

---

### 7. Preferences & Additional 🎯

**Job Preferences:**
- `{{Availability}}` → When user can start (e.g., "Immediate", "2 weeks notice")
- `{{Job Types}}` → Preferred job types (e.g., "Full-time, Contract")
- `{{Remote Preference}}` → Work preference (e.g., "Remote", "Hybrid", "Onsite")

**Other:**
- `{{Resume URL}}` → Link to user's original resume (if uploaded)

---

## 🎨 Resume Template Usage Examples

### Example 1: Education Section in Google Docs Template

```
EDUCATION

{{Education_1_Degree}}
{{Education_1_Institution}} - {{Education_1_Field}}
{{Education_1_DateRange}}

{{Education_2_Degree}}
{{Education_2_Institution}} - {{Education_2_Field}}
{{Education_2_DateRange}}
```

**Will render as:**

```
EDUCATION

B.Sc Computer Science
Mumbai University - Computer science
Jun 2017 - Nov 2020

MS Data Science
IT Vedant - DS, AI, ML
Jan 2023 - Apr 2024
```

---

### Example 2: Skills Section

```
KEY SKILLS
{{Skills}}
```

**Will render as:**

```
KEY SKILLS
NLP, DL, Machine learning algorithms, python, data visualization, artificial intelligence, Gen AI, software Engineering
```

---

### Example 3: Social Links

```
SOCIAL LINKS
LinkedIn: {{LinkedIn}}
GitHub: {{GitHub}}
```

**Will render as:**

```
SOCIAL LINKS
LinkedIn: https://linkedin.com/in/username
GitHub: https://github.com/username
```

---

## 🔍 Special Features

### 1. **Automatic Empty Handling**
- If a user has only 1 education entry, `Education_2_*` and `Education_3_*` will be empty strings
- Resume template should handle empty placeholders gracefully

### 2. **Date Formatting**
- All education dates use **"Month YYYY"** format (e.g., "Jun 2017")
- Experience dates use **"M/YYYY"** format (e.g., "6/2017")
- "Present" is used for current positions/education

### 3. **Smart Bullet Point Parsing**
- **Deprecated for primary experience descriptions.**  
  Experience descriptions are now treated as **markdown blocks** and are **not** auto-split or rewritten by the backend.
- You can still derive bullet-level content in templates directly from the markdown if needed.

### 4. **Backward Compatibility**
- All original placeholders (`{{Education}}`, `{{Latest Degree}}`, etc.) still work
- New individual placeholders provide more control

---

## 📊 Complete Placeholder Count

| Category | Count | Examples |
|----------|-------|----------|
| Core Profile | 9 | Name, Email, Phone, Location, Headline, Bio, Body, Position Applied, Resume URL |
| Skills | 2 | Skills, Top Skills |
| Experience | 65 | 5 experiences × 13 fields each |
| Education (New) | 18 | 3 educations × 6 fields each |
| Education (Legacy) | 3 | Education, Latest Degree, Institution |
| Social Links | 4 | LinkedIn, GitHub, Portfolio, Twitter |
| Preferences | 3 | Availability, Job Types, Remote Preference |
| Calculated | 3 | Years Experience, Current Role, Current Company |
| Projects | 1 | Projects |
| **TOTAL** | **108** | **All profile data covered** |

---

## ✅ Implementation Status

- ✅ Core profile placeholders
- ✅ Skills placeholders
- ✅ Experience placeholders (with 8 bullets each)
- ✅ **Education placeholders (NEW - just implemented)**
- ✅ Social links placeholders
- ✅ Projects placeholders
- ✅ Preferences placeholders
- ✅ Date formatting helpers
- ✅ Tested with 8 comprehensive scenarios

---

## 🚀 Next Steps

1. **Update your Google Docs resume template** with the new education placeholders
2. **Test resume generation** with your actual profile data
3. **Fine-tune formatting** based on the generated resume output

---

## 📝 Notes

- The service fetches user profile **once** and generates resumes for multiple jobs in parallel
- All placeholders are sent even if empty (allows template to handle gracefully)
- Professional summary (`{{Body}}`) is AI-generated and job-specific
- Service supports retry logic and error handling for production reliability

---

**Last Updated**: December 4, 2025  
**Service**: `resumeGeneration.service.ts`  
**Version**: 2.0 (with individual education placeholders)











