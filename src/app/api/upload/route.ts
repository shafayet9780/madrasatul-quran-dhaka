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

// Storage configuration - Only Vercel Blob supported
const STORAGE_TYPE = 'vercel-blob';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 500KB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    const fileName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadResponse = await uploadFile(file, fileName);

    return NextResponse.json(uploadResponse);

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

async function uploadFile(file: File, fileName: string): Promise<UploadResponse> {
  // Only Vercel Blob storage is supported
  return await uploadToVercelBlob(file, fileName);
}

async function uploadToVercelBlob(file: File, fileName: string): Promise<UploadResponse> {
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

    const blob = await put(`students/${fileName}`, bytes, {
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

async function uploadToLocal(file: File, fileName: string): Promise<UploadResponse> {
  try {
    const uploadDir = join(process.cwd(), 'public', UPLOAD_DIR);

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

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
