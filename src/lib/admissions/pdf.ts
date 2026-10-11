import 'server-only';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { getAdmissionsDb } from './db';
import type { Application } from './drafts';
import type { FileAnswer } from './answers';
import type { FormSnapshot } from './form-config';
import { latestPayment } from './payments';
import { applicationHtml, footerTemplate, type PdfData } from './pdf-html';
import { conductPageHtml, guardianCopyHtml, offlineFooterTemplate, offlineFormHtml, offlineHeaderTemplate, type OfflineData } from './offline-html';
import { applications } from './schema';
import { blobStore, type BlobStore } from './uploads';
import { whatsappQrSvg } from './whatsapp-qr';
import { isOwnKey } from './files';
import { activePhones } from '@/lib/contact';

// The application PDF: HTML (pdf-html.ts) printed by headless Chromium, so Bengali conjuncts in
// names are shaped correctly. Made once after payment, kept in the private store (pdf_key), and
// served to the guardian, attached to the email and downloaded by the office.

const FONT_FILES = [
  ['Noto Sans Bengali', '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff2', 400],
  ['Noto Sans Bengali', '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-600-normal.woff2', 600],
  ['Noto Sans Bengali', '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-700-normal.woff2', 700],
  ['Inter', '@fontsource/inter/files/inter-latin-400-normal.woff2', 400],
  ['Inter', '@fontsource/inter/files/inter-latin-600-normal.woff2', 600],
  ['Inter', '@fontsource/inter/files/inter-latin-700-normal.woff2', 700],
] as const;

let fontCss: string | undefined;
function embeddedFonts(): string {
  fontCss ??= FONT_FILES.map(([family, file, weight]) => {
    const data = readFileSync(join(process.cwd(), 'node_modules', file)).toString('base64');
    return `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${data}) format('woff2')}`;
  }).join('\n');
  return fontCss;
}

/** Local Chromium (development, e2e) or the slim serverless build fetched once per instance on Vercel. */
async function launchBrowser() {
  const puppeteer = (await import('puppeteer-core')).default;
  const local = process.env.CHROMIUM_EXECUTABLE_PATH || ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => !process.env.VERCEL && existsSync(p));
  if (local) return puppeteer.launch({ executablePath: local, headless: true, args: ['--no-sandbox', '--font-render-hinting=none'] });
  const chromium = (await import('@sparticuz/chromium-min')).default;
  const pack = process.env.CHROMIUM_PACK_URL || 'https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar';
  return puppeteer.launch({ executablePath: await chromium.executablePath(pack), headless: true, args: chromium.args });
}

async function streamToDataUri(store: BlobStore, key: string): Promise<string | undefined> {
  const file = await store.get(key).catch(() => null);
  if (!file) return undefined;
  const bytes = Buffer.from(await new Response(file.stream).arrayBuffer());
  return `data:${file.contentType};base64,${bytes.toString('base64')}`;
}

