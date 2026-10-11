import { num, taka, txt } from './display';
import { CHOICE_TYPES, NO_ROUTE, allFields, type FormField, type FormSection, type FormSnapshot } from './form-config';

// The printable offline form (docs/pre-admission-mockups/Off1–Off6), generated from the same form
// version as the online one. Pages 1 to 4 (the chapters, pledges, signatures and office checks) are
// handed in to the office with the fee; page 5 (the code of conduct) stays with the family and page 6
// (the guardian's copy: fee receipt and WhatsApp QR) comes back. Black text with the application PDF's
// brown as a small accent and only light tints, so it survives photocopying. Paper forms are never
// typed into the system. Printed to A4 by pdf.ts: pages 2–4 repeat the application ID line in the
// header (page 1 has it in the office box); the last two pages stand alone.

export type OfflineData = {
  snapshot: FormSnapshot;
  school: { name: string; line: string; logo: string | null; phone: string; website: string };
  whatsappQrSvg: string | null;
  fontCss: string;
  /** Pages handed in (before the code of conduct and the guardian's copy); pdf.ts corrects it if the printed form differs. */
  formPages?: number;
};

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const bn = (value: number | string) => num(value, 'bengali');
const label = (f: FormField) => esc(txt(f.label, 'bengali'));
const star = (f: FormField) => (f.required ? ' <span class="req">*</span>' : '');
const isPhoto = (f: FormField) => f.type === 'file' && f.fileKind === 'photo';
/** The address · phone line under the school's name; each part breaks only at its own spaces, the phone never. */
const schoolLine = (line: string) =>
  line ? `<div class="small muted">${line.split(' · ').map((part, i, all) => (i === all.length - 1 && all.length > 1 ? `<span style="white-space:nowrap">${esc(part)}</span>` : esc(part))).join(' · ')}</div>` : '';

