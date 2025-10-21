# PDF Generator Installation Guide

## Quick Installation

### Option 1: Automated Setup (Recommended)
```bash
cd scripts/pdf-generator
./quick-start.sh
```

### Option 2: Manual Setup
```bash
cd scripts/pdf-generator

# 1. Copy environment variables
cp ../../.env.local .env

# 2. Install dependencies
npm install

# 3. Run setup validation
node setup.js

# 4. Test installation
node test-setup.js

# 5. Start the server
npm start
```

## Environment Setup

### 1. Copy Environment Variables
```bash
# From the main project directory
cp .env.local scripts/pdf-generator/.env
```

### 2. Verify Environment Variables
Your `.env` file should contain:
```env
# Google Sheets Configuration
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLIENT_ID=your_client_id
FORM_GOOGLE_SHEETS_ID=your_spreadsheet_id

# Vercel Blob Configuration
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Dependencies Installation

### Standard Installation
```bash
npm install
```

### If Sharp Installation Fails
The PDF Generator includes a fallback image processor that works without Sharp. If you encounter Sharp installation issues:

1. **Try reinstalling**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **The app will automatically detect** if Sharp is unavailable and use the fallback processor.

3. **Check the console output** - you'll see either:
   - `✅ Using Sharp-based image fetcher` (preferred)
   - `⚠️ Sharp not available, using simple image fetcher` (fallback)

## Verification

### 1. Run Setup Test
```bash
node test-setup.js
```

### 2. Check Health Endpoint
```bash
# Start the server
npm start

# In another terminal, test the API
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "PDF Generator is running",
  "services": {
    "googleSheets": true,
    "imageFetcher": true,
    "pdfGenerator": true
  }
}
```

### 3. Access Web Interface
Open your browser to: `http://localhost:3001`

## Troubleshooting

### Sharp Module Issues
If you see errors like "Cannot find module '../build/Release/sharp-darwin-arm64v8.node'":

1. **The app handles this automatically** - it will use a fallback image processor
2. **No action needed** - the PDF Generator will work without Sharp
3. **Images will still be included** in PDFs, just without optimization

### Google Sheets Access Issues
1. **Check service account permissions**:
   - Ensure the service account email is added to your Google Sheet
   - Verify it has "Editor" permissions
   - Check the spreadsheet ID is correct

2. **Test connection**:
   ```bash
   curl http://localhost:3001/api/submissions
   ```

### Missing Files
If setup test fails:
1. **Re-run setup**:
   ```bash
   node setup.js
   ```

2. **Check file permissions**:
   ```bash
   chmod +x setup.js test-setup.js quick-start.sh
   ```

## Production Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### File Permissions
```bash
chmod 755 output/
chmod 755 cache/
chmod 755 cache/images/
```

### Process Management
Consider using PM2 for production:
```bash
npm install -g pm2
pm2 start server.js --name pdf-generator
pm2 startup
pm2 save
```

## Support

- **README.md**: Complete documentation
- **TROUBLESHOOTING.md**: Detailed troubleshooting guide
- **test-setup.js**: Installation verification
- **setup.js**: Environment validation

## Next Steps

1. **Start the server**: `npm start`
2. **Open browser**: `http://localhost:3001`
3. **View submissions**: Browse the form submissions
4. **Generate PDFs**: Click "Generate PDF" for individual submissions
5. **Bulk generation**: Select multiple submissions and generate PDFs in bulk
