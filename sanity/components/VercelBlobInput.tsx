'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { PatchEvent, set, unset, type ObjectInputProps } from 'sanity'
import {
  allowedContentTypes,
  sanitizeBlobFilename,
  uploadPathPrefix,
  validateUpload,
} from '../../src/lib/downloads/validation'
import type {
  DownloadUploadPurpose,
  VercelBlobFile,
} from '../../src/lib/downloads/types'

type BlobInputValue = Partial<VercelBlobFile> & Record<string, unknown>

export function VercelBlobInput(props: ObjectInputProps<BlobInputValue>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const purpose =
    ((props.schemaType.options as { uploadPurpose?: DownloadUploadPurpose } | undefined)
      ?.uploadPurpose || 'restricted-download')

  async function uploadFile(file: File) {
    const validationError = validateUpload({
      purpose,
      filename: file.name,
      contentType: file.type,
      size: file.size,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setProgress(0)
    setUploading(true)
    try {
      const safeName = sanitizeBlobFilename(file.name)
      const blob = await upload(`${uploadPathPrefix(purpose)}/${safeName}`, file, {
        access: 'public',
        contentType: file.type,
        multipart: file.size >= 5 * 1024 * 1024,
        handleUploadUrl: '/api/studio/downloads/upload',
        clientPayload: JSON.stringify({
          purpose,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
        onUploadProgress(event) {
          setProgress(Math.round(event.percentage))
        },
      })

      props.onChange(
        PatchEvent.from(
          set({
            _type: 'vercelBlobFile',
            pathname: blob.pathname,
            url: blob.url,
            downloadUrl: blob.downloadUrl,
            originalFilename: file.name,
            contentType: blob.contentType || file.type,
            size: file.size,
            etag: blob.etag,
            uploadedAt: new Date().toISOString(),
          }),
        ),
      )
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {props.value?.pathname ? (
        <div
          style={{
            border: '1px solid var(--card-border-color)',
            borderRadius: 6,
            padding: 12,
          }}
        >
          <strong>{props.value.originalFilename || 'Uploaded file'}</strong>
          <div style={{ marginTop: 4, opacity: 0.7, overflowWrap: 'anywhere' }}>
            {props.value.pathname}
          </div>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={allowedContentTypes(purpose).join(',')}
        disabled={uploading || props.readOnly}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void uploadFile(file)
          event.currentTarget.value = ''
        }}
      />
      {uploading ? <div>Uploading… {progress}%</div> : null}
      {error ? <div style={{ color: 'var(--card-critical-fg-color)' }}>{error}</div> : null}
      {props.value?.pathname && !props.readOnly ? (
        <button
          type="button"
          onClick={() => props.onChange(PatchEvent.from(unset()))}
          style={{ justifySelf: 'start' }}
        >
          Remove from draft
        </button>
      ) : null}
      <small style={{ opacity: 0.7 }}>
        Maximum 50 MB. Uploading updates this draft; the published website changes only after
        publishing.
      </small>
    </div>
  )
}