async function schoolInfo() {
  try {
    const { getContentService } = await import('@/lib/content-service');
    const { urlFor } = await import('@/lib/sanity');
    const site = await getContentService(false).getSiteSettings();
    let logo: string | null = null;
    if (site?.logo?.asset) {
      const res = await fetch(urlFor(site.logo).width(160).height(160).url(), { signal: AbortSignal.timeout(8000) }).catch(() => null);
      if (res?.ok) logo = `data:${res.headers.get('content-type') ?? 'image/png'};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    }
    const contact = site?.contactInfo;
    const address = typeof contact?.address === 'string' ? contact.address : contact?.address?.bengali;
    // The admissions number, else an active admission line, else the primary number.
    const phones = activePhones(contact);
    const phone = contact?.admissionsPhone || (phones.find((p) => p.type === 'admission') ?? phones[0])?.number;
    // Every active number with its label, for the guardian's copy of the offline form.
    const contacts = phones.map((p) => ({ label: (typeof p.label === 'string' ? p.label : p.label?.bengali) ?? '', number: p.number }));
    return { name: 'মাদরাসাতুল কুরআন', line: [address, phone].filter(Boolean).join(' · '), logo, phone: phone ?? '', phones: contacts };
  } catch {
    return { name: 'মাদরাসাতুল কুরআন', line: '', logo: null, phone: '', phones: [] };
  }
}

const svgQr = (text: string, size: number) => QRCode.toString(text, { type: 'svg', margin: 0, width: size, errorCorrectionLevel: 'M' });

/** Everything the template needs, gathered from the database, the private store and Sanity. */
export async function pdfData(app: Application, snapshot: FormSnapshot, origin: string, store = blobStore()): Promise<PdfData> {
  const payment = await latestPayment(app.id);
  const photos: Record<string, string> = {};
  for (const f of snapshot.sections.flatMap((s) => s.fields)) {
    const v = app.answers[f.key] as FileAnswer | undefined;
    if (f.type === 'file' && f.fileKind === 'photo' && v?.key && isOwnKey(app.id, v.key)) {
      const uri = await streamToDataUri(store, v.key);
      if (uri) photos[f.key] = uri;
    }
  }
  const paid = payment?.status === 'valid' ? payment : null;
  return {
    snapshot,
    answers: app.answers,
    publicRef: app.publicRef ?? '',
    studentNameBn: app.studentNameBn ?? '',
    studentNameEn: app.studentNameEn,
    submittedAt: app.submittedAt,
    declaredAt: app.declaredAt,
    conductPledgedAt: app.conductPledgedAt,
    familyDeclaredAt: app.familyDeclaredAt,
    fatherName: app.fatherName,
    motherName: app.motherName,
    receipt: paid
      ? { amount: paid.amount, method: (paid.cardType?.split('-').at(-1) ?? 'SSLCommerz').trim(), transactionId: paid.bankTranId || paid.tranId, paidAt: paid.completedAt }
      : null,
    photos,
    staffQrSvg: await svgQr(`${origin}/admin/admissions/${app.id}`, 112),
    whatsappQrSvg: snapshot.settings.whatsappUrl ? await whatsappQrSvg(snapshot.settings.whatsappUrl, { size: 120, ink: 'print' }) : null,
    school: await schoolInfo(),
    fontCss: embeddedFonts(),
    generatedAt: new Date(),
  };
}

/** The application is printed on 4 pages ("এই আবেদনপত্রটি (৪ পৃষ্ঠা) প্রিন্ট করুন"). */
const APPLICATION_PAGES = 4;

export async function renderPdf(data: PdfData): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const print = async (tight: boolean) => {
      await page.setContent(applicationHtml(data, tight), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      return page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: footerTemplate(data.publicRef, data.studentNameBn, data.fontCss, data.snapshot.settings.session),
      });
    };
    // Longer answers or questions added in Sanity can push a page over: print again, tighter.
    const pdf = await print(false);
    if ((await PDFDocument.load(pdf)).getPageCount() <= APPLICATION_PAGES) return pdf;
    return await print(true);
  } finally {
    await browser.close();
  }
}

/** mqd_pre_admission_application_KG-017_2026-10-09_12-54.pdf: the ID and when it was paid (Dhaka time). */
export function pdfFileName(app: Pick<Application, 'publicRef' | 'paidAt'>): string {
  const paid = new Date((app.paidAt ?? new Date()).getTime() + 6 * 60 * 60 * 1000).toISOString();
  return `mqd_pre_admission_application_${app.publicRef}_${paid.slice(0, 10)}_${paid.slice(11, 13)}-${paid.slice(14, 16)}.pdf`;
}

/**
 * The stored PDF of a paid application, made on first use. Two simultaneous first requests may
 * both render; the second write replaces the first with an identical file. A PDF stored under an
 * older file name (an earlier layout) is made again.
 */
export async function ensureApplicationPdf(app: Application, snapshot: FormSnapshot, origin: string, store = blobStore()): Promise<{ key: string; bytes?: Uint8Array }> {
  if (!app.publicRef) throw new Error('The application is not paid yet');
  const key = `admissions/${app.id}/${pdfFileName(app)}`;
  const stored = app.pdfKey === key ? await readStoredPdf(key, store) : null;
  if (stored) return { key, bytes: stored };
  const bytes = await renderPdf(await pdfData(app, snapshot, origin, store));
  await store.put(key, bytes, 'application/pdf', { overwrite: true });
  await getAdmissionsDb().update(applications).set({ pdfKey: key, updatedAt: new Date() }).where(eq(applications.id, app.id));
  if (app.pdfKey && app.pdfKey !== key) await store.del(app.pdfKey).catch(() => {});
  return { key, bytes };
}

export async function readStoredPdf(key: string, store = blobStore()): Promise<Uint8Array | null> {
  const file = await store.get(key).catch(() => null);
  return file ? new Uint8Array(await new Response(file.stream).arrayBuffer()) : null;
}

/** The offline form's data: the current form version, the school, the WhatsApp group QR (large, for paper). */
export async function offlineData(snapshot: FormSnapshot, origin: string): Promise<OfflineData> {
  const school = await schoolInfo();
  return {
    snapshot,
    school: { ...school, website: new URL(origin).host.replace(/^www\./, '') },
    whatsappQrSvg: snapshot.settings.whatsappUrl ? await whatsappQrSvg(snapshot.settings.whatsappUrl, { size: 170, ink: 'print' }) : null,
    fontCss: embeddedFonts(),
  };
}

/**
 * Pages 1–5 and page 6 (the guardian's copy) as one PDF. Pages 2–5 repeat the application ID line
 * in the header; page 1 has it in its office box, so page 1 is printed again without the header.
 */
export async function renderOfflinePdf(data: OfflineData): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const session = data.snapshot.settings.session;
  const browser = await launchBrowser();
  try {
    const open = async (html: string) => {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      return page;
    };
    const options = { format: 'A4', printBackground: true, preferCSSPageSize: true } as const;
    const formPage = await open(offlineFormHtml(data));
    const printForm = async () =>
      PDFDocument.load(
        await formPage.pdf({ ...options, displayHeaderFooter: true, headerTemplate: offlineHeaderTemplate(session, data.fontCss), footerTemplate: offlineFooterTemplate(session, data.fontCss) }),
      );
    let form = await printForm();
    // The instructions name the pages to hand in ("পৃষ্ঠা ১ থেকে ৪"): print again if a longer form needs more.
    if (form.getPageCount() !== (data.formPages ?? 4)) {
      await formPage.setContent(offlineFormHtml({ ...data, formPages: form.getPageCount() }), { waitUntil: 'load' });
      await formPage.evaluate(() => document.fonts.ready);
      form = await printForm();
    }
    const first = await PDFDocument.load(
      await formPage.pdf({
        ...options,
        pageRanges: '1',
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: offlineFooterTemplate(session, data.fontCss, form.getPageCount()),
      }),
    );
    const conductHtml = conductPageHtml({ ...data, formPages: form.getPageCount() });
    const conduct = conductHtml ? await PDFDocument.load(await (await open(conductHtml)).pdf(options)) : null;
    const copy = await PDFDocument.load(await (await open(guardianCopyHtml(data))).pdf(options));
    const merged = await PDFDocument.create();
    const [page1] = await merged.copyPages(first, [0]);
    merged.addPage(page1);
    for (const page of await merged.copyPages(form, form.getPageIndices().slice(1))) merged.addPage(page);
    if (conduct) for (const page of await merged.copyPages(conduct, conduct.getPageIndices())) merged.addPage(page);
    for (const page of await merged.copyPages(copy, copy.getPageIndices())) merged.addPage(page);
    return await merged.save();
  } finally {
    await browser.close();
  }
}

/**
 * mqd_pre_admission_form_2027_v3.pdf for the current form version. Stored under a hash of its pages,
 * so a new form version, a layout change or new school details make it again on the next download.
 */
export async function ensureOfflinePdf(cycle: { session: string; version: number; snapshot: FormSnapshot }, origin: string, store = blobStore()): Promise<{ name: string; bytes: Uint8Array }> {
  const name = `mqd_pre_admission_form_${cycle.session}_v${cycle.version}.pdf`;
  const data = await offlineData(cycle.snapshot, origin);
  const hash = createHash('sha256').update(offlineFormHtml(data)).update(conductPageHtml(data) ?? '').update(guardianCopyHtml(data)).digest('hex').slice(0, 16);
  const key = `admissions/offline/${name.replace(/\.pdf$/, '')}_${hash}.pdf`;
  const stored = await readStoredPdf(key, store);
  if (stored) return { name, bytes: stored };
  const bytes = await renderOfflinePdf(data);
  await store.put(key, bytes, 'application/pdf', { overwrite: true });
  return { name, bytes };
}
