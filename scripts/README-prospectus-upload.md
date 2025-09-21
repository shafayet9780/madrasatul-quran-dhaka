# Prospectus Data Upload Script

This script uploads the prospectus data from the provided Bengali document to your Sanity CMS.

## Prerequisites

1. Make sure you have the following environment variables set in your `.env.local` file:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=your_dataset
   SANITY_API_TOKEN=your_api_token
   ```

2. Ensure you have the `@sanity/client` package installed:
   ```bash
   npm install @sanity/client
   ```

## Usage

Run the script from the project root:

```bash
node scripts/upload-prospectus-data.js
```

## What the Script Does

The script creates a comprehensive prospectus document in Sanity with the following data:

### 1. Institution Information
- **Founder Details**: S M Nahid Hasan (Founder Chairman)
- **Institution Name**: Madrasatul Quran Dhaka
- **Subtitle**: An Ideal Integration of Islamic and General Education

### 2. 10-Year Study Plan
Complete academic progression from Nursery (5+) to Class 10 (16+) including:
- Age groups and class levels
- Islamic Studies curriculum for each level
- General education subjects
- Both Bengali and English versions

### 3. Unique Features (11 Key Features)
- Ideal Integration of Arabic and Islamic education
- Four Language Skills (English & Arabic)
- Arabic Medium Islamic Studies from Grade 6
- Higher Education Pathways (SSC/Dakhil/Madrasa)
- Day-care Hifz Program
- Own Transportation System
- 300+ Hadith Memorization by Grade 9
- 90%+ Quranic Translation Proficiency
- Islamic Ethics and Manners Education
- Islamic History and Seerah
- Recreational Facilities

### 4. Curriculum Breakdown (6 Core Subjects)
- **Quran**: Hifz and translation according to ability
- **Arabic Language**: Speaking, listening, reading, writing
- **Aqidah**: Faith, creed, and Islamic values
- **Fiqh**: Basic rulings, manners, and prophetic supplications
- **Hadith**: 300+ subject-wise memorization by Grade 9
- **History**: Prophets, Quranic history, Caliphs, and subsequent history

### 5. Fee Structure
- Admission Fee (One-time): 20,000 BDT (Pre-Hifz), 23,000 BDT (Hifz)
- Session Fee (Annual): 15,000 BDT (Both)
- Tuition (Monthly): 6,000 BDT (Pre-Hifz), 10,000 BDT (Hifz)
- Food Cost (Monthly): 1,500 BDT (Pre-Hifz), 4,000 BDT (Hifz)
- Special discounts for multiple children

### 6. Higher Education Information
- Alim Path: Preparation for Ta'lim Board and Dakhil/SSC exams
- College Path: Focus on general education and SSC exams

## Components Created

The script also supports the following React components that use this data:

1. **TenYearStudyPlan** - Displays the complete 10-year academic progression
2. **UniqueFeatures** - Shows the 11 unique characteristics of the school
3. **CurriculumBreakdown** - Presents the 6 core Islamic subjects
4. **FeeStructure** - Displays the complete fee structure with special notes
5. **UniqueFeaturesShowcase** - Homepage version of unique features

## Integration

These components are integrated into:
- **Curriculum Page** (`/curriculum`) - Full detailed view
- **Homepage** - Showcase of unique features
- **Admissions Page** - Fee structure and study plan

## Data Structure

The prospectus data is stored as a single Sanity document with the following structure:
```typescript
{
  _type: 'prospectus',
  title: 'Madrasatul Quran Dhaka Prospectus',
  founder: { ... },
  institution: { ... },
  studyPlan: [ ... ],
  uniqueFeatures: [ ... ],
  curriculumSubjects: [ ... ],
  feeStructure: [ ... ],
  higherEducation: { ... },
  specialDiscount: { ... },
  publishedAt: '2024-01-XX...'
}
```

## Multilingual Support

All content includes both Bengali and English versions:
- Bengali text for local audience
- English text for international visitors
- Automatic language switching based on user locale

## Success Output

When successful, the script will output:
```
✅ Prospectus data uploaded successfully!
📄 Document ID: [document_id]
🔗 View in Sanity Studio: [studio_url]
🎉 Prospectus data upload completed successfully!
```

## Error Handling

The script includes comprehensive error handling and will display detailed error messages if something goes wrong during the upload process.

## Next Steps

After running the script:
1. Verify the data in your Sanity Studio
2. The components will automatically use the uploaded data
3. You can edit the content through Sanity Studio as needed
4. The website will display the prospectus information in both languages
