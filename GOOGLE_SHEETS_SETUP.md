# Google Sheets Integration Setup Guide

## 🔑 Getting Your Google Sheets ID

### Method 1: From Google Sheets URL
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. Copy the long string between `/d/` and `/edit`
4. **Example:** `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - **Spreadsheet ID:** `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### Method 2: Share Button
1. Click the **Share** button in Google Sheets
2. Copy the link and extract the ID from the URL

## 🔐 Setting Up Google Service Account

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in:
   - **Service account name:** `madrasatul-quran-forms`
   - **Service account ID:** Auto-generated
   - **Description:** `Service account for pre-admission form submissions`
4. Click "Create and Continue"
5. Skip role assignment for now
6. Click "Done"

### Step 3: Generate JSON Key
1. In the Credentials page, find your service account
2. Click the service account email
3. Go to "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Download the JSON file (keep it secure!)

### Step 4: Share Google Sheet with Service Account
1. Open your Google Sheet
2. Click "Share"
3. Paste the service account email from the JSON file
4. Give it "Editor" permissions
5. Click "Send"

## 🔧 Environment Variables Setup

Copy the downloaded JSON file contents and set these environment variables:

```env
# Google Service Account Credentials
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com

# Form Configuration
FORM_GOOGLE_SHEETS_ID=your-spreadsheet-id-here
```

## 📊 Setting Up Your Google Sheet

### Step 1: Create Headers
Create a new Google Sheet and add these headers in row 1:

| Column | Header Name | Description |
|--------|-------------|-------------|
| A | Timestamp | Submission timestamp |
| B | Student Photo | Photo URL |
| C | Student Name (English) | English name |
| D | Date of Birth | DOB |
| E | Gender | Male/Female |
| F | Student Name (Bengali) | Bengali name |
| G | Father's Name | Father's name |
| H | Father's Occupation | Father's job |
| I | Mother's Name | Mother's name |
| J | Mother's Occupation | Mother's job |
| K | Address | Full address |
| L | Phone | Phone number |
| M | Email | Email address |
| N | How did you learn about us? | Referral source |
| O | Declaration | Declaration acceptance |

### Step 2: Set Sheet Range
In your form configuration, use range `A:O` (adjust based on your columns)

## 🔍 Testing the Integration

### Test 1: Basic Connection
```bash
# Test if service account can access the sheet
curl -X POST http://localhost:3000/api/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "data": ["Test", "Entry", "2024-01-01"],
    "spreadsheetId": "YOUR_SPREADSHEET_ID",
    "range": "A:C"
  }'
```

### Test 2: Full Form Submission
Submit a test form through your website and check if data appears in Google Sheets.

## 🛡️ Security Best Practices

### 1. Environment Variables
- Never commit service account JSON to Git
- Use Vercel environment variables for production
- Rotate keys regularly

### 2. Sheet Permissions
- Service account should have minimum required permissions
- Regularly audit who has access to the sheet
- Consider using separate sheets for different purposes

### 3. Data Validation
- Implement server-side validation
- Sanitize all form inputs
- Use HTTPS for all communications

## 🚨 Troubleshooting

### Common Issues:

#### 1. "The caller does not have permission"
- Check if service account email is added to sheet sharing
- Verify the email is spelled correctly
- Ensure "Editor" permission is granted

#### 2. "Invalid credentials"
- Check all environment variables are set correctly
- Ensure private key is properly formatted (newlines preserved)
- Verify project ID matches the service account

#### 3. "Spreadsheet not found"
- Double-check the spreadsheet ID
- Ensure the sheet is not deleted or moved
- Verify the service account has access

#### 4. "Quota exceeded"
- Google has rate limits for API calls
- Consider implementing exponential backoff
- Upgrade to paid Google Cloud plan if needed

## 📈 Advanced Configuration

### Multiple Sheets
You can use different sheets for different types of data:
```javascript
// Sheet 1: Main submissions
range: 'A:O'

// Sheet 2: File uploads tracking
range: 'FileUploads!A:D'

// Sheet 3: Analytics
range: 'Analytics!A:C'
```

### Error Logging
Consider creating a separate sheet for error logging:
```javascript
// Log errors for debugging
const errorRange = 'Errors!A:D';
await sheets.spreadsheets.values.append({
  spreadsheetId,
  range: errorRange,
  valueInputOption: 'RAW',
  requestBody: {
    values: [[new Date().toISOString(), error.message, error.stack, userId]],
  },
});
```

## 🎯 Production Deployment

### Vercel Setup:
1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" > "Environment Variables"
4. Add all the Google service account variables
5. Redeploy your application

### Monitoring:
- Set up alerts for failed submissions
- Monitor API usage in Google Cloud Console
- Keep track of form submission success rates

---

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test with a simple API call first
4. Check Google Cloud Console for API errors
5. Ensure the service account has proper permissions

**Remember:** Keep your service account credentials secure and never expose them in client-side code!
