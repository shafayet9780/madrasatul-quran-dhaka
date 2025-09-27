import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

/**
 * API route for handling file uploads
 * Supports multiple storage options: local filesystem, Cloudinary, or AWS S3
 */

interface UploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

interface UploadOptions {
  fileType?: 'father-image' | 'student-image' | 'student-birth-certificate' | 'general';
  personName?: string;
}

// Storage configuration - Only Vercel Blob supported
const STORAGE_TYPE = 'vercel-blob';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

// File size limits based on type
const FILE_SIZE_LIMITS = {
  'image': 500 * 1024, // 500KB for images
  'pdf': 3 * 1024 * 1024, // 3MB for PDFs
  'default': 500 * 1024 // Default 500KB
};

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    const personName = formData.get('personName') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine file size limit based on file type and actual file type
    let maxFileSize = FILE_SIZE_LIMITS.default;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (isImage) {
      maxFileSize = FILE_SIZE_LIMITS.image;
    } else if (isPdf) {
      maxFileSize = FILE_SIZE_LIMITS.pdf;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      const limitMB = maxFileSize / 1024 / 1024;
      return NextResponse.json(
        { success: false, error: `File size exceeds ${limitMB}MB limit` },
        { status: 400 }
      );
    }

    // Validate file type based on the file type requested
    let allowedTypes = ALLOWED_IMAGE_TYPES;
    let typeText = 'images only';

    if (fileType === 'student-birth-certificate') {
      allowedTypes = ALLOWED_DOCUMENT_TYPES;
      typeText = 'images and PDF files';
    } else if (fileType === 'student-image' || fileType === 'father-image') {
      allowedTypes = ALLOWED_IMAGE_TYPES;
      typeText = 'images only';
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Only ${typeText} are allowed.` },
        { status: 400 }
      );
    }

    // Generate meaningful file name
    const fileName = generateFileName(file.name, personName || 'unknown', fileType);
    const uploadOptions: UploadOptions = {
      fileType: fileType as 'father-image' | 'student-image' | 'student-birth-certificate' | 'general',
      personName: personName || undefined
    };

    const uploadResponse = await uploadFile(file, fileName, uploadOptions);

    return NextResponse.json(uploadResponse);

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * Generate a meaningful file name with person's name, timestamp, and random number
 */
function generateFileName(originalName: string, personName: string, fileType?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  // Clean person name for filename
  const cleanPersonName = personName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Get file extension
  const ext = originalName.split('.').pop() || 'unknown';

    // Create folder structure based on file type
    let folder = 'general';
    if (fileType === 'father-image') {
      folder = 'father-images';
    } else if (fileType === 'student-image') {
      folder = 'student-images';
    } else if (fileType === 'student-birth-certificate') {
      folder = 'birth-certificates';
    }

  return `${folder}/${cleanPersonName}_${timestamp}_${randomNum}.${ext}`;
}

async function uploadFile(file: File, fileName: string, options?: UploadOptions): Promise<UploadResponse> {
  // Only Vercel Blob storage is supported
  return await uploadToVercelBlob(file, fileName, options);
}

async function uploadToVercelBlob(file: File, fileName: string, options?: UploadOptions): Promise<UploadResponse> {
  try {
    // Vercel Blob upload implementation
    // You'll need to install @vercel/blob: npm install @vercel/blob
    const { put } = await import('@vercel/blob');

    const bytes = await file.arrayBuffer();

    // Get the token from environment variables
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set');
    }

    // Use the full fileName which already includes the folder structure
    const blob = await put(fileName, bytes, {
      access: 'public',
      contentType: file.type,
      token: token,
    });

    return {
      success: true,
      url: blob.url,
      fileName
    };
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    return {
      success: false,
      error: 'Failed to upload to Vercel Blob'
    };
  }
}

async function uploadToLocal(file: File, fileName: string, options?: UploadOptions): Promise<UploadResponse> {
  try {
    const uploadDir = join(process.cwd(), 'public', UPLOAD_DIR);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Create subdirectories if needed (for folder structure)
    const fullPath = join(uploadDir, fileName);
    const dirPath = join(fullPath, '..');
    await mkdir(dirPath, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(fullPath, buffer);

    return {
      success: true,
      url: `/${UPLOAD_DIR}/${fileName}`,
      fileName
    };
  } catch (error) {
    console.error('Local upload error:', error);
    return {
      success: false,
      error: 'Failed to save file locally'
    };
  }
}


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
