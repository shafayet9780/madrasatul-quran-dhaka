import { ageOn, sessionStart } from './age';
import { answerText } from './answer-text';
import { isVisible, type Answers } from './answers';
import { dateTime, longDate, num, taka, txt } from './display';
import type { FormField, FormSnapshot } from './form-config';

// The application PDF as one HTML document (docs/pre-admission-mockups/Pdf1–3), printed to A4 by
// Chromium (pdf.ts). Always Bengali: it is the office's working copy on evaluation day. Fonts,
// photos and QR codes arrive inline (data URIs, SVG), so printing needs no network.

export type PdfData = {
  snapshot: FormSnapshot;
  answers: Answers;
  publicRef: string;
  studentNameBn: string;
  studentNameEn: string | null;
  submittedAt: Date | null;
  declaredAt: Date | null;
  receipt: { amount: number; method: string; transactionId: string; paidAt: Date | null } | null;
  /** Data URIs keyed by field key (photos). */
  photos: Record<string, string>;
  staffQrSvg: string;
  whatsappQrSvg: string | null;
  school: { name: string; line: string; logo: string | null };
  /** @font-face rules with embedded fonts. */
  fontCss: string;
  generatedAt: Date;
};

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const bn = (value: number | string) => num(value, 'bengali');
const LABELS = { yes: 'হ্যাঁ', no: 'না', notGiven: 'দেওয়া হয়নি', fileAttached: () => 'অনলাইনে জমা' };
const isPhoto = (f: FormField) => f.type === 'file' && f.fileKind === 'photo';
const latin = (s: string) => /^[\x20-\x7e]+$/.test(s);

function value(f: FormField, answers: Answers): string {
  const text = answerText(f, answers[f.key], 'bengali', LABELS);
  return `<td${latin(text) ? ' class="lat"' : ''}>${esc(text)}</td>`;
}

function photoBox(src: string | undefined, w: number, h: number, alt: string) {
  return src
    ? `<img src="${src}" alt="${esc(alt)}" style="width:${w}px;height:${h}px" class="photo">`
    : `<div class="photo empty" style="width:${w}px;height:${h}px">ছবি</div>`;
}

const sectionTitle = (n: number, title: string) => `<h2 class="sec"><span>${bn(n)}</span>${esc(title)}</h2>`;

const row = (label: string, cell: string) => `<tr><th>${esc(label)}</th>${cell}</tr>`;

/** One chapter: its title, a label / answer table and, for a parent, the photo beside it. */
function sectionHtml(n: number, title: string, rows: string, photo?: string) {
  const table = `<table class="qa"><tbody>${rows}</tbody></table>`;
  return `<section class="block">${sectionTitle(n, title)}${photo ? `<div class="with-photo">${table}${photo}</div>` : table}</section>`;
}