const CSS = `
@page{size:A4;margin:15mm 14mm 15mm}
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#000;font-family:'Inter','Noto Sans Bengali',sans-serif;font-size:12px;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{padding:0 0.6mm}
.muted{color:#404040}.small{font-size:10.5px}.req{font-weight:700;color:#7a4d32}.hint{font-weight:400;color:#525252}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-bottom:9px;border-bottom:2px solid #7a4d32}
.brand{display:flex;align-items:center;gap:11px}.brand img{width:50px;height:50px;border-radius:50%;object-fit:cover}.brand .name{font-size:20px;font-weight:700;line-height:1.3}
.title{text-align:right;flex:none}.title div:first-child{font-size:17px;font-weight:700}
.intro{margin-top:12px;display:grid;grid-template-columns:42fr 58fr;gap:12px;align-items:stretch}
.officebox{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;padding:8px 14px 12px;background:#f6f0eb;border-radius:6px}
.officebox .k{grid-column:1/-1;font-weight:700;color:#7a4d32}.officebox .wide{grid-column:1/-1}
.officebox label{display:flex;flex-direction:column;gap:14px;font-size:11px;white-space:nowrap}.officebox label i{display:block;border-bottom:1px solid #000}
.howto{border:1px solid #cdbfb3;border-radius:6px;padding:8px 12px;line-height:1.55;font-size:11.5px}
.howto ol{margin:0;padding:0;list-style:none;display:grid;gap:2px}.howto li{display:grid;grid-template-columns:18px 1fr}.howto li b:first-child{color:#7a4d32}
.chapter{margin-top:12px}.keep{break-inside:avoid}
.ch{margin:0 0 4px;padding:6px 10px;font-size:15px;font-weight:700;display:flex;align-items:center;gap:10px;background:#f6f0eb;border-radius:6px;break-after:avoid}
.ch span{flex:none;display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:50%;background:#7a4d32;color:#fff;font-size:12px;line-height:1}
.q{break-inside:avoid;padding:5px 2px 7px;border-bottom:1px solid #e6dfd9}.q .lbl{font-weight:600}
.q.row{display:flex;flex-wrap:wrap;align-items:center;gap:5px 22px}.q.row .opts{margin-top:0}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:0 22px;break-inside:avoid;border-bottom:1px solid #e6dfd9}.pair .q{border-bottom:0}.pair .q.row{display:block}.pair .q.row .opts{margin-top:6px}
.ans{display:block;height:9mm;border:1px solid #8c8c8c;border-radius:5px;margin-top:5px}.ans.tall{height:16mm}
.opts{display:flex;flex-wrap:wrap;gap:5px 22px;margin-top:6px}.opt{display:inline-flex;align-items:center;gap:7px}
.o{flex:none;display:inline-block;width:13px;height:13px;border:1.3px solid #000;border-radius:50%}.c{flex:none;display:inline-block;width:13px;height:13px;border:1.3px solid #000;border-radius:2px}
.date{display:flex;gap:10px;margin-top:5px}.date span{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#404040}.date i{display:block;height:9mm;border:1px solid #8c8c8c;border-radius:5px}
.idgrid{break-inside:avoid;display:grid;grid-template-columns:1fr auto;gap:0 18px;align-items:start}.idgrid .q:last-child{border-bottom:0}
.photos{display:flex;gap:12px;padding-top:10px}.frame{width:35mm;height:45mm;border:1.3px dashed #7a4d32;border-radius:5px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:10px;gap:2px;padding:4px}
.routes{width:100%;border-collapse:collapse;margin-top:6px}.routes th,.routes td{border:1px solid #bfb2a6;padding:4px 8px;text-align:left;vertical-align:top}.routes th{font-weight:600;background:#f6f0eb}.routes .area td{font-weight:700;color:#7a4d32;background:#fbf8f5}
.stops{display:flex;flex-wrap:wrap;gap:4px 14px}
.note{margin:10px 0 2px;padding:6px 11px;background:#f6f0eb;border-radius:6px;line-height:1.55;break-after:avoid}
.first .idgrid .ans{height:11.5mm}
.rules ol{list-style:none;margin:0;padding:0}.rules li{display:grid;grid-template-columns:22px 1fr;line-height:1.55;padding:2px 0}.rules li b{color:#7a4d32}.rules .gh{font-weight:700;margin-top:10px;padding-bottom:2px;border-bottom:1px solid #e6dfd9}
.rules.big{font-size:14px;margin-top:18px}.rules.big li{grid-template-columns:28px 1fr;line-height:1.75;padding:5px 0}.rules.big .gh{font-size:15px;margin-top:20px;padding-bottom:4px}
.consent{display:flex;gap:9px;align-items:flex-start;border:1px solid #8c8c8c;border-radius:6px;padding:8px 12px;margin-top:8px;line-height:1.55}.consent.boxed{border:2px solid #7a4d32}.consent .c{margin-top:3px}
.signs{display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;margin-top:28px}.signs span{display:flex;flex-direction:column;gap:4px;font-size:10.5px}
.line{display:inline-block;border-bottom:1px solid #000;height:18px;min-width:120px}
.office{border:1.5px dashed #7a4d32;border-radius:6px;padding:9px 14px;margin-top:14px;display:flex;flex-direction:column;gap:10px;break-inside:avoid}.office > b{color:#7a4d32}
.band{grid-column:1/-1;padding:6px 10px;font-size:15px;font-weight:700;background:#f6f0eb;border-radius:6px}
.receipt{border:1.5px solid #7a4d32;border-radius:8px;padding:14px 18px;margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:14px 24px}
.wa{border:1.5px solid #7a4d32;border-radius:8px;padding:16px 18px;margin-top:18px;display:flex;gap:20px;align-items:center}.wa svg{width:44mm;height:44mm}
`;

/** "(৬-এ ‘হ্যাঁ’ হলে)", or "(প্লে শ্রেণী ছাড়া)" when most options show the question. */
function conditionHint(f: FormField, numbers: Map<string, number>, fields: Map<string, FormField>): string {
  if (!f.showWhen) return '';
  const target = fields.get(f.showWhen.field);
  if (!target) return '';
  const labelOf = (v: string) =>
    target.type === 'yesno' ? (v === 'yes' ? 'হ্যাঁ' : 'না') : txt(target.options.find((o) => o.value === v)?.label, 'bengali') || v;
  const where = numbers.has(target.key) ? `${bn(numbers.get(target.key)!)}-এ` : `“${txt(target.label, 'bengali')}”-এ`;
  if (CHOICE_TYPES.includes(target.type) && f.showWhen.values.length > target.options.length / 2) {
    const left = target.options.filter((o) => !f.showWhen!.values.includes(o.value)).map((o) => txt(o.label, 'bengali'));
    if (left.length) return ` <span class="hint">(${esc(left.join(', '))} ছাড়া)</span>`;
  }
  return ` <span class="hint">(${where} ‘${esc(f.showWhen.values.map(labelOf).join('/'))}’ হলে)</span>`;
}

