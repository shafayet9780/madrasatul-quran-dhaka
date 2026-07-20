# Downloads Library Operations

The downloads library uses the existing public Vercel Blob store and Sanity dataset. Access links are an application-level sharing control; they do not make the underlying public Blob objects confidential.

## Environment

Configure these values in every deployed environment:

```text
BLOB_READ_WRITE_TOKEN=...
BLOB_STORE_URL=https://...public.blob.vercel-storage.com
DOWNLOADS_LINK_SIGNING_SECRET=<at least 32 random bytes>
SANITY_DOWNLOADS_WEBHOOK_SECRET=<a different random secret>
CRON_SECRET=<a third random secret>
DOWNLOADS_ORPHAN_GRACE_DAYS=7
STUDIO_AUTH_ENABLED=true
STUDIO_USERNAME=...
STUDIO_PASSWORD=...
NEXT_PUBLIC_SITE_URL=https://madrasatul-quran.edu.bd
```

Production Studio and its administrative actions fail closed when Basic Auth is disabled or incomplete. `DOWNLOADS_LINK_SIGNING_SECRET` signs both share links and their access cookies. Rotating it immediately invalidates all active links and cookies.

## Editor workflow

1. Create and publish download categories.
2. Create a downloadable, upload its file, and publish it.
3. Use **Generate share link** on a published category or downloadable.
4. Select 1, 7, or 30 days, or **Never expires**, then generate and copy the link.
5. Use the Studio **Download Links** tool for a library-wide link.

**Never expires** is available only for category and individual-file links. The link itself remains valid until an editor uses **Revoke existing share links** on that category or file. The browser access cookie is a session cookie, so a recipient may need to reopen the original link after closing their browser. Library-wide links must use an expiring preset.

Revoking a category link invalidates current links to that category but does not revoke separately generated item links. Revoking an item link affects only that item. Older version-1 links generated before this feature cannot be individually revoked, but they retain their original maximum 30-day expiry.

Uploads modify only the current draft. The live file remains unchanged until the document is published. Public prospectus, curriculum, and parents’ code-of-conduct files are maintained in **Downloads Library → Public Download Files** and also require publication.

## Sanity webhook

Create one GROQ-powered webhook in the Sanity project dashboard:

- Name: `Downloads Blob cleanup`
- URL: `https://<production-domain>/api/webhooks/sanity/downloads`
- Dataset: the production website dataset
- Trigger on: update
- Filter:

```groq
_type in ["downloadable", "publicDownloadSettings"]
```

- Projection:

```groq
{
  "afterId": after()._id,
  "beforeFiles": [
    before().file,
    before().prospectus,
    before().curriculum,
    before().codeOfConduct
  ],
  "afterFiles": [
    after().file,
    after().prospectus,
    after().curriculum,
    after().codeOfConduct
  ]
}
```

- Enable drafts: off
- Secret: exactly `SANITY_DOWNLOADS_WEBHOOK_SECRET`

The handler validates the signature against the raw request body, ignores deleted/unpublished documents, checks fresh published references, deletes only replaced unreferenced paths, and revalidates download caches. Duplicate deliveries and already-deleted objects are safe. A transient Blob error returns `503` so Sanity can retry.

## Scheduled orphan cleanup

The repository includes a Vercel Cron entry in `vercel.json`. It calls:

```text
GET /api/cron/downloads-cleanup
Schedule: 0 3 * * 0
```

This runs every Sunday at 03:00 UTC (09:00 in Dhaka). The route requires `Authorization: Bearer <CRON_SECRET>`; Vercel adds that header automatically when the project has a `CRON_SECRET` environment variable. Vercel invokes the schedule only for production deployments, not preview deployments.

Configure the production Vercel project with:

1. `CRON_SECRET`: a strong random value, different from the link and webhook secrets.
2. `DOWNLOADS_ORPHAN_GRACE_DAYS=7` (or another positive whole number).
3. `SANITY_API_TOKEN`: a token that can read both drafts and published documents.
4. `BLOB_READ_WRITE_TOKEN`: access to the existing Blob store.
5. Deploy the repository, then confirm `/api/cron/downloads-cleanup` appears under the project's Cron Jobs settings.

The job lists only objects under `downloads/`. It first loads every Blob pathname referenced by any draft or published `downloadable` or `publicDownloadSettings` document. It then deletes only unreferenced objects older than the grace period, with at most 100 deletions per run. If the managed prefix grows beyond 1,000 objects, Sanity cannot be queried, the token is missing, or Blob deletion fails, the job returns `503` without starting an unsafe unbounded cleanup. Review the Blob store manually if the 1,000-object limit is reached.

To invoke the same job manually during local testing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/downloads-cleanup
```

This is a real cleanup, not a dry run. Use it only when local environment variables point to the intended Sanity dataset and Blob store.

## One-time public-file migration

The three existing public endpoints use their canonical Blob objects under `prospectus/` and `curriculum/` whenever no CMS file is published. After deploying the schemas and environment variables, run this explicitly from an authorized environment:

```bash
pnpm migrate:public-downloads
```

The script loads the local project environment from `.env.local` and creates a draft. Review the generated `publicDownloadSettings` document in Studio and publish it. Then confirm:

- `/api/download-prospectus`
- `/api/download-curriculum`
- `/api/download-code-of-conduct`

Do not remove these canonical public paths. They are permanent defaults even after CMS delivery has been verified.

## Maintenance

- Replace a file by uploading to the draft and publishing it.
- Use the document's **Revoke existing share links** action to revoke its newly generated category/item links. Rotate the link-signing secret only when every link and cookie must be invalidated.
- Publishing a replacement triggers immediate cleanup of the previous file when no published record still references it and its pathname is under `downloads/`.
- Only objects under `downloads/` are eligible for automatic cleanup. Every other Blob pathname is treated as public/unmanaged and is never removed by either cleanup mechanism.
- Draft replacements, uploads never attached to a document, and files left by deleted/unpublished documents are removed by the weekly cleanup only after they are unreferenced and older than the configured grace period.
- Never publish or return raw Blob URLs from page components or public content APIs. Protected file downloads must use `/api/downloads/file/{itemId}`.

The share gate is intentionally lightweight. Anyone who discovers a raw public Blob URL or receives a downloaded copy can redistribute it.
