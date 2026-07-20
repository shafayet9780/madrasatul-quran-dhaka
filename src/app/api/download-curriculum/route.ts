import { servePublicDownload } from '@/lib/downloads/public-files'

export async function GET() {
  return servePublicDownload('curriculum')
}