export function applicationHtml(d: PdfData): string {
  const { snapshot, answers } = d;
  const s = snapshot.settings;
  const session = bn(s.session);
  const sections = snapshot.sections.map((sec) => ({ ...sec, fields: sec.fields.filter((f) => isVisible(f, answers)) }));
  const [first, ...rest] = sections;
  const allFields = sections.flatMap((x) => x.fields);
  const studentPhoto = allFields.find((f) => f.role === 'studentPhoto');
  const classField = allFields.find((f) => f.role === 'classApplied');
  const classLabel = classField ? answerText(classField, answers[classField.key], 'bengali', LABELS) : '';
  const dobField = allFields.find((f) => f.role === 'dateOfBirth');
  const age = dobField && typeof answers[dobField.key] === 'string' ? ageOn(answers[dobField.key] as string, sessionStart(s.session)) : null;

  // The student chapter, with the age at the session start after the date of birth.
  const studentRows = first.fields
    .filter((f) => !isPhoto(f))
    .flatMap((f) => {
      const r = row(txt(f.label, 'bengali'), value(f, answers));
      return f.role === 'dateOfBirth' && age ? [r, row('বয়স (শিক্ষাবর্ষের শুরুতে)', `<td>${bn(age.years)} বছর ${bn(age.months)} মাস</td>`)] : [r];
    })
    .join('');

  const restHtml = rest
    .map((sec, i) => {
      const photo = sec.fields.find(isPhoto);
      const rows = sec.fields
        .filter((f) => !isPhoto(f))
        .map((f) => row(txt(f.label, 'bengali'), value(f, answers)))
        .join('');
      return sectionHtml(i + 2, txt(sec.title, 'bengali'), rows, photo ? photoBox(d.photos[photo.key], 84, 105, txt(photo.label, 'bengali')) : undefined);
    })
    .join('');

  const receipt = d.receipt
    ? `<section class="box receipt">
        <div><div class="strong">আবেদন ফি পরিশোধের রসিদ</div>
        <div class="muted small">${esc(d.receipt.method)} · লেনদেন আইডি <span class="lat ink">${esc(d.receipt.transactionId)}</span>${d.receipt.paidAt ? ` · ${esc(dateTime(d.receipt.paidAt.toISOString(), 'bengali'))}` : ''}</div></div>
        <div class="right"><div class="amount">${esc(taka(d.receipt.amount, 'bengali'))}</div><span class="stamp">পরিশোধিত</span></div>
      </section>`
    : '';

  // The office's instructions from the Studio replace the default notice and the list of what to bring.
  const instructions = txt(s.pdfInstructions, 'bengali');
  const evalFee = esc(taka(s.evaluationFee, 'bengali'));
  const line = (width = '100%') => `<span class="line" style="width:${width}"></span>`;

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(d.publicRef)}</title><style>
${d.fontCss}
@page{size:A4;margin:13mm 13mm 15mm}
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#171717;font-family:'Inter','Noto Sans Bengali',sans-serif;font-size:12.5px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.lat{font-family:'Inter',sans-serif}.muted{color:#525252}.ink{color:#171717;font-weight:600}.small{font-size:11.5px}.strong{font-size:14px;font-weight:700}.right{text-align:right}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:10px;border-bottom:2px solid #7a4d32}
.brand{display:flex;align-items:center;gap:12px;min-width:0}.brand img{flex:none;width:50px;height:50px;border-radius:50%;object-fit:cover}
.brand .name{font-size:20px;font-weight:700;line-height:1.3}
.title{flex:none;text-align:right;white-space:nowrap}.title div:first-child{font-size:16px;font-weight:700}
.notice{border:1.5px solid #171717;border-radius:8px;padding:8px 12px;margin-top:12px;font-size:13px;font-weight:700}
.idrow{display:flex;gap:18px;align-items:center;margin-top:12px}
.photo{flex:none;display:block;border:1px solid #d4d4d4;border-radius:6px;object-fit:cover}.photo.empty{display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#525252;font-size:11px}
.who{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.bigid{font-family:'Inter',sans-serif;font-size:48px;font-weight:700;letter-spacing:.03em;line-height:1.1}
.qr{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;color:#525252}.qr svg{display:block;width:96px;height:96px;border:1px solid #d4d4d4;border-radius:6px;padding:4px;background:#fff}
/* A chapter starts on the next page rather than leaving its title and a row or two behind (every chapter fits on a page). */
.block{margin-top:14px;break-inside:avoid}
.sec{margin:0 0 6px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;break-after:avoid}
.sec span{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#7a4d32;color:#fff;font-size:11px;line-height:1}
.qa{width:100%;border-collapse:collapse;table-layout:fixed;border-top:1px solid #d4d4d4}
.qa tr{break-inside:avoid}
.qa th,.qa td{padding:4px 8px;border-bottom:1px solid #d4d4d4;text-align:left;vertical-align:top}
/* One label width everywhere, so the answers line up in every chapter (a parent's photo narrows only the answers). */
.qa th{width:300px;font-weight:400;color:#525252;background:#f7f7f7}.qa td{font-weight:600;overflow-wrap:anywhere}
.with-photo{display:flex;gap:14px;align-items:flex-start}.with-photo .qa{flex:1}
.box{border:1px solid #d4d4d4;border-radius:8px;padding:10px 14px;margin-top:14px;break-inside:avoid}
.receipt{display:flex;justify-content:space-between;align-items:center;gap:16px}
.amount{font-size:20px;font-weight:700}.stamp{display:inline-block;font-size:11px;font-weight:700;color:#15803d;border:1.5px solid #15803d;border-radius:6px;padding:0 8px}
.eval{display:flex;gap:18px;align-items:flex-start;border:1.5px solid #7a4d32}.eval p{margin:4px 0 6px}.eval ol{margin:2px 0 0;padding-left:20px;line-height:1.6}
.page-break{break-before:page}
.final{break-inside:avoid;margin-top:14px}
.final .box{margin-top:10px}
.decl p{margin:0;line-height:1.6}
.sign{display:flex;gap:24px;margin-top:22px}.sign>span{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#525252}
.line{display:inline-block;border-bottom:1px solid #525252;height:20px}
.office{border:1px dashed #737373;border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;flex-direction:column;gap:8px}
.cbs{display:flex;flex-wrap:wrap;align-items:center;gap:8px 22px}.cb{display:inline-flex;align-items:center;gap:7px}.cb i{flex:none;display:inline-block;width:14px;height:14px;border:1.5px solid #171717;border-radius:3px}
</style></head><body>

<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${d.school.line ? `<div class="small muted">${esc(d.school.line)}</div>` : ''}</div></div>
  <div class="title"><div>প্রি-অ্যাডমিশন আবেদনপত্র</div><div class="muted">শিক্ষাবর্ষ ${session}</div></div>
</header>
<div class="notice">${esc(instructions || 'এই আবেদনপত্রটি প্রিন্ট করে মূল্যায়নের দিন অবশ্যই সঙ্গে আনুন।')}</div>

<section class="idrow">
  ${studentPhoto ? photoBox(d.photos[studentPhoto.key], 100, 125, 'শিক্ষার্থীর ছবি') : ''}
  <div class="who">
    <span class="muted">আবেদন আইডি</span>
    <span class="bigid">${esc(d.publicRef)}</span>
    <span style="font-size:16px;font-weight:600">${esc(d.studentNameBn)}</span>
    <span class="muted">আবেদিত শ্রেণী: ${esc(classLabel)}${d.submittedAt ? ` · জমা: ${esc(longDate(d.submittedAt.toISOString().slice(0, 10), 'bengali'))}` : ''}</span>
  </div>
  <div class="qr">${d.staffQrSvg}<span>অফিস ব্যবহারের জন্য</span></div>
</section>

${sectionHtml(1, txt(first.title, 'bengali'), studentRows)}
${receipt}
<section class="box eval">
  <div style="flex:1">
    <div class="strong">মূল্যায়নের দিন</div>
    <p>তারিখ ও সময় আবেদন আইডি অনুযায়ী <b>হোয়াটসঅ্যাপ গ্রুপে</b> জানানো হবে।${d.whatsappQrSvg ? ' গ্রুপে যোগ না দিয়ে থাকলে পাশের কোড স্ক্যান করুন।' : ''}</p>
    ${
      instructions
        ? `<p>মূল্যায়ন ফি: <b>${evalFee}</b> (নগদ, মূল্যায়নের দিন)</p>`
        : `<div style="font-weight:700">সঙ্গে আনবেন</div><ol><li>এই আবেদনপত্রের প্রিন্ট</li><li>শিক্ষার্থীর জন্ম নিবন্ধন সনদের মূল কপি</li><li><b>${evalFee} মূল্যায়ন ফি</b> (নগদ)</li></ol>`
    }
  </div>
  ${d.whatsappQrSvg ? `<div class="qr">${d.whatsappQrSvg}<span>হোয়াটসঅ্যাপ গ্রুপ</span></div>` : ''}
</section>

<div class="page-break"></div>
${restHtml}
<div class="final">
  <section class="box decl">
    ${sectionTitle(rest.length + 2, 'ঘোষণা')}
    <p>${esc(txt(s.declaration, 'bengali'))}</p>
    ${d.declaredAt ? `<p class="muted small" style="margin-top:6px">অনলাইনে সম্মতি দেওয়া হয়েছে: ${esc(dateTime(d.declaredAt.toISOString(), 'bengali'))}</p>` : ''}
    <div class="sign"><span style="flex:1">${line()}অভিভাবকের স্বাক্ষর (মূল্যায়নের দিন)</span><span style="width:150px">${line()}তারিখ</span></div>
  </section>
  <section class="office">
    <div class="strong">শুধু অফিস ও মূল্যায়নকারীর জন্য</div>
    <div class="cbs"><span class="cb"><i></i>উপস্থিত</span><span class="cb"><i></i>জন্ম নিবন্ধনের মূল কপি দেখা হয়েছে</span><span class="cb"><i></i>মূল্যায়ন ফি ${evalFee} গৃহীত</span><span class="cb">রসিদ নং ${line('110px')}</span></div>
    <div><div style="font-weight:600">মূল্যায়নকারীর মন্তব্য</div>${line()}${line()}${line()}</div>
    <div class="cbs"><span style="font-weight:600">সুপারিশ:</span><span class="cb"><i></i>ভর্তি</span><span class="cb"><i></i>অপেক্ষমাণ</span><span class="cb"><i></i>নির্বাচিত নয়</span></div>
    <div class="sign"><span style="flex:1">${line()}মূল্যায়নকারীর নাম ও স্বাক্ষর</span><span style="width:150px">${line()}তারিখ</span></div>
  </section>
  <p class="muted small" style="margin:8px 0 0">কম্পিউটারে তৈরি, ${esc(longDate(d.generatedAt.toISOString().slice(0, 10), 'bengali'))}</p>
</div>
</body></html>`;
}

/** Footer printed by Chromium on every page: school, ID, child's name, page N / M. */
export function footerTemplate(publicRef: string, studentNameBn: string, fontCss: string, session: string): string {
  const title = `মাদরাসাতুল কুরআন · প্রি-অ্যাডমিশন আবেদনপত্র ${bn(session)}`;
  return `<div style="width:100%;padding:0 13mm;display:flex;justify-content:space-between;gap:12px;font-size:9px;color:#525252;font-family:'Inter','Noto Sans Bengali',sans-serif"><style>${fontCss}</style><span>${esc(title)} · <b style="color:#171717">${esc(publicRef)}</b> · ${esc(studentNameBn)}</span><span>পৃষ্ঠা <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
}
