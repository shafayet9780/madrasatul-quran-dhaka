import { createClient } from '@sanity/client'
import { head } from '@vercel/blob'
import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env.local') })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN
const baseUrl = process.env.BLOB_STORE_URL?.replace(/\/$/, '')

if (!projectId || !dataset || !token || !baseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_TOKEN, and BLOB_STORE_URL are required',
  )
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
  // Drafts too, so an existing draft is seen.
  perspective: 'raw',
})

const files = {
  prospectus: {
    url: `${baseUrl}/prospectus/madrasatul-quran-prospectus.pdf`,
    originalFilename: 'Madrasatul-Quran-Prospectus.pdf',
  },
  curriculum: {
    url: `${baseUrl}/curriculum/madrasatul_quran_detailed_curriculum.pdf`,
    originalFilename: 'Madrasatul-Quran-Detailed-Curriculum.pdf',
  },
  codeOfConduct: {
    url: `${baseUrl}/prospectus/parents_code_of_conduct_mqd.pdf`,
    originalFilename: 'Madrasatul-Quran-Parents-Code-of-Conduct.pdf',
  },
}

async function metadata(url: string, originalFilename: string) {
  const blob = await head(url)
  return {
    _type: 'vercelBlobFile',
    pathname: blob.pathname,
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    originalFilename,
    contentType: blob.contentType,
    size: blob.size,
    etag: blob.etag,
    uploadedAt: blob.uploadedAt.toISOString(),
  }
}

async function main() {
  console.log(`Project ${projectId}, dataset ${dataset}`)
  // Only into an empty Studio: a draft or a published document may hold an editor's uploads.
  const existing = await client.fetch<string[]>(`*[_id in ["publicDownloadSettings", "drafts.publicDownloadSettings"]]._id`)
  if (existing.length) {
    console.log(`Public PDFs already exists (${existing.join(', ')}): nothing to do.`)
    return
  }

  const [prospectus, curriculum, codeOfConduct] = await Promise.all([
    metadata(files.prospectus.url, files.prospectus.originalFilename),
    metadata(files.curriculum.url, files.curriculum.originalFilename),
    metadata(files.codeOfConduct.url, files.codeOfConduct.originalFilename),
  ])

  await client.create({
    _id: 'drafts.publicDownloadSettings',
    _type: 'publicDownloadSettings',
    prospectus,
    curriculum,
    codeOfConduct,
  })

  console.log('Initialized publicDownloadSettings. Review and publish it in Sanity Studio.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
