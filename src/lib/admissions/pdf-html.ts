import { ageOn, sessionStart } from './age';
import { answerText } from './answer-text';
import { isVisible, type Answers } from './answers';
import { bringItems } from './bring-list';
import { dateTime, longDate, num, taka, txt } from './display';
import { NO_ROUTE, type FormField, type FormSnapshot } from './form-config';
import { findStop } from './transport';

// The application PDF as one HTML document (docs/pre-admission-mockups/Pdf1–2, UPdf1, UPdf3,
// UPdf4), printed to A4 by Chromium (pdf.ts). Always Bengali: it is the office's working copy on
// assessment day. Pages: 1 the ID, the student, the receipt and the assessment box; 2 the parents;
// 3 the rest of the form and the code of conduct; 4 the consents, signatures and the office section
// (ordered by who fills it, so the office comes last). Fonts, photos and QR codes arrive inline
// (data URIs, SVG), so printing needs no network.

export type PdfData = {
  snapshot: FormSnapshot;
  answers: Answers;
  publicRef: string;
  studentNameBn: string;
  studentNameEn: string | null;
  submittedAt: Date | null;
  declaredAt: Date | null;
  conductPledgedAt: Date | null;
  familyDeclaredAt: Date | null;
  fatherName: string | null;
  motherName: string | null;
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
const LABELS = { yes: 'হ্যাঁ', no: 'না', notGiven: 'দেওয়া হয়নি', fileAttached: () => 'অনলাইনে জমা', fileMissing: 'জমা দেওয়া হয়নি, সঙ্গে আনবেন' };
const isPhoto = (f: FormField) => f.type === 'file' && f.fileKind === 'photo';
const latin = (s: string) => /^[\x20-\x7e]+$/.test(s);

function value(f: FormField, answers: Answers): string {
  const text = answerText(f, answers[f.key], 'bengali', LABELS);
  return `<td${latin(text) ? ' class="lat"' : ''}>${esc(text)}</td>`;
}

/** A field's rows: a transport stop also shows the charge the guardian saw ("stop (route)", then "৳৫,০০০, মাইক্রো"). */
function fieldRows(f: FormField, answers: Answers, snapshot: FormSnapshot): string {
  const chosen = f.type === 'transportStop' && answers[f.key] !== NO_ROUTE ? findStop(snapshot.transport, answers[f.key]) : null;
  if (!chosen) return row(txt(f.label, 'bengali'), value(f, answers));
  const monthly = chosen.vehicle?.monthly;
  const charge = [monthly != null ? taka(monthly, 'bengali') : 'অফিসে জানুন', txt(chosen.vehicle?.name, 'bengali')].filter(Boolean).join(', ');
  return (
    row(txt(f.label, 'bengali'), `<td>${esc(`${txt(chosen.stop.name, 'bengali')} (${txt(chosen.route.name, 'bengali')})`)}</td>`) +
    row('মাসিক ভাড়া (আবেদনের সময়)', `<td>${esc(charge)}</td>`)
  );
}

function photoBox(src: string | undefined, w: number, h: number, alt: string) {
  return src
    ? `<img src="${src}" alt="${esc(alt)}" style="width:${w}px;height:${h}px" class="photo">`
    : `<div class="photo empty" style="width:${w}px;height:${h}px">ছবি</div>`;
}

const consentTime = (at: Date | null) => (at ? `<div class="muted small">অনলাইনে সম্মতি: ${esc(dateTime(at.toISOString(), 'bengali'))}</div>` : '');
/** An empty box for the office to tick, or a ticked one (agreed online). */
// The tick is drawn: the embedded fonts have no ✓, and the server has no other font to fall back on.
const TICK = '<svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M2.4 6.3l2.4 2.4 4.8-5.2" fill="none" stroke="#171717" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const box = (ticked = false) => (ticked ? `<i class="tick on">${TICK}</i>` : '<i class="tick"></i>');

const sectionTitle = (n: number, title: string) => `<h2 class="sec"><span>${bn(n)}</span>${esc(title)}</h2>`;

const row = (label: string, cell: string) => `<tr><th>${esc(label)}</th>${cell}</tr>`;

/** One chapter: its title, a label / answer table and, for a parent, the photo beside it. */
function sectionHtml(n: number, title: string, rows: string, photo?: string, compact = false) {
  const table = `<table class="qa${compact ? ' compact' : ''}"><tbody>${rows}</tbody></table>`;
  return `<section class="block">${sectionTitle(n, title)}${photo ? `<div class="with-photo">${table}${photo}</div>` : table}</section>`;
}

/** `tight`: the reprint pdf.ts makes when the normal layout runs past 4 pages (e.g. after questions were added in Sanity). */
export function applicationHtml(d: PdfData, tight = false): string {
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
      const r = fieldRows(f, answers, snapshot);
      return f.role === 'dateOfBirth' && age ? [r, row('বয়স (শিক্ষাবর্ষের শুরুতে)', `<td>${bn(age.years)} বছর ${bn(age.months)} মাস</td>`)] : [r];
    })
    .join('');

  const chapterHtml = (sec: (typeof rest)[number], n: number) => {
    const photo = sec.fields.find(isPhoto);
    const rows = sec.fields
      .filter((f) => !isPhoto(f))
      .map((f) => fieldRows(f, answers, snapshot))
      .join('');
    return sectionHtml(n, txt(sec.title, 'bengali'), rows, photo ? photoBox(d.photos[photo.key], 84, 105, txt(photo.label, 'bengali')) : undefined);
  };
  // Page 2: the parents (the next two chapters); page 3: the rest, then the code of conduct.
  const page2 = rest.slice(0, 2).map((sec, i) => chapterHtml(sec, i + 2)).join('');
  const page3 = rest.slice(2).map((sec, i) => chapterHtml(sec, i + 4)).join('');
  let n = rest.length + 1;
  let ruleNo = 0;
  const conduct = s.conduct;
  const conductHtml = conduct
    ? `<section class="block rules">${sectionTitle(++n, 'অভিভাবকদের আচরণবিধি')}${conduct.groups
        .map(
          (g) =>
            `<div class="group"><div class="gh">${esc(txt(g.title, 'bengali'))}</div><ol>${g.rules
              .map((r) => `<li><b>${bn(++ruleNo)}</b><span>${esc(txt(r, 'bengali'))}</span></li>`)
              .join('')}</ol></div>`,
        )
        .join('')}<p class="to-sign">এই আচরণবিধি মেনে চলার অঙ্গীকার ও স্বাক্ষর: পৃষ্ঠা ৪</p></section>`
    : '';

  const receipt = d.receipt
    ? `<section class="box receipt">
        <div><div class="strong">আবেদন ফি পরিশোধের রসিদ</div>
        <div class="muted small">${esc(d.receipt.method)} · ট্রানজেকশন আইডি <span class="lat ink">${esc(d.receipt.transactionId)}</span>${d.receipt.paidAt ? ` · ${esc(dateTime(d.receipt.paidAt.toISOString(), 'bengali'))}` : ''}</div></div>
        <div class="right"><div class="amount">${esc(taka(d.receipt.amount, 'bengali'))}</div><span class="stamp">পরিশোধিত</span></div>
      </section>`
    : '';

  // The office's instructions from the Studio replace the default notice.
  const instructions = txt(s.pdfInstructions, 'bengali');
  const evalFee = esc(taka(s.evaluationFee, 'bengali'));
  // What to bring (Sanity), personalised; the office ticks the same items on page 4.
  const bring = bringItems(snapshot, answers, 'bengali');
  const bringHtml = bring.length
    ? `<div style="font-weight:700">সঙ্গে আনবেন</div><ol>${bring
        .map((i) => `<li>${esc(i.text)}${i.missing ? '<b class="must">। অনলাইনে জমা দেওয়া হয়নি, অবশ্যই আনবেন।</b>' : ''}</li>`)
        .join('')}</ol>`
    : instructions
      ? `<p>অ্যাসেসমেন্ট ফি: <b>${evalFee}</b> (ক্যাশ, অ্যাসেসমেন্টের দিন)</p>`
      : `<div style="font-weight:700">সঙ্গে আনবেন</div><ol><li>এই আবেদনপত্রের প্রিন্ট</li><li>শিক্ষার্থীর জন্ম নিবন্ধন সনদের মূল কপি</li><li><b>${evalFee} অ্যাসেসমেন্ট ফি</b> (ক্যাশ)</li></ol>`;
  const officeChecks = bring.length
    ? bring.map((i) => `<span class="cb">${box()}${esc(i.text)}</span>`).join('')
    : `<span class="cb">${box()}জন্ম নিবন্ধনের মূল কপি দেখা হয়েছে</span><span class="cb">${box()}অ্যাসেসমেন্ট ফি ${evalFee} গৃহীত</span>`;
  const line = (width = '100%') => `<span class="line" style="width:${width}"></span>`;

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${esc(d.publicRef)}</title><style>
${d.fontCss}
@page{size:A4;margin:13mm 13mm 15mm}
*{box-sizing:border-box}
/* An inset so borders at the right edge are not clipped by the printable area. */
body{padding:0 0.6mm}
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
.qr{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;color:#525252}.qr.wa{max-width:150px;text-align:center}.qr.wa svg{width:124px;height:124px}.qr svg{display:block;width:96px;height:96px;border:1px solid #d4d4d4;border-radius:6px;padding:4px;background:#fff}
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
/* Page 1 holds the student chapter, the receipt and the assessment box: its rows are a little tighter. */
.qa.compact th,.qa.compact td{padding:2.5px 8px;line-height:1.35}
.page1 .box{margin-top:10px;padding:8px 14px}.page1 .block{margin-top:10px}.page1 .idrow{margin-top:10px}
.box{border:1px solid #d4d4d4;border-radius:8px;padding:10px 14px;margin-top:14px;break-inside:avoid}
.receipt{display:flex;justify-content:space-between;align-items:center;gap:16px}
.amount{font-size:20px;font-weight:700}.stamp{display:inline-block;font-size:11px;font-weight:700;color:#15803d;border:1.5px solid #15803d;border-radius:6px;padding:0 8px}
.eval{display:flex;gap:18px;align-items:flex-start;border:1.5px solid #7a4d32}.eval p{margin:4px 0 6px}.eval ol{margin:2px 0 0;padding-left:20px;line-height:1.6;list-style-type:bengali}
.page-break{break-before:page}
/* Tight: closer rows, a wider question column (long questions wrap less), a smaller assessment box. */
.tight .qa th,.tight .qa td{padding:2.5px 8px;line-height:1.35}.tight .qa.compact th,.tight .qa.compact td{padding:1.5px 8px;line-height:1.3}.tight .qa th{width:360px}
.tight .page1 .box{margin-top:8px;padding:6px 12px}.tight .page1 .block,.tight .page1 .idrow{margin-top:8px}.tight .eval ol{line-height:1.45}.tight .qr.wa svg{width:100px;height:100px}
/* Page 4 fills the page: the office section sits at the bottom (content height 297 - 13 - 15 mm, less a margin). */
.final{margin-top:0;display:flex;flex-direction:column;min-height:265mm}.final .office{margin-top:auto}
.final .box{margin-top:10px}
.decl p{margin:0;line-height:1.6}
.sign{display:flex;gap:24px;margin-top:22px}.sign>span{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#525252}
.line{display:inline-block;border-bottom:1px solid #525252;height:20px}
.office{break-inside:avoid;border:1px dashed #737373;border-radius:8px;padding:10px 14px;margin-top:10px;display:flex;flex-direction:column;gap:8px}
.cbs{display:flex;flex-wrap:wrap;align-items:center;gap:8px 22px}.cb{display:inline-flex;align-items:center;gap:7px}.tick{flex:none;display:inline-block;width:14px;height:14px;border:1.5px solid #171717;border-radius:3px}
.must{color:#171717}
.rules .group{margin-top:8px;break-inside:avoid}.rules .gh{font-weight:700;margin-bottom:2px}.rules ol{list-style:none;margin:0;padding:0}.rules li{display:grid;grid-template-columns:22px 1fr;gap:2px;line-height:1.6;padding:2px 0}.rules li b{color:#525252}
.to-sign{margin:10px 0 0;padding:6px 10px;border:1px solid #d4d4d4;border-radius:6px;font-weight:700}
.consent{display:flex;gap:10px;align-items:flex-start;border:1px solid #d4d4d4;border-radius:8px;padding:9px 12px;margin-top:8px;line-height:1.6}.consent.boxed{border:2px solid #171717}.consent .tick{margin-top:3px}
.tick.on{display:inline-flex;align-items:center;justify-content:center}
.signs{display:grid;grid-template-columns:1fr 150px;gap:26px 24px;margin-top:26px}.signs>span{display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#525252}
</style></head><body${tight ? ' class="tight"' : ''}>

<div class="page1">
<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${d.school.line ? `<div class="small muted">${esc(d.school.line)}</div>` : ''}</div></div>
  <div class="title"><div>প্রি-অ্যাডমিশন আবেদনপত্র</div><div class="muted">শিক্ষাবর্ষ ${session}</div></div>
</header>
<div class="notice">${esc(instructions || 'এই আবেদনপত্রটি প্রিন্ট করে অ্যাসেসমেন্টের দিন অবশ্যই সঙ্গে আনুন।')}</div>

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

${sectionHtml(1, txt(first.title, 'bengali'), studentRows, undefined, true)}
${receipt}
<section class="box eval">
  <div style="flex:1">
    <div class="strong">অ্যাসেসমেন্টের দিন</div>
    <p>তারিখ ও সময় আবেদন আইডি অনুযায়ী <b>হোয়াটসঅ্যাপ গ্রুপে</b> জানানো হবে।${d.whatsappQrSvg ? ' গ্রুপে যোগ না দিয়ে থাকলে পাশের কোড স্ক্যান করুন।' : ''}</p>
    ${bringHtml}
  </div>
  ${d.whatsappQrSvg ? `<div class="qr wa">${d.whatsappQrSvg}<span>হোয়াটসঅ্যাপ গ্রুপ</span><span>ফোনের ক্যামেরা দিয়ে স্ক্যান করুন</span></div>` : ''}
</section>
</div>

<div class="page-break"></div>
${page2}
${page3 || conductHtml ? `<div class="page-break"></div>${page3}${conductHtml}` : ''}
<div class="page-break"></div>
<div class="final">
  <section class="block decl">
    ${sectionTitle(++n, conduct ? 'অঙ্গীকার ও ঘোষণা' : 'ঘোষণা')}
    ${
      conduct
        ? `<div class="consent">${box(!!d.conductPledgedAt)}<div>${esc(txt(conduct.pledge, 'bengali').replace(/আচরণবিধি/, 'আচরণবিধি (পৃষ্ঠা ৩)'))}${consentTime(d.conductPledgedAt)}</div></div>
    <div class="consent boxed">${box(!!d.familyDeclaredAt)}<div>${esc(txt(conduct.declaration, 'bengali'))}${consentTime(d.familyDeclaredAt)}</div></div>`
        : ''
    }
    <div class="consent">${box(!!d.declaredAt)}<div>${esc(txt(s.declaration, 'bengali'))}${consentTime(d.declaredAt)}</div></div>
    <div class="signs">
      <span>${line()}পিতার স্বাক্ষর${d.fatherName ? `: ${esc(d.fatherName)}` : ''}</span><span>${line()}তারিখ</span>
      <span>${line()}মাতার স্বাক্ষর${d.motherName ? `: ${esc(d.motherName)}` : ''}</span><span>${line()}তারিখ</span>
    </div>
  </section>
  <section class="office">
    <div class="strong">শুধু অফিস ও পরীক্ষকের জন্য</div>
    <div class="cbs"><span class="cb">${box()}উপস্থিত</span>${officeChecks}<span class="cb">ফি-র রসিদ নং ${line('110px')}</span></div>
    <div><div style="font-weight:600">পরীক্ষকের মন্তব্য</div>${line()}${line()}${line()}</div>
    <div class="cbs"><span style="font-weight:600">সুপারিশ:</span><span class="cb">${box()}ভর্তি</span><span class="cb">${box()}অপেক্ষমাণ</span><span class="cb">${box()}নির্বাচিত নয়</span></div>
    <div class="sign"><span style="flex:1">${line()}পরীক্ষকের নাম ও স্বাক্ষর</span><span style="width:150px">${line()}তারিখ</span></div>
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
