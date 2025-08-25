# Sanity Data Population Scripts

This directory contains scripts to populate your Sanity CMS with initial data for the Madrasatul Quran website.

## Available Scripts

### Footer Data Population

- **`populate-footer-data.js`** - JavaScript version
- **`populate-footer-data.ts`** - TypeScript version (recommended)

## Prerequisites

Before running these scripts, you need to:

1. **Set up environment variables** in your `.env.local` file:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   SANITY_API_TOKEN=your_write_token
   ```

2. **Get a Sanity API Token** with write permissions:
   - Go to [manage.sanity.io](https://manage.sanity.io)
   - Select your project
   - Go to API section
   - Create a new token with "Editor" or "Write" permissions
   - Copy the token to your `.env.local` file

## Running the Scripts

### Option 1: Using Node.js (JavaScript)

```bash
# Install dependencies if not already installed
npm install @sanity/client dotenv

# Run the JavaScript script
node scripts/populate-footer-data.js
```

### Option 2: Using TypeScript

```bash
# Install TypeScript if not already installed
npm install -g typescript

# Run the TypeScript script
npx ts-node scripts/populate-footer-data.ts
```

### Option 3: Using npm script (recommended)

Add this to your `package.json`:

```json
{
  "scripts": {
    "populate:footer": "ts-node scripts/populate-footer-data.ts",
    "populate:footer:js": "node scripts/populate-footer-data.js"
  }
}
```

Then run:
```bash
npm run populate:footer
```

## What the Footer Script Does

The footer population script will create or update a footer document in Sanity with:

### Basic Information
- **Title**: Madrasatul Quran (Bengali & English)
- **Subtitle**: Excellence in Islamic Education
- **Description**: Detailed description about the institution

### Contact Information
- **Address**: Mirpur-10, Dhaka-1216, Bangladesh
- **Phone**: +880 1234 567890
- **Email**: info@madrasatulquran.edu.bd
- **Office Hours**: Sun - Thu: 8:00 AM - 5:00 PM

### Social Media Links
- Facebook: https://facebook.com/madrasatulquran
- YouTube: https://youtube.com/@madrasatulquran
- Instagram: https://instagram.com/madrasatulquran

### Prayer Times
- Fajr: 5:15 AM
- Dhuhr: 12:30 PM
- Asr: 4:15 PM
- Maghrib: 6:00 PM
- Isha: 7:30 PM

### Quick Links
- Home, About, Programs, Admissions, Campus, News, Contact

### Legal Links
- Privacy Policy, Terms of Service, Sitemap

### Copyright
- © 2024 Madrasatul Quran. All rights reserved.

## Customizing the Data

You can modify the data in the script before running it:

1. **Edit contact information**:
   ```javascript
   contactInfo: {
     phone: '+880 YOUR_PHONE_NUMBER',
     email: 'your-email@domain.com',
     // ...
   }
   ```

2. **Update social media links**:
   ```javascript
   socialLinks: [
     {
       platform: 'Facebook',
       url: 'https://facebook.com/your-page',
       icon: 'facebook',
       isActive: true
     }
     // ...
   ]
   ```

3. **Modify prayer times**:
   ```javascript
   prayerTimes: [
     {
       prayerName: {
         bengali: 'ফজর',
         english: 'Fajr'
       },
       time: '5:30 AM', // Update time
       isActive: true
     }
     // ...
   ]
   ```

## Expected Output

When the script runs successfully, you should see:

```
🚀 Starting footer data population...
📝 Creating new footer...
✅ Footer created successfully!
📄 Footer ID: footer_abc123

📋 Footer data summary:
   • Title: Madrasatul Quran
   • Contact: +880 1234 567890
   • Social Links: 3
   • Prayer Times: 5
   • Quick Links: 7
   • Legal Links: 3

🎉 Footer data population completed successfully!
🌐 You can now view the footer on your website.
```

## Troubleshooting

### Common Issues

1. **"Token not found" error**:
   - Make sure `SANITY_API_TOKEN` is set in your `.env.local` file
   - Ensure the token has write permissions

2. **"Project not found" error**:
   - Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` is correct
   - Check that the project exists in your Sanity account

3. **"Dataset not found" error**:
   - Ensure `NEXT_PUBLIC_SANITY_DATASET` is correct (usually "production")
   - Check that the dataset exists in your project

4. **"Schema not found" error**:
   - Make sure the footer schema is deployed to Sanity
   - Run `npm run dev` to start the Sanity Studio and deploy schemas

### Getting Help

If you encounter issues:

1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure your Sanity project is properly configured
4. Check that the footer schema is deployed

## Next Steps

After running the script:

1. **Verify in Sanity Studio**:
   - Go to your Sanity Studio
   - Check that the footer document was created/updated
   - Review all the data

2. **Test on your website**:
   - Visit your website
   - Check that the footer displays correctly
   - Verify all links work
   - Test the language switching

3. **Customize further**:
   - Update contact information with real data
   - Add your actual social media links
   - Modify prayer times for your location
   - Update the address and office hours

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your Sanity API token secure
- Use environment-specific tokens for different environments (development, staging, production)

