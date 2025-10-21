# PDF Generator for Pre-Admission Form Submissions

A standalone Node.js web application that fetches pre-admission form submissions from Google Sheets and generates individual PDF applications in Bengali with professional formatting.

## Features

- 📊 **Web Interface**: User-friendly dashboard to view all form submissions
- 🔍 **Search & Filter**: Search by student name, class, or parent name with class-based filtering
- 📄 **Individual PDFs**: Generate professional Bengali PDF applications for each submission
- 📦 **Bulk Generation**: Generate multiple PDFs at once with progress tracking
- 🖼️ **Image Integration**: Automatically includes student and father photos
- 🎨 **Professional Layout**: Clean, sectioned layout with proper Bengali typography
- 💾 **Caching**: Smart image caching to avoid re-downloading
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js 16+ 
- Access to Google Sheets with form submissions
- Vercel Blob storage access for images
- Bengali fonts (NotoSansBengali) - automatically downloaded

## Installation

1. **Navigate to the PDF Generator directory:**
   ```bash
   cd scripts/pdf-generator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
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

4. **Copy form questions configuration:**
   ```bash
   cp ../../pre-admission-form-questions.json ./
   ```

## Usage

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open your browser:**
   Navigate to `http://localhost:3001`

3. **View submissions:**
   - All form submissions are displayed in a table
   - Use search to find specific students
   - Filter by class (Play, Nursery, KG, Classes)

4. **Generate PDFs:**
   - **Single PDF**: Click "Generate PDF" button for individual submissions
   - **Bulk PDFs**: Select multiple submissions and click "Generate Selected PDFs"

5. **Download PDFs:**
   - Generated PDFs are automatically downloaded
   - Files are saved in the `output/` directory
   - Filename format: `{student-name}_{class}_{date}.pdf`

## API Endpoints

### GET /api/submissions
Fetch all form submissions from Google Sheets.

**Response:**
```json
{
  "success": true,
  "count": 25,
  "submissions": [...]
}
```

### GET /api/submissions/:rowNumber
Fetch a specific submission by row number.

### POST /api/generate-pdf
Generate PDF for a specific submission.

**Request:**
```json
{
  "rowNumber": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "PDF generated successfully",
  "filename": "student-name_class_2024-01-15.pdf",
  "downloadUrl": "/api/download/student-name_class_2024-01-15.pdf"
}
```

### POST /api/generate-bulk
Generate PDFs for multiple submissions.

**Request:**
```json
{
  "rowNumbers": [3, 5, 7, 9]
}
```

### GET /api/download/:filename
Download a generated PDF file.

### GET /api/health
Health check endpoint.

### GET /api/cache/info
Get image cache information.

### DELETE /api/cache/clear
Clear image cache.

## Project Structure

```
scripts/pdf-generator/
├── lib/
│   ├── google-sheets-client.js    # Google Sheets integration
│   ├── image-fetcher.js          # Image download and caching
│   └── pdf-generator.js           # PDF generation with jsPDF
├── public/
│   ├── index.html                 # Web interface
│   ├── style.css                 # Styling
│   └── app.js                    # Frontend JavaScript
├── fonts/
│   ├── NotoSansBengali-Regular.ttf
│   └── NotoSansBengali-Bold.ttf
├── output/                       # Generated PDFs
├── cache/
│   └── images/                   # Cached images
├── server.js                     # Express server
├── package.json
├── .env.example
└── README.md
```

## PDF Features

### Layout
- **Header**: School name and logo placeholder
- **Student Photo**: Top-right corner (if available)
- **Sections**: 
  - Student Information
  - Student Assessment
  - Father Information (with photo)
  - Mother Information
  - Additional Information
  - Contact Information
- **Declaration**: Legal text at bottom
- **Footer**: Submission date and time

### Bengali Typography
- Uses NotoSansBengali font for proper Bengali rendering
- Supports Bengali text wrapping
- Professional sectioned layout
- Option values converted to Bengali labels

### Image Integration
- Student photo (150x200px) in header
- Father photo (120x150px) in father's section
- Automatic image optimization and resizing
- Graceful handling of missing images

## Configuration

### Google Sheets Setup
The application expects Google Sheets with:
- Row 1: Field keys (e.g., `student_name_bengali`, `father_name`)
- Row 2: Display headers (e.g., `Student Name (Bengali)`, `Father Name`)
- Row 3+: Form submission data

### Form Questions
The `pre-admission-form-questions.json` file contains:
- Field metadata and configurations
- Option value-to-label mappings
- Section categorizations
- Required field information

## Troubleshooting

### Common Issues

1. **Sharp Module Installation Issues**
   - If you see "Cannot find module '../build/Release/sharp-darwin-arm64v8.node'"
   - Try: `rm -rf node_modules package-lock.json && npm install`
   - The app automatically falls back to a simple image fetcher if Sharp fails
   - See `TROUBLESHOOTING.md` for detailed solutions

2. **"Google Sheets credentials not configured"**
   - Check your `.env` file has all required Google credentials
   - Ensure service account has access to the spreadsheet

3. **"Cannot access spreadsheet"**
   - Verify the spreadsheet ID is correct
   - Ensure service account email is added to sheet sharing
   - Check service account has "Editor" permissions

4. **"Failed to download images"**
   - Verify `BLOB_READ_WRITE_TOKEN` is correct
   - Check image URLs in Google Sheets are valid
   - Ensure images are publicly accessible

5. **Bengali text not rendering**
   - Check if NotoSansBengali fonts are downloaded
   - Verify font files are in the `fonts/` directory
   - Try clearing browser cache

6. **PDF generation fails**
   - Check server logs for specific error messages
   - Ensure `output/` directory is writable
   - Verify submission data is valid

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

### Cache Management
- Images are cached in `cache/images/` directory
- Use `/api/cache/clear` to clear cache
- Check `/api/cache/info` for cache statistics

## Development

### Adding New Features
1. **New PDF sections**: Modify `lib/pdf-generator.js`
2. **New API endpoints**: Add routes in `server.js`
3. **UI improvements**: Update `public/index.html`, `style.css`, `app.js`

### Testing
```bash
# Test with sample data
npm run dev

# Check health endpoint
curl http://localhost:3001/api/health

# Test submissions endpoint
curl http://localhost:3001/api/submissions
```

## Security Notes

- This application runs locally and is not exposed to the internet
- Google Sheets credentials are stored in environment variables
- Generated PDFs contain sensitive information - handle securely
- Image cache may contain personal photos - secure appropriately

## License

MIT License - See LICENSE file for details.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify all environment variables are set correctly
4. Ensure Google Sheets and Vercel Blob access is working

---

**Note**: This tool is designed for internal use by Madrasatul Quran Dhaka staff for processing pre-admission form submissions. Ensure proper data handling and security measures are in place.