/** Their choices follow the question on the same line when they fit, else wrap below it. */
const ROW_TYPES: readonly FormField['type'][] = ['yesno', 'radio', 'select', 'checkbox', 'file'];

/** Fits half the page width: two of these sit side by side. */
function compact(f: FormField): boolean {
  if (f.width === 'half' || ['yesno', 'tel', 'email', 'number', 'date'].includes(f.type)) return true;
  if (f.type !== 'radio' && f.type !== 'select') return false;
  const chars = f.options.reduce((n, o) => n + txt(o.label, 'bengali').length + 4, 0);
  return f.options.length <= 4 && chars <= 34;
}

const options = (items: string[], mark: 'o' | 'c') => `<div class="opts">${items.map((t) => `<span class="opt"><i class="${mark}"></i>${t}</span>`).join('')}</div>`;

/** The answer space for one question. */
function answer(f: FormField, snapshot: FormSnapshot, dependents: FormField[]): string {
  switch (f.type) {
    case 'textarea':
      return '<i class="ans tall"></i>';
    case 'date':
      return `<div class="date"><span><i style="width:16mm"></i>দিন</span><span><i style="width:16mm"></i>মাস</span><span><i style="width:24mm"></i>বছর</span></div>`;
    case 'yesno':
      return options(['হ্যাঁ', 'না'], 'o');
    case 'select':
    case 'radio':
      return options(f.options.map((o) => esc(txt(o.label, 'bengali'))), 'o');
    case 'checkbox':
      return options(
        f.options.map((o) => `${esc(txt(o.label, 'bengali'))}${o.exclusive ? ' <span class="hint">(এটি বাছলে অন্যগুলো নয়)</span>' : ''}`),
        'c',
      );
    case 'file':
      return options(['ফটোকপি সংযুক্ত করেছি', ...(f.allowMissing ? [esc(txt(f.missingLabel, 'bengali'))] : [])], f.allowMissing ? 'o' : 'c');
    case 'transportStop': {
      // The routes as a table with a tick box beside each stop; "not on a route" asks for the area.
      const t = snapshot.transport;
      const vehicle = (key: string) => t?.vehicles.find((v) => v.key === key);
      const areas = [...new Map((t?.routes ?? []).map((r) => [r.area.bengali, r.area])).values()];
      const rows = areas
        .map(
          (a) =>
            `<tr class="area"><td colspan="2">${esc(txt(a, 'bengali'))}</td></tr>` +
            t!.routes
              .filter((r) => r.area.bengali === a.bengali)
              .map((r) => {
                const v = vehicle(r.vehicle);
                const fee = v?.monthly != null ? `${taka(v.monthly, 'bengali')} / মাস` : 'ভাড়া অফিসে জানুন';
                return `<tr><td style="width:34%"><b>${esc(txt(r.name, 'bengali'))}</b><div class="small">${esc(txt(v?.name, 'bengali'))}, ${esc(fee)}</div></td><td><div class="stops">${r.stops
                  .map((s) => `<span class="opt"><i class="c"></i>${esc(txt(s.name, 'bengali'))}</span>`)
                  .join('')}<span class="muted">→ মাদরাসা</span></div></td></tr>`;
              })
              .join(''),
        )
        .join('');
      const area = dependents.find((d) => d.showWhen?.values.includes(NO_ROUTE));
      return `<table class="routes"><thead><tr><th>রুট</th><th>স্টপ (শুরু থেকে মাদরাসা)</th></tr></thead><tbody>${rows}</tbody></table><div class="small muted" style="margin-top:3px">আসন সীমিত। ভর্তি নিশ্চিত হওয়ার পর পরিবহন বরাদ্দ জানানো হবে।</div>${
        area ? `<div style="margin-top:5px">কোনো রুটে না থাকলে, ${label(area)}:</div><i class="ans"></i>` : ''
      }`;
    }
    default:
      return '<i class="ans"></i>';
  }
}

