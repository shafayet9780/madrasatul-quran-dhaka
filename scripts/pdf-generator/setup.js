#!/usr/bin/env node

/**
 * Setup script for PDF Generator
 * This script helps with initial setup and environment validation
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 PDF Generator Setup');
console.log('====================\n');

// Check if we're in the right directory
const expectedFiles = ['package.json', 'server.js', 'lib'];
const missingFiles = expectedFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Setup script must be run from the pdf-generator directory');
  console.error('Missing files:', missingFiles.join(', '));
  process.exit(1);
}

// Check for .env file
if (!fs.existsSync('.env')) {
  console.log('📝 Creating .env file from template...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created');
    console.log('⚠️  Please edit .env file with your actual credentials');
  } else {
    console.error('❌ .env.example file not found');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check for form questions file
if (!fs.existsSync('pre-admission-form-questions.json')) {
  console.log('📝 Copying form questions configuration...');
  const sourcePath = '../pre-admission-form-questions.json';
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, 'pre-admission-form-questions.json');
    console.log('✅ Form questions configuration copied');
  } else {
    console.error('❌ Form questions file not found at:', sourcePath);
    console.log('   Please ensure the main project has the form questions file');
  }
} else {
  console.log('✅ Form questions configuration exists');
}

// Check for fonts
const fontsDir = 'fonts';
const requiredFonts = ['NotoSansBengali-Regular.ttf', 'NotoSansBengali-Bold.ttf'];
const missingFonts = requiredFonts.filter(font => !fs.existsSync(path.join(fontsDir, font)));

if (missingFonts.length > 0) {
  console.log('📝 Downloading Bengali fonts...');
  console.log('   Missing fonts:', missingFonts.join(', '));
  console.log('   Fonts should be downloaded automatically during setup');
} else {
  console.log('✅ Bengali fonts exist');
}

// Create necessary directories
const directories = ['output', 'cache/images'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

console.log('\n📋 Setup Summary:');
console.log('================');

// Check environment variables
const envFile = fs.readFileSync('.env', 'utf8');
const requiredVars = [
  'GOOGLE_PROJECT_ID',
  'GOOGLE_PRIVATE_KEY_ID', 
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_CLIENT_ID',
  'FORM_GOOGLE_SHEETS_ID',
  'BLOB_READ_WRITE_TOKEN'
];

console.log('\n🔧 Environment Variables:');
requiredVars.forEach(varName => {
  const hasVar = envFile.includes(varName);
  console.log(`   ${hasVar ? '✅' : '❌'} ${varName}: ${hasVar ? 'SET' : 'MISSING'}`);
});

console.log('\n📁 Files and Directories:');
console.log(`   ${fs.existsSync('package.json') ? '✅' : '❌'} package.json`);
console.log(`   ${fs.existsSync('server.js') ? '✅' : '❌'} server.js`);
console.log(`   ${fs.existsSync('lib/') ? '✅' : '❌'} lib/ directory`);
console.log(`   ${fs.existsSync('public/') ? '✅' : '❌'} public/ directory`);
console.log(`   ${fs.existsSync('fonts/') ? '✅' : '❌'} fonts/ directory`);
console.log(`   ${fs.existsSync('output/') ? '✅' : '❌'} output/ directory`);
console.log(`   ${fs.existsSync('cache/') ? '✅' : '❌'} cache/ directory`);

console.log('\n📄 Configuration Files:');
console.log(`   ${fs.existsSync('.env') ? '✅' : '❌'} .env`);
console.log(`   ${fs.existsSync('pre-admission-form-questions.json') ? '✅' : '❌'} Form questions`);

console.log('\n🎯 Next Steps:');
console.log('==============');
console.log('1. Edit .env file with your actual credentials');
console.log('2. Run: npm install');
console.log('3. Run: npm start');
console.log('4. Open: http://localhost:3001');

console.log('\n📚 For detailed instructions, see README.md');
console.log('🐛 For troubleshooting, check the README troubleshooting section');

console.log('\n✨ Setup complete!');
