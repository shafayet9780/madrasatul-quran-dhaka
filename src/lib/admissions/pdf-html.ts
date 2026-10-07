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
  return `<dd${latin(text) ? ' class="lat"' : ''}>${esc(text)}</dd>`;
}

function photoBox(src: string | undefined, w: number, h: number, alt: string) {
  return src
    ? `<img src="${src}" alt="${esc(alt)}" style="width:${w}px;height:${h}px" class="photo">`
    : `<div class="photo empty" style="width:${w}px;height:${h}px">ছবি</div>`;
}

const sectionTitle = (n: number, title: string) => `<h2 class="sec"><span>${bn(n)}</span>${esc(title)}</h2>`;

export function applicationHtml(d: PdfData): string {
  const { snapshot, answers } = d;
  const s = snapshot.settings;
  const session = bn(s.session);
  const sections = snapshot.sections.map((sec) => ({ ...sec, fields: sec.fields.filter((f) => isVisible(f, answers)) }));
  const [first, ...rest] = sections;
  const studentPhoto = first.fields.find((f) => f.role === 'studentPhoto') ?? sections.flatMap((x) => x.fields).find((f) => f.role === 'studentPhoto');
  const classField = sections.flatMap((x) => x.fields).find((f) => f.role === 'classApplied');
  const classLabel = classField ? answerText(classField, answers[classField.key], 'bengali', LABELS) : '';
  const dobField = sections.flatMap((x) => x.fields).find((f) => f.role === 'dateOfBirth');
  const age = dobField && typeof answers[dobField.key] === 'string' ? ageOn(answers[dobField.key] as string, sessionStart(s.session)) : null;

  // Page 1: the student chapter as a four-column grid, with the age after the date of birth.
  const studentRows = first.fields
    .filter((f) => !isPhoto(f))
    .flatMap((f) => {
      const row = `<dt>${esc(txt(f.label, 'bengali'))}</dt>${value(f, answers)}`;
      return f.role === 'dateOfBirth' && age ? [row, `<dt>বয়স (শিক্ষাবর্ষের শুরুতে)</dt><dd>${bn(age.years)} বছর ${bn(age.months)} মাস</dd>`] : [row];
    })
    .join('');

  const restHtml = rest
    .map((sec, i) => {
      const photo = sec.fields.find(isPhoto);
      const named = sec.fields.find((f) => f.role === 'fatherName' || f.role === 'motherName');
      const englishName = named ? sec.fields.find((f) => f !== named && f.type === 'text' && f.key.startsWith(named.key) && f.key !== named.key) : undefined;
      const heading =
        photo || named
          ? `<div class="sec-head"><div>${sectionTitle(i + 2, txt(sec.title, 'bengali'))}${
              named && typeof answers[named.key] === 'string'
                ? `<div class="person">${esc(String(answers[named.key]))}${englishName && answers[englishName.key] ? ` <span class="lat muted">· ${esc(String(answers[englishName.key]))}</span>` : ''}</div>`
                : ''
            }</div>${photo ? photoBox(d.photos[photo.key], 76, 96, txt(photo.label, 'bengali')) : ''}</div>`
          : sectionTitle(i + 2, txt(sec.title, 'bengali'));
      const rows = sec.fields
        .filter((f) => !isPhoto(f))
        .map((f) => `<div class="row"><dt>${esc(txt(f.label, 'bengali'))}</dt>${value(f, answers)}</div>`)
        .join('');
      return `<section class="block">${heading}<dl class="qa">${rows}</dl></section>`;
    })
    .join('');

  const receipt = d.receipt
    ? `<section class="box receipt">
        <div><div class="strong">আবেদন ফি পরিশোধের রসিদ</div>
        <div class="muted small">${esc(d.receipt.method)} · লেনদেন আইডি <span class="lat ink">${esc(d.receipt.transactionId)}</span>${d.receipt.paidAt ? ` · ${esc(dateTime(d.receipt.paidAt.toISOString(), 'bengali'))}` : ''}</div></div>
        <div class="right"><div class="amount">${esc(taka(d.receipt.amount, 'bengali'))}</div><span class="stamp">পরিশোধিত</span></div>
      </section>`
    : '';

  const footerName = `${d.publicRef} · ${d.studentNameBn}`;
  const n = rest.length + 2;

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(d.publicRef)}</title><style>
${d.fontCss}
@page{size:A4;margin:14mm 13mm 16mm}
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#171717;font-family:'Inter','Noto Sans Bengali',sans-serif;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.lat{font-family:'Inter',sans-serif}.muted{color:#525252}.ink{color:#171717;font-weight:600}.small{font-size:12.5px}.strong{font-size:15px;font-weight:700}.right{text-align:right}
.top{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:2.5px solid #7a4d32}
.brand{display:flex;align-items:center;gap:14px}.brand img{width:56px;height:56px;border-radius:50%;object-fit:cover}
.brand .name{font-size:22px;font-weight:700;line-height:1.3}
.banner{display:flex;align-items:center;gap:12px;border:2px solid #171717;border-radius:10px;padding:10px 14px;margin-top:14px;font-size:15px;font-weight:700}
.idrow{display:flex;gap:20px;align-items:center;margin-top:14px}
.photo{flex:none;border:1.5px solid #d4d4d4;border-radius:6px;object-fit:cover}.photo.empty{display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#525252;font-size:11px}
.bigid{font-family:'Inter',sans-serif;font-size:56px;font-weight:700;letter-spacing:.04em;line-height:1.05}
.qr{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11.5px;color:#525252}.qr svg{display:block;border:1px solid #d4d4d4;border-radius:6px;padding:4px;background:#fff}
.sec{margin:0 0 6px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}
.sec span{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#7a4d32;color:#fff;font-size:12px}
.kv{display:grid;grid-template-columns:140px 1fr 140px 1fr;margin:0;border-top:1px solid #d4d4d4}
.kv dt,.kv dd,.qa dt,.qa dd{margin:0;padding:5px 10px;border-bottom:1px solid #d4d4d4;line-height:1.4}
.qa dt,.qa dd{font-size:12.5px}
.kv dt,.qa dt{color:#525252;background:#f5f5f5}.kv dd,.qa dd{font-weight:600}
.qa{margin:0;border-top:1px solid #d4d4d4}.qa .row{display:grid;grid-template-columns:52% 1fr;break-inside:avoid}
.box{border:1.5px solid #d4d4d4;border-radius:10px;padding:12px 16px;margin-top:14px;break-inside:avoid}
.receipt{display:flex;justify-content:space-between;align-items:center;gap:16px}
.amount{font-size:22px;font-weight:700}.stamp{display:inline-block;font-size:12px;font-weight:700;color:#15803d;border:1.5px solid #15803d;border-radius:6px;padding:0 8px}
.eval{display:flex;gap:20px;border:2px solid #7a4d32}.eval p{margin:4px 0 8px;line-height:1.6;font-size:13.5px}.eval ol{margin:4px 0 0;padding-left:22px;line-height:1.7;font-size:13.5px}
.block{margin-top:12px}.sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:8px}.sec-head .sec{margin:0}.person{font-size:15px;font-weight:600;margin-top:4px}
.page-break{break-before:page}
.sec,.sec-head{break-after:avoid}.qa .row:first-child{break-before:avoid}
table.flow{width:100%;border-collapse:collapse}table.flow td{padding:0}
.runhead{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:8px;margin-bottom:6px;border-bottom:2px solid #7a4d32;font-weight:700}
.runhead .lat{font-size:17px;letter-spacing:.03em}
.final{break-inside:avoid}
.decl p{margin:0;font-size:13px;line-height:1.6}
.final .box{margin-top:12px;padding:10px 16px}
.sign{display:flex;gap:24px;align-items:flex-end;margin-top:8px}.sign>span{display:flex;flex-direction:column;gap:4px;font-size:12px;color:#525252}.line{border-bottom:1.5px solid #525252;height:24px}
.office{border:1.5px dashed #737373;border-radius:10px;padding:10px 16px;margin-top:10px;display:flex;flex-direction:column;gap:9px}
.cbs{display:flex;flex-wrap:wrap;gap:10px 24px;font-size:13.5px}.cb{display:inline-flex;align-items:center;gap:8px}.cb i{display:inline-block;width:15px;height:15px;border:1.5px solid #171717;border-radius:3px}
</style></head><body>

<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${d.school.line ? `<div class="small muted">${esc(d.school.line)}</div>` : ''}</div></div>
  <div class="right"><div style="font-size:19px;font-weight:700">প্রি-অ্যাডমিশন আবেদনপত্র</div><div class="muted">শিক্ষাবর্ষ ${session}</div></div>
</header>
<div class="banner">এই আবেদনপত্রটি প্রিন্ট করে মূল্যায়নের দিন অবশ্যই সঙ্গে আনুন।</div>

<section class="idrow">
  ${studentPhoto ? photoBox(d.photos[studentPhoto.key], 108, 136, 'শিক্ষার্থীর ছবি') : ''}
  <div style="flex:1;display:flex;flex-direction:column;gap:3px">
    <span class="muted">আবেদন আইডি</span>
    <span class="bigid">${esc(d.publicRef)}</span>
    <span style="font-size:17px;font-weight:600;margin-top:4px">${esc(d.studentNameBn)}</span>
    <span class="muted">আবেদিত শ্রেণী: ${esc(classLabel)}${d.submittedAt ? ` · জমা: ${esc(longDate(d.submittedAt.toISOString().slice(0, 10), 'bengali'))}` : ''}</span>
  </div>
  <div class="qr">${d.staffQrSvg}<span>অফিস ব্যবহারের জন্য</span></div>
</section>

<section class="block">${sectionTitle(1, txt(first.title, 'bengali'))}<dl class="kv">${studentRows}</dl></section>
${receipt}
<section class="box eval">
  <div style="flex:1">
    <div class="strong">মূল্যায়নের দিন</div>
    <p>তারিখ ও সময় আবেদন আইডি অনুযায়ী <b>হোয়াটসঅ্যাপ গ্রুপে</b> জানানো হবে।${d.whatsappQrSvg ? ' গ্রুপে যোগ না দিয়ে থাকলে পাশের কোড স্ক্যান করুন।' : ''}</p>
    <div style="font-weight:700">সঙ্গে আনবেন</div>
    <ol><li>এই আবেদনপত্রের প্রিন্ট</li><li>শিক্ষার্থীর জন্ম নিবন্ধন সনদের মূল কপি</li><li><b>${esc(taka(s.evaluationFee, 'bengali'))} মূল্যায়ন ফি</b> (নগদ)</li></ol>
    ${txt(s.pdfInstructions, 'bengali') ? `<p class="muted small" style="margin-top:8px">${esc(txt(s.pdfInstructions, 'bengali'))}</p>` : ''}
  </div>
  ${d.whatsappQrSvg ? `<div class="qr" style="justify-content:center">${d.whatsappQrSvg}<span>হোয়াটসঅ্যাপ গ্রুপ</span></div>` : ''}
</section>

<table class="flow page-break">
  <thead><tr><td><div class="runhead"><span>${esc(d.school.name)} · প্রি-অ্যাডমিশন আবেদনপত্র ${session}</span><span class="lat">${esc(d.publicRef)}</span></div></td></tr></thead>
  <tbody><tr><td>
${restHtml}
<div class="final">
  <section class="box decl">
    ${sectionTitle(n, 'ঘোষণা')}
    <p>${esc(txt(s.declaration, 'bengali'))}</p>
    ${d.declaredAt ? `<p class="muted small" style="margin-top:6px">অনলাইনে সম্মতি দেওয়া হয়েছে: ${esc(dateTime(d.declaredAt.toISOString(), 'bengali'))}</p>` : ''}
    <div class="sign"><span style="flex:1"><span class="line"></span>অভিভাবকের স্বাক্ষর (মূল্যায়নের দিন)</span><span style="width:160px"><span class="line"></span>তারিখ</span></div>
  </section>
  <section class="office">
    <span style="font-size:14px;font-weight:700">শুধু অফিস ও মূল্যায়নকারীর জন্য</span>
    <div class="cbs"><span class="cb"><i></i>উপস্থিত</span><span class="cb"><i></i>জন্ম নিবন্ধনের মূল কপি দেখা হয়েছে</span><span class="cb"><i></i>মূল্যায়ন ফি ${esc(taka(s.evaluationFee, 'bengali'))} গৃহীত</span><span class="cb">রসিদ নং <span style="display:inline-block;width:110px;border-bottom:1.5px solid #525252;height:16px"></span></span></div>
    <div><div style="font-size:13.5px;font-weight:600">মূল্যায়নকারীর মন্তব্য</div><div class="line"></div><div class="line"></div><div class="line"></div></div>
    <div class="cbs"><span style="font-weight:600">সুপারিশ:</span><span class="cb"><i></i>ভর্তি</span><span class="cb"><i></i>অপেক্ষমাণ</span><span class="cb"><i></i>নির্বাচিত নয়</span></div>
    <div class="sign"><span style="flex:1"><span class="line"></span>মূল্যায়নকারীর নাম ও স্বাক্ষর</span><span style="width:160px"><span class="line"></span>তারিখ</span></div>
  </section>
  <p class="muted small" style="margin-top:10px">কম্পিউটারে তৈরি · ${esc(longDate(d.generatedAt.toISOString().slice(0, 10), 'bengali'))} · ${esc(footerName)}</p>
</div>
  </td></tr></tbody>
</table>
</body></html>`;
}

/** Footer printed by Chromium on every page: ID, child's name, page N / M. */
export function footerTemplate(publicRef: string, studentNameBn: string, fontCss: string): string {
  return `<div style="width:100%;padding:0 13mm;display:flex;justify-content:space-between;font-size:9px;color:#525252;font-family:'Inter','Noto Sans Bengali',sans-serif"><style>${fontCss}</style><span>${esc(publicRef)} · ${esc(studentNameBn)}</span><span>পৃষ্ঠা <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
}