function chapterHtml(section: FormSection, n: number, snapshot: FormSnapshot, fields: Map<string, FormField>, photosHtml = ''): string {
  // Photos go in the frames on page 1; a question shown only for "not on any route" is part of the stop question.
  const stopKeys = new Set(section.fields.filter((f) => f.type === 'transportStop').map((f) => f.key));
  const shown = section.fields.filter((f) => !isPhoto(f) && !(f.showWhen && stopKeys.has(f.showWhen.field)));
  const numbers = new Map(shown.map((f, i) => [f.key, i + 1]));
  const q = (g: FormField) =>
    `<div class="q${ROW_TYPES.includes(g.type) ? ' row' : ''}"><div class="lbl">${bn(numbers.get(g.key)!)}. ${label(g)}${star(g)}${conditionHint(g, numbers, fields)}</div>${answer(
      g,
      snapshot,
      section.fields.filter((d) => d.showWhen?.field === g.key),
    )}</div>`;
  // Beside the photo frames: the leading text and date answers (the names), one per row so long names fit.
  let i = 0;
  const beside: string[] = [];
  if (photosHtml) while (i < shown.length && beside.length < 3 && (shown[i].type === 'text' || shown[i].type === 'date')) beside.push(q(shown[i++]));
  const blocks: string[] = photosHtml ? [`<div class="idgrid"><div>${beside.join('')}</div>${photosHtml}</div>`] : [];
  const noted = new Set<string>();
  /** The note of a group with a description, printed once above its first question. */
  const noteFor = (f: FormField) => {
    const group = section.groups.find((g) => g.key === f.group);
    return group && !noted.has(group.key) && txt(group.description, 'bengali') ? group : null;
  };
  for (; i < shown.length; i++) {
    const f = shown[i];
    const group = noteFor(f);
    const note = group ? `<p class="note"><b>${esc(txt(group.title, 'bengali'))}:</b> ${esc(txt(group.description, 'bengali'))}</p>` : '';
    if (group) noted.add(group.key);
    // Two short questions share a row, unless the second opens a group with a note.
    const next = shown[i + 1];
    let block = q(f);
    if (next && compact(f) && compact(next) && (next.group === f.group || !noteFor(next))) {
      block = `<div class="pair">${q(f)}${q(next)}</div>`;
      i++;
    }
    // A group's note stays on the page of its first question.
    blocks.push(note ? `<div class="keep">${note}${block}</div>` : block);
  }
  // Chapters run on from page to page so the form fits four pages, breaking only between questions:
  // the heading stays with the first question and the last two stay together, so a page never ends
  // on a heading and a chapter never leaves one question behind.
  const heading = `<h2 class="ch"><span>${bn(n)}</span>${esc(txt(section.title, 'bengali'))}</h2>`;
  const cls = photosHtml ? 'chapter first' : 'chapter';
  if (blocks.length < 4) return `<section class="${cls} keep">${heading}${blocks.join('')}</section>`;
  const [head, ...rest] = blocks;
  const tail = rest.splice(-2).join('');
  return `<section class="${cls}"><div class="keep">${heading}${head}</div>${rest.join('')}<div class="keep">${tail}</div></section>`;
}

