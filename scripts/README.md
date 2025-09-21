# Scripts Directory

This directory contains utility scripts for managing the Madrasatul Quran website.

## Available Scripts

### 1. `setup-google-sheets-headers.js`
**Purpose:** Populates Google Sheets headers from Sanity CMS pre-admission form configuration.

**Usage:**
```bash
node scripts/setup-google-sheets-headers.js
```

**Features:**
- ✅ Fetches form configuration from Sanity CMS
- ✅ Generates headers based on form fields
- ✅ Updates Google Sheets with proper column headers
- ✅ Uses English headers (primary language)
- ✅ Can be run anytime when form structure changes
- ✅ Formats header row with styling
- ✅ Auto-resizes columns
- ✅ Clears any previous header rows

**When to run:**
- After adding new form fields
- After modifying existing form fields
- After changing field names or labels
- When setting up a new Google Sheet

### 2. `test-google-sheets.js`
**Purpose:** Tests Google Sheets integration and connection.

**Usage:**
```bash
node scripts/test-google-sheets.js
```

**Features:**
- ✅ Validates environment variables
- ✅ Tests Google Sheets API connection
- ✅ Appends test data to verify functionality
- ✅ Reads and displays current sheet data

### 3. `populate-pre-admission-form.js` / `populate-pre-admission-form.ts`
**Purpose:** Populates Sanity CMS with default pre-admission form configuration.

**Usage:**
```bash
node scripts/populate-pre-admission-form.js
# or
npx tsx scripts/populate-pre-admission-form.ts
```

**Features:**
- ✅ Creates default form structure in Sanity
- ✅ Sets up all form fields and sections
- ✅ Configures form settings and validation

## Environment Variables Required

All scripts require these environment variables in `.env.local`:

```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token

# Google Sheets
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_X509_CERT_URL=your_cert_url
FORM_GOOGLE_SHEETS_ID=your_spreadsheet_id
```

## Common Workflows

### Setting Up New Form Fields
1. Update form configuration in Sanity CMS
2. Run `setup-google-sheets-headers.js` to update Google Sheets
3. Test with `test-google-sheets.js`

### Initial Setup
1. Run `populate-pre-admission-form.js` to create form structure
2. Run `setup-google-sheets-headers.js` to create Google Sheets headers
3. Test with `test-google-sheets.js`

### Troubleshooting
1. Run `test-google-sheets.js` to verify connection
2. Check environment variables
3. Verify service account permissions

## Script Dependencies

```bash
# Install required packages
npm install @sanity/client googleapis dotenv

# For TypeScript scripts
npm install -D tsx
```

## Error Handling

All scripts include comprehensive error handling:
- ✅ Environment variable validation
- ✅ API connection testing
- ✅ Detailed error messages
- ✅ Troubleshooting suggestions

## Security Notes

- 🔒 Never commit service account JSON files to Git
- 🔒 Keep environment variables secure
- 🔒 Use environment variables for all sensitive data
- 🔒 Regularly rotate API keys and tokens