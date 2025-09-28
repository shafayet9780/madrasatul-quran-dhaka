const { createClient } = require('@sanity/client');
const { config } = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function extractFormQuestions() {
  try {
    console.log('📋 Extracting pre-admission form questions...');

    const formData = await client.fetch('*[_type == "preAdmissionForm"][0]');
    if (!formData) {
      console.log('❌ No pre-admission form found in CMS.');
      return;
    }

    const extractedData = {
      formTitle: formData.formSettings?.formTitle?.bengali || 'প্রাক-ভর্তি ফরম',
      formDescription: formData.formSettings?.formDescription?.bengali || '',
      sections: []
    };

    // Helper function to extract field data
    const extractField = (field, sectionName) => {
      const fieldData = {
        sectionName,
        fieldName: field.fieldName || '',
        questionTitle: field.label?.bengali || field.question?.bengali || '',
        questionType: field.fieldType || '',
        isRequired: field.isRequired || false,
        placeholder: field.placeholder?.bengali || '',
        helpText: field.helpText?.bengali || '',
        options: []
      };

      // Extract options for choice-based fields
      if (field.options && Array.isArray(field.options)) {
        fieldData.options = field.options.map(option => ({
          label: option.label?.bengali || option.value || '',
          value: option.value || ''
        }));
      }

      // Add file type info for file uploads
      if (field.fieldType === 'file' && field.fileType) {
        fieldData.fileType = field.fileType;
      }

      return fieldData;
    };

    // Extract General Questions
    if (formData.generalQuestions && formData.generalQuestions.length > 0) {
      extractedData.sections.push({
        sectionTitle: 'সাধারণ প্রশ্নাবলী',
        sectionNameEn: 'General Questions',
        fields: formData.generalQuestions.map(field => extractField(field, 'General Questions'))
      });
    }

    // Extract Student Information Fields
    if (formData.studentInfoFields && formData.studentInfoFields.length > 0) {
      extractedData.sections.push({
        sectionTitle: 'শিক্ষার্থীর তথ্য',
        sectionNameEn: 'Student Information',
        fields: formData.studentInfoFields.map(field => extractField(field, 'Student Information'))
      });
    }

    // Extract Father Information Fields
    if (formData.parentInfoFields?.fatherFields && formData.parentInfoFields.fatherFields.length > 0) {
      extractedData.sections.push({
        sectionTitle: 'পিতার তথ্য',
        sectionNameEn: 'Father Information',
        fields: formData.parentInfoFields.fatherFields.map(field => extractField(field, 'Father Information'))
      });
    }

    // Extract Mother Information Fields
    if (formData.parentInfoFields?.motherFields && formData.parentInfoFields.motherFields.length > 0) {
      extractedData.sections.push({
        sectionTitle: 'মাতার তথ্য',
        sectionNameEn: 'Mother Information',
        fields: formData.parentInfoFields.motherFields.map(field => extractField(field, 'Mother Information'))
      });
    }

    // Extract Additional Questions
    if (formData.additionalQuestions && formData.additionalQuestions.length > 0) {
      extractedData.sections.push({
        sectionTitle: 'অতিরিক্ত তথ্য',
        sectionNameEn: 'Additional Information',
        fields: formData.additionalQuestions.map(field => extractField(field, 'Additional Information'))
      });
    }

    // Extract Contact Information Fields
    if (formData.contactInfoFields && formData.contactInfoFields.length > 0) {
      extractedData.sections.push({
        sectionTitle: 'যোগাযোগের তথ্য',
        sectionNameEn: 'Contact Information',
        fields: formData.contactInfoFields.map(field => extractField(field, 'Contact Information'))
      });
    }

    // Add declaration text
    if (formData.declarationText) {
      extractedData.declarationText = formData.declarationText.bengali || '';
    }

    // Save to JSON file
    const outputFile = 'pre-admission-form-questions.json';
    fs.writeFileSync(outputFile, JSON.stringify(extractedData, null, 2), 'utf8');

    console.log('✅ Form questions extracted successfully!');
    console.log(`📄 Saved to: ${outputFile}`);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Total sections: ${extractedData.sections.length}`);
    
    let totalFields = 0;
    extractedData.sections.forEach(section => {
      console.log(`   - ${section.sectionTitle}: ${section.fields.length} fields`);
      totalFields += section.fields.length;
    });
    
    console.log(`   - Total fields: ${totalFields}`);
    console.log('');
    console.log('📋 Field Types Found:');
    
    const fieldTypes = new Set();
    extractedData.sections.forEach(section => {
      section.fields.forEach(field => {
        fieldTypes.add(field.questionType);
      });
    });
    
    Array.from(fieldTypes).sort().forEach(type => {
      console.log(`   - ${type}`);
    });

    console.log('');
    console.log('🤖 Ready for AI PDF Generation!');
    console.log('💡 You can now provide this JSON file to AI to create a Bengali PDF form.');

    // Also create a simplified text version for quick review
    const textOutput = generateTextSummary(extractedData);
    fs.writeFileSync('pre-admission-form-summary.txt', textOutput, 'utf8');
    console.log('📝 Also created: pre-admission-form-summary.txt (for quick review)');

  } catch (error) {
    console.error('❌ Error extracting form questions:', error);
    if (error.message.includes('token')) {
      console.log('\n💡 Make sure you have set the SANITY_API_TOKEN environment variable with read permissions.');
    }
  }
}

function generateTextSummary(data) {
  let output = `${data.formTitle}\n`;
  output += '='.repeat(data.formTitle.length) + '\n\n';
  
  if (data.formDescription) {
    output += `${data.formDescription}\n\n`;
  }

  data.sections.forEach(section => {
    output += `${section.sectionTitle} (${section.sectionNameEn})\n`;
    output += '-'.repeat(section.sectionTitle.length) + '\n';
    
    section.fields.forEach((field, index) => {
      output += `${index + 1}. ${field.questionTitle}\n`;
      output += `   Type: ${field.questionType}`;
      if (field.isRequired) output += ' (Required)';
      output += '\n';
      
      if (field.placeholder) {
        output += `   Placeholder: ${field.placeholder}\n`;
      }
      
      if (field.helpText) {
        output += `   Help: ${field.helpText}\n`;
      }
      
      if (field.options && field.options.length > 0) {
        output += `   Options:\n`;
        field.options.forEach(option => {
          output += `     - ${option.label}\n`;
        });
      }
      
      if (field.fileType) {
        output += `   File Type: ${field.fileType}\n`;
      }
      
      output += '\n';
    });
    
    output += '\n';
  });

  if (data.declarationText) {
    output += 'Declaration Text:\n';
    output += '-'.repeat(17) + '\n';
    output += `${data.declarationText}\n\n`;
  }

  return output;
}

// Run the script
extractFormQuestions();