export function offlineFormHtml(d: OfflineData): string {
  const { snapshot } = d;
  const s = snapshot.settings;
  const fields = new Map(allFields(snapshot).map((f) => [f.key, f]));
  const sections = snapshot.sections;
  const photos = allFields(snapshot).filter(isPhoto);
  const photosHtml = photos.length
    ? `<div class="photos">${photos.map((f) => `<div class="frame"><b>${label(f)}${star(f)}</b><span>পাসপোর্ট সাইজ</span><span>আঠা দিয়ে লাগান</span></div>`).join('')}</div>`
    : '';
  const fee = taka(s.applicationFee, 'bengali');
  // The chapters follow one another from page 1; the pledge always starts a page.
  let n = 0;
  const chapters = sections.map((sec, i) => chapterHtml(sec, ++n, snapshot, fields, i === 0 ? photosHtml : '')).join('');

  const conduct = s.conduct;
  const pages = d.formPages ?? 4;
  const consent = (text: string, boxed = false) => `<div class="consent${boxed ? ' boxed' : ''}"><i class="c"></i><div>${esc(text)}</div></div>`;
  // The pledges, signatures and office checks close the form, kept together; the rules themselves
  // are on the page after it, which the family keeps (conductPageHtml).
  const pledgeSection = `<section class="chapter keep pledge"><h2 class="ch"><span>${bn(++n)}</span>${conduct ? 'অঙ্গীকার ও ঘোষণা' : 'ঘোষণা'}</h2>
${conduct ? `<p class="note">অভিভাবকদের আচরণবিধি পৃষ্ঠা ${bn(pages + 1)}-এ দেওয়া আছে। পড়ে নিচের তিনটি ঘরেই টিক দিন; পৃষ্ঠাটি আপনার কাছে রাখুন।</p>` : ''}
${conduct ? consent(txt(conduct.pledge, 'bengali')) + consent(txt(conduct.declaration, 'bengali'), true) : ''}
${consent(txt(s.declaration, 'bengali').replace('উপরে প্রদত্ত', 'এই ফর্মে প্রদত্ত'))}
<div class="signs"><span><i class="line"></i>পিতার স্বাক্ষর ও তারিখ</span><span><i class="line"></i>মাতার স্বাক্ষর ও তারিখ</span></div>
<section class="office"><b>শুধু অফিসের জন্য</b>
<div class="opts"><span class="opt"><i class="c"></i>ছবি লাগানো আছে</span>${allFields(snapshot)
    .filter((f) => f.type === 'file' && !isPhoto(f))
    .map((f) => `<span class="opt"><i class="c"></i>ফটোকপি: ${label(f)}</span>`)
    .join('')}<span class="opt"><i class="c"></i>আবেদন ফি ${esc(fee)} গৃহীত</span></div>
<div class="opts"><span class="opt">রসিদ নং <i class="line"></i></span><span class="opt">আবেদন আইডি <i class="line"></i></span><span class="opt">কর্মকর্তার স্বাক্ষর <i class="line" style="min-width:150px"></i></span></div>
</section></section>`;

  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>প্রি-অ্যাডমিশন ফর্ম ${bn(s.session)}</title><style>${d.fontCss}${CSS}</style></head><body>
<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${schoolLine(d.school.line)}</div></div>
  <div class="title"><div>প্রি-অ্যাডমিশন ফর্ম</div><div class="muted">শিক্ষাবর্ষ ${bn(s.session)}</div></div>
</header>
<div class="intro"><div class="officebox"><span class="k">শুধু অফিসের জন্য</span><label class="wide"><span>আবেদন আইডি <span class="muted">(যেমন KG-P01)</span></span><i></i></label><label><span>গ্রহণের তারিখ</span><i></i></label><label><span>গ্রহণকারী</span><i></i></label></div>
<div class="howto"><ol>
<li><b>১</b><span>স্পষ্ট করে লিখুন। <b class="req">*</b> চিহ্নিত প্রশ্নের উত্তর আবশ্যক। <i class="o" style="vertical-align:-2px"></i> চিহ্নে একটি, <i class="c" style="vertical-align:-2px"></i> চিহ্নে একাধিক বাছাই করা যাবে।</span></li>
<li><b>২</b><span>পূরণ করা পৃষ্ঠা ১ থেকে ${bn(pages)} আবেদন ফি <b>${esc(fee)}</b> সহ অফিসে জমা দিন।</span></li>
<li><b>৩</b><span>${conduct ? `আচরণবিধির পৃষ্ঠা (${bn(pages + 1)}) আপনার কাছে রাখুন। ` : ''}শেষ পৃষ্ঠা (অভিভাবকের কপি) অফিস পূরণ করে আপনাকে ফেরত দেবে।</span></li>
</ol></div></div>
${chapters}
${pledgeSection}
</body></html>`;
}

/** Repeated on pages 2–4: the school and form, and the application ID line the office fills in (e.g. KG-P01). */
export function offlineHeaderTemplate(session: string, fontCss: string): string {
  return `<div style="width:100%;padding:0 13mm;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;font-size:9.5px;color:#000;font-family:'Inter','Noto Sans Bengali',sans-serif"><style>${fontCss}</style><span>মাদরাসাতুল কুরআন · প্রি-অ্যাডমিশন ফর্ম ${bn(session)}</span><span>আবেদন আইডি (অফিস পূরণ করবে) <span style="display:inline-block;width:42mm;border-bottom:1px solid #000"></span></span></div>`;
}

/** The student's name line and the page number; `total` is given when page 1 is printed on its own. */
export function offlineFooterTemplate(session: string, fontCss: string, total?: number): string {
  const totalHtml = total ? String(total) : '<span class="totalPages"></span>';
  return `<div style="width:100%;padding:0 13mm;display:flex;justify-content:space-between;gap:12px;font-size:9px;color:#000;font-family:'Inter','Noto Sans Bengali',sans-serif"><style>${fontCss}</style><span>শিক্ষার্থীর নাম <span style="display:inline-block;width:60mm;border-bottom:1px solid #000"></span></span><span>প্রি-অ্যাডমিশন ফর্ম ${bn(session)} · অফলাইন · পৃষ্ঠা <span class="pageNumber"></span> / ${totalHtml}</span></div>`;
}

/**
 * The parents' code of conduct on a page of its own, after the form: the family reads it, ticks the
 * pledges on the form's last page and keeps it. The online introduction ("the pledges below") does
 * not fit paper, so the note says where the pledges are. Null when the form has none.
 */
export function conductPageHtml(d: OfflineData): string | null {
  const s = d.snapshot.settings;
  const conduct = s.conduct;
  if (!conduct) return null;
  let ruleNo = 0;
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>${d.fontCss}${CSS}@page{margin:14mm 13mm}</style></head><body>
<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${schoolLine(d.school.line)}</div></div>
  <div class="title"><div>অভিভাবকদের আচরণবিধি</div><div class="muted">প্রি-অ্যাডমিশন ${bn(s.session)}</div></div>
</header>
<p class="note" style="margin-top:12px;font-weight:700">এই পৃষ্ঠাটি জমা দেবেন না, আপনার কাছে রাখুন। মনোযোগ দিয়ে পড়ে ফর্মের পৃষ্ঠা ${bn(d.formPages ?? 4)}-এ অঙ্গীকারের ঘরগুলোতে টিক দিন।</p>
<section class="rules big">${conduct.groups
    .map((g) => `<div class="gh">${esc(txt(g.title, 'bengali'))}</div><ol>${g.rules.map((r) => `<li><b>${bn(++ruleNo)}</b><span>${esc(txt(r, 'bengali'))}</span></li>`).join('')}</ol>`)
    .join('')}</section>
</body></html>`;
}

