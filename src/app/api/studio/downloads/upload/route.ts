import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import {
  allowedContentTypes,
  extensionOf,
  isUploadPurpose,
  sanitizeBlobFilename,
  uploadPathPrefix,
  validateUpload,
} from '@/lib/downloads/validation'
import { MAX_DOWNLOAD_FILE_SIZE } from '@/lib/downloads/types'
import {
  isAuthorizedStudioAdminRequest,
} from '@/lib/studio-auth'

export async function POST(request: NextRequest) {
  let body: HandleUploadBody
  try {
    body = (await request.json()) as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 })
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (
          !isAuthorizedStudioAdminRequest(request)
        ) {
          throw new Error('Studio authorization required')
        }

        let metadata: {
          purpose?: unknown
          filename?: string
          contentType?: string
          size?: number
        } = {}
        try {
          metadata = JSON.parse(clientPayload || '{}')
        } catch {
          throw new Error('Invalid upload metadata')
        }

        if (!isUploadPurpose(metadata.purpose)) throw new Error('Invalid upload purpose')
        const purpose = metadata.purpose
        const validationError = validateUpload({
          purpose,
          filename: metadata.filename || '',
          contentType: metadata.contentType || '',
          size: metadata.size || 0,
        })
        if (validationError) throw new Error(validationError)
        const expectedPathname = `${uploadPathPrefix(purpose)}/${sanitizeBlobFilename(metadata.filename || '')}`
        if (
          pathname !== expectedPathname ||
          extensionOf(pathname) !== extensionOf(metadata.filename || '')
        ) {
          throw new Error('Invalid upload pathname')
        }

        return {
          allowedContentTypes: allowedContentTypes(purpose),
          maximumSizeInBytes: MAX_DOWNLOAD_FILE_SIZE,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ purpose }),
        }
      },
      onUploadCompleted: async () => {
        // The SDK validates Blob's completion callback signature.
        // Publishing and cleanup are handled separately through Sanity.
      },
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Studio Blob upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
