const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Simple Image Fetcher (without Sharp dependency)
 * Fallback version for when Sharp installation fails
 */
class SimpleImageFetcher {
  constructor() {
    this.cacheDir = path.join(__dirname, '../cache/images');
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Download and cache an image from URL (without processing)
   * @param {string} imageUrl - The image URL
   * @param {string} type - The image type (student-image, father-image)
   * @param {string} personName - The person's name for filename
   * @returns {Promise<string>} The local file path
   */
  async downloadAndCacheImage(imageUrl, type, personName = 'unknown') {
    try {
      if (!imageUrl || imageUrl === '') {
        console.log(`⚠️ No image URL provided for ${type}`);
        return null;
      }

      // Generate cache filename
      const filename = this.generateCacheFilename(imageUrl, type, personName);
      const filePath = path.join(this.cacheDir, filename);

      // Check if already cached
      if (fs.existsSync(filePath)) {
        console.log(`📁 Using cached image: ${filename}`);
        return filePath;
      }

      console.log(`📥 Downloading image: ${imageUrl}`);
      
      // Download image without processing
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 seconds timeout
        headers: {
          'User-Agent': 'PDF-Generator/1.0'
        }
      });

      // Save to cache without processing
      fs.writeFileSync(filePath, response.data);
      console.log(`✅ Image cached: ${filename}`);

      return filePath;

    } catch (error) {
      console.error(`❌ Error downloading image ${imageUrl}:`, error.message);
      return null;
    }
  }

  /**
   * Get image as base64 for jsPDF
   * @param {string} imageUrl - The image URL
   * @param {string} type - The image type
   * @param {string} personName - The person's name
   * @returns {Promise<string|null>} Base64 string or null
   */
  async getImageAsBase64(imageUrl, type, personName) {
    try {
      const filePath = await this.downloadAndCacheImage(imageUrl, type, personName);
      if (!filePath) return null;

      const imageBuffer = fs.readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      
      // Get file extension for MIME type
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 
                      ext === '.png' ? 'image/png' : 'image/jpeg';

      return `data:${mimeType};base64,${base64}`;

    } catch (error) {
      console.error('❌ Error converting image to base64:', error);
      return null;
    }
  }

  /**
   * Get student photo
   * @param {Object} submission - The submission object
   * @returns {Promise<string|null>} Base64 image or null
   */
  async getStudentPhoto(submission) {
    const studentPhotoUrl = submission.rawData.student_photo || '';
    const studentName = submission.studentName || 'student';
    
    return await this.getImageAsBase64(studentPhotoUrl, 'student-image', studentName);
  }

  /**
   * Get father photo
   * @param {Object} submission - The submission object
   * @returns {Promise<string|null>} Base64 image or null
   */
  async getFatherPhoto(submission) {
    const fatherPhotoUrl = submission.rawData.father_photo || '';
    const fatherName = submission.fatherName || 'father';
    
    return await this.getImageAsBase64(fatherPhotoUrl, 'father-image', fatherName);
  }

  /**
   * Generate cache filename
   * @param {string} imageUrl - The image URL
   * @param {string} type - The image type
   * @param {string} personName - The person's name
   * @returns {string} The cache filename
   */
  generateCacheFilename(imageUrl, type, personName) {
    // Extract filename from URL or generate one
    const urlParts = imageUrl.split('/');
    const originalFilename = urlParts[urlParts.length - 1];
    
    // Clean person name
    const cleanPersonName = personName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Get file extension
    const ext = originalFilename.split('.').pop() || 'jpg';

    return `${type}_${cleanPersonName}_${timestamp}.${ext}`;
  }

  /**
   * Clear cache directory
   */
  clearCache() {
    try {
      if (fs.existsSync(this.cacheDir)) {
        const files = fs.readdirSync(this.cacheDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(this.cacheDir, file));
        });
        console.log('🗑️ Cache cleared');
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Get cache size
   * @returns {number} Cache size in bytes
   */
  getCacheSize() {
    try {
      if (!fs.existsSync(this.cacheDir)) return 0;

      let totalSize = 0;
      const files = fs.readdirSync(this.cacheDir);
      
      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return totalSize;
    } catch (error) {
      console.error('❌ Error calculating cache size:', error);
      return 0;
    }
  }
}

module.exports = SimpleImageFetcher;