/** The last page, the guardian's copy: the fee receipt the office fills in and the WhatsApp group. */
export function guardianCopyHtml(d: OfflineData): string {
  const s = d.snapshot.settings;
  const fee = taka(s.applicationFee, 'bengali');
  const field = (name: string) => `<span style="display:flex;flex-direction:column;gap:3px"><span class="small">${name}</span><i class="ans"></i></span>`;
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>${d.fontCss}${CSS}@page{margin:14mm 13mm}</style></head><body>
<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${schoolLine(d.school.line)}</div></div>
  <div class="title"><div>অভিভাবকের কপি</div><div class="muted">প্রি-অ্যাডমিশন ${bn(s.session)}</div></div>
</header>
<div class="note" style="margin-top:12px;font-weight:700">এই পৃষ্ঠাটি জমা দেবেন না। অফিস রসিদ অংশ পূরণ করে ফেরত দেবে, যত্ন করে রাখুন।</div>
<section class="receipt">
  <div class="band">আবেদন ফি-র রসিদ <span class="hint">(অফিস পূরণ করবে)</span></div>
  <span style="grid-column:1/-1">${field('শিক্ষার্থীর নাম')}</span>${field('আবেদিত শ্রেণী')}${field('আবেদন আইডি (অফিস পূরণ করবে)')}${field('রসিদ নং')}${field('তারিখ')}
  <div style="grid-column:1/-1">আবেদন ফি <b>${esc(fee)}</b> নগদে গৃহীত। ফেরতযোগ্য নয়।</div>
  <span style="grid-column:2;display:flex;flex-direction:column;gap:3px;margin-top:18px"><i class="line"></i><span class="small">গ্রহণকারীর স্বাক্ষর ও সিল</span></span>
</section>
${
  d.whatsappQrSvg
    ? `<section class="wa">${d.whatsappQrSvg}<div><div style="font-size:16px;font-weight:700">হোয়াটসঅ্যাপ গ্রুপে যোগ দিন</div><p style="margin:6px 0">অ্যাসেসমেন্টের তারিখ, সময় ও অন্যান্য সব খবর <b>শুধু এই গ্রুপেই</b>, আবেদন আইডি অনুযায়ী জানানো হবে।</p><div class="muted">ফোনের ক্যামেরা দিয়ে কোডটি স্ক্যান করুন</div></div></section>`
    : ''
}
<p class="muted" style="margin-top:18px;text-align:center">প্রশ্ন থাকলে: ${esc([d.school.phone, d.school.website].filter(Boolean).join(' · '))}</p>
</body></html>`;
}
