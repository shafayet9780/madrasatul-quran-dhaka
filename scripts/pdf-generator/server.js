const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const GoogleSheetsClient = require('./lib/google-sheets-client');
// Try to use Sharp-based image fetcher, fallback to simple version
let ImageFetcher;
try {
  ImageFetcher = require('./lib/image-fetcher');
  console.log('✅ Using Sharp-based image fetcher');
} catch (error) {
  console.log('⚠️ Sharp not available, using simple image fetcher');
  ImageFetcher = require('./lib/image-fetcher-simple');
}
const PDFGenerator = require('./lib/pdf-generator');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize services
let googleSheetsClient;
let imageFetcher;
let pdfGenerator;

async function initializeServices() {
  try {
    console.log('🚀 Initializing PDF Generator services...');
    
    googleSheetsClient = new GoogleSheetsClient();
    imageFetcher = new ImageFetcher();
    pdfGenerator = new PDFGenerator();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    process.exit(1);
  }
}

// API Routes

/**
 * GET /api/submissions
 * Fetch all form submissions from Google Sheets
 */
app.get('/api/submissions', async (req, res) => {
  try {
    console.log('📡 Fetching submissions...');
    const submissions = await googleSheetsClient.fetchSubmissions();
    
    res.json({
      success: true,
      count: submissions.length,
      submissions: submissions
    });
  } catch (error) {
    console.error('❌ Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

/**
 * GET /api/submissions/:rowNumber
 * Fetch a specific submission by row number
 */
app.get('/api/submissions/:rowNumber', async (req, res) => {
  try {
    const rowNumber = parseInt(req.params.rowNumber);
    console.log(`📡 Fetching submission for row ${rowNumber}...`);
    
    const submission = await googleSheetsClient.getSubmissionByRow(rowNumber);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }
    
    res.json({
      success: true,
      submission: submission
    });
  } catch (error) {
    console.error('❌ Error fetching submission:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submission',
      message: error.message
    });
  }
});

/**
 * POST /api/generate-pdf
 * Generate PDF for a specific submission
 */
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { rowNumber } = req.body;
    
    if (!rowNumber) {
      return res.status(400).json({
        success: false,
        error: 'Row number is required'
      });
    }

    console.log(`📄 Generating PDF for row ${rowNumber}...`);
    
    // Get submission data
    const submission = await googleSheetsClient.getSubmissionByRow(rowNumber);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Download images
    console.log('📥 Downloading images...');
    const [studentPhoto, fatherPhoto] = await Promise.all([
      imageFetcher.getStudentPhoto(submission),
      imageFetcher.getFatherPhoto(submission)
    ]);

    // Generate PDF
    console.log('📝 Creating PDF...');
    const pdfPath = await pdfGenerator.generatePDF(submission, studentPhoto, fatherPhoto);
    
    // Get filename from path
    const filename = path.basename(pdfPath);
    
    res.json({
      success: true,
      message: 'PDF generated successfully',
      filename: filename,
      downloadUrl: `/api/download/${filename}`,
      submission: {
        studentName: submission.studentName,
        studentNameEnglish: submission.studentNameEnglish,
        desiredClass: submission.desiredClass,
        timestamp: submission.timestamp
      }
    });

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF',
      message: error.message
    });
  }
});

/**
 * POST /api/generate-bulk
 * Generate PDFs for multiple submissions
 */
app.post('/api/generate-bulk', async (req, res) => {
  try {
    const { rowNumbers } = req.body;
    
    if (!rowNumbers || !Array.isArray(rowNumbers)) {
      return res.status(400).json({
        success: false,
        error: 'Row numbers array is required'
      });
    }

    console.log(`📄 Generating ${rowNumbers.length} PDFs...`);
    
    const results = [];
    const errors = [];

    for (const rowNumber of rowNumbers) {
      try {
        console.log(`📄 Processing row ${rowNumber}...`);
        
        // Get submission data
        const submission = await googleSheetsClient.getSubmissionByRow(rowNumber);
        if (!submission) {
          errors.push({ rowNumber, error: 'Submission not found' });
          continue;
        }

        // Download images
        const [studentPhoto, fatherPhoto] = await Promise.all([
          imageFetcher.getStudentPhoto(submission),
          imageFetcher.getFatherPhoto(submission)
        ]);

        // Generate PDF
        const pdfPath = await pdfGenerator.generatePDF(submission, studentPhoto, fatherPhoto);
        const filename = path.basename(pdfPath);
        
        results.push({
          rowNumber,
          success: true,
          filename: filename,
          downloadUrl: `/api/download/${filename}`,
          submission: {
            studentName: submission.studentName,
            studentNameEnglish: submission.studentNameEnglish,
            desiredClass: submission.desiredClass
          }
        });

      } catch (error) {
        console.error(`❌ Error processing row ${rowNumber}:`, error);
        errors.push({ rowNumber, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.length} PDFs successfully`,
      results: results,
      errors: errors,
      summary: {
        total: rowNumbers.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('❌ Error in bulk PDF generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDFs',
      message: error.message
    });
  }
});

/**
 * GET /api/download/:filename
 * Download a generated PDF file
 */
app.get('/api/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'output', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      message: error.message
    });
  }
});

/**
 * GET /api/cache/info
 * Get cache information
 */
app.get('/api/cache/info', (req, res) => {
  try {
    const cacheSize = imageFetcher.getCacheSize();
    const cacheSizeMB = (cacheSize / 1024 / 1024).toFixed(2);
    
    res.json({
      success: true,
      cacheSize: cacheSize,
      cacheSizeMB: cacheSizeMB,
      cacheDir: imageFetcher.cacheDir
    });
  } catch (error) {
    console.error('❌ Error getting cache info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cache info',
      message: error.message
    });
  }
});

/**
 * DELETE /api/cache/clear
 * Clear image cache
 */
app.delete('/api/cache/clear', (req, res) => {
  try {
    imageFetcher.clearCache();
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PDF Generator is running',
    timestamp: new Date().toISOString(),
    services: {
      googleSheets: !!googleSheetsClient,
      imageFetcher: !!imageFetcher,
      pdfGenerator: !!pdfGenerator
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log('🚀 PDF Generator server started');
      console.log(`📱 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📄 Web interface: http://localhost:${PORT}`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log('   GET  /api/submissions - List all submissions');
      console.log('   GET  /api/submissions/:rowNumber - Get specific submission');
      console.log('   POST /api/generate-pdf - Generate PDF for submission');
      console.log('   POST /api/generate-bulk - Generate multiple PDFs');
      console.log('   GET  /api/download/:filename - Download PDF');
      console.log('   GET  /api/cache/info - Get cache information');
      console.log('   DELETE /api/cache/clear - Clear image cache');
      console.log('   GET  /api/health - Health check');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down PDF Generator server...');
  if (pdfGenerator && pdfGenerator.closeBrowser) {
    await pdfGenerator.closeBrowser();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down PDF Generator server...');
  if (pdfGenerator && pdfGenerator.closeBrowser) {
    await pdfGenerator.closeBrowser();
  }
  process.exit(0);
});

// Start the server
startServer();
