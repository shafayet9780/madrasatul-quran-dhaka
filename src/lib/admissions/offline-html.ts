import { num, taka, txt } from './display';
import { CHOICE_TYPES, NO_ROUTE, allFields, type FormField, type FormSection, type FormSnapshot } from './form-config';

// The printable offline form (docs/pre-admission-mockups/Off1–Off6), generated from the same form
// version as the online one. Pages 1 to 5 are handed in to the office with the fee; page 6 (the
// guardian's copy: fee receipt and WhatsApp QR) comes back. Black ink only, so it survives
// photocopying. Paper forms are never typed into the system. Printed to A4 by pdf.ts: pages 2–5
// repeat the application ID line in the header (page 1 has it in the office box), page 6 stands alone.

export type OfflineData = {
  snapshot: FormSnapshot;
  school: { name: string; line: string; logo: string | null; phone: string; website: string };
  whatsappQrSvg: string | null;
  fontCss: string;
  /** Pages handed in (all but the guardian's copy); pdf.ts corrects it if the printed form differs. */
  formPages?: number;
};

const esc = (value: string) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const bn = (value: number | string) => num(value, 'bengali');
const label = (f: FormField) => esc(txt(f.label, 'bengali'));
const star = (f: FormField) => (f.required ? ' <span class="req">*</span>' : '');
const isPhoto = (f: FormField) => f.type === 'file' && f.fileKind === 'photo';

const CSS = `
@page{size:A4;margin:22mm 13mm 16mm}
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#000;font-family:'Inter','Noto Sans Bengali',sans-serif;font-size:12px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.muted{color:#404040}.small{font-size:10.5px}.req{font-weight:700}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:8px;border-bottom:2px solid #000}
.brand{display:flex;align-items:center;gap:10px}.brand img{width:46px;height:46px;border-radius:50%;object-fit:cover}.brand .name{font-size:19px;font-weight:700;line-height:1.3}
.title{text-align:right}.title div:first-child{font-size:16px;font-weight:700}
.officebox{border:1.5px solid #000;border-radius:6px;padding:6px 10px;margin-top:10px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.howto{border:1px solid #737373;border-radius:6px;padding:7px 10px;margin-top:8px;line-height:1.55}
.chapter{margin-top:12px}
.ch{margin:0 0 6px;font-size:14px;font-weight:700;display:flex;align-items:center;gap:8px;break-after:avoid}
.ch span{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:1.5px solid #000;font-size:11px}
.q{break-inside:avoid;margin-top:7px}.q .lbl{font-weight:600}.q .hint{font-weight:400;color:#404040}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
.ans{display:block;height:8.5mm;border:1px solid #a3a3a3;border-radius:5px;margin-top:3px}.ans.tall{height:20mm}
.opts{display:flex;flex-wrap:wrap;gap:3px 18px;margin-top:3px}.opt{display:inline-flex;align-items:center;gap:6px}
.o{flex:none;display:inline-block;width:12px;height:12px;border:1.3px solid #000;border-radius:50%}.c{flex:none;display:inline-block;width:12px;height:12px;border:1.3px solid #000;border-radius:2px}
.date{display:flex;gap:8px;margin-top:3px}.date span{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10px;color:#404040}.date i{display:block;height:8.5mm;border:1px solid #a3a3a3;border-radius:5px}
.photos{display:flex;gap:14px;float:right;margin:0 0 6px 14px}.frame{width:30mm;height:38mm;border:1.3px dashed #000;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:10px;gap:2px;padding:4px}
.routes{width:100%;border-collapse:collapse;margin-top:4px}.routes th,.routes td{border:1px solid #a3a3a3;padding:3px 6px;text-align:left;vertical-align:top}.routes th{font-weight:600;background:#f2f2f2}.routes .area td{font-weight:700;background:#f2f2f2}
.stops{display:flex;flex-wrap:wrap;gap:2px 12px}
.note{margin:8px 0 0;padding:5px 9px;border-left:3px solid #000;background:#f2f2f2;line-height:1.5}
.page-break{break-before:page}
.rules ol{list-style:none;margin:0;padding:0}.rules li{display:grid;grid-template-columns:20px 1fr;line-height:1.5;padding:1px 0}.rules .gh{font-weight:700;margin-top:6px}
.consent{display:flex;gap:8px;align-items:flex-start;border:1px solid #737373;border-radius:6px;padding:6px 10px;margin-top:6px;line-height:1.5}.consent.boxed{border:2px solid #000}.consent .c{margin-top:3px}
.signs{display:grid;grid-template-columns:1fr 1fr;gap:16px 28px;margin-top:22px}.signs span{display:flex;flex-direction:column;gap:3px;font-size:10.5px}
.line{display:inline-block;border-bottom:1px solid #000;height:18px;min-width:120px}
.office{border:1.5px dashed #000;border-radius:6px;padding:8px 12px;margin-top:14px;display:flex;flex-direction:column;gap:8px;break-inside:avoid}
.receipt{border:1.5px solid #000;border-radius:8px;padding:12px 16px;margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:14px 24px}
.wa{border:1.5px solid #000;border-radius:8px;padding:14px 16px;margin-top:16px;display:flex;gap:18px;align-items:center}.wa svg{width:44mm;height:44mm}
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
  const blocks: string[] = [];
  const noted = new Set<string>();
  for (let i = 0; i < shown.length; i++) {
    const f = shown[i];
    const group = section.groups.find((g) => g.key === f.group);
    if (group && !noted.has(group.key) && txt(group.description, 'bengali')) {
      noted.add(group.key);
      blocks.push(`<p class="note"><b>${esc(txt(group.title, 'bengali'))}:</b> ${esc(txt(group.description, 'bengali'))}</p>`);
    }
    const q = (g: FormField) =>
      `<div class="q"><div class="lbl">${bn(numbers.get(g.key)!)}. ${label(g)}${star(g)}${conditionHint(g, numbers, fields)}</div>${answer(
        g,
        snapshot,
        section.fields.filter((d) => d.showWhen?.field === g.key),
      )}</div>`;
    // Two short answers that sit side by side online also pair up on paper.
    const next = shown[i + 1];
    if (f.width === 'half' && next?.width === 'half') {
      blocks.push(`<div class="pair">${q(f)}${q(next)}</div>`);
      i++;
    } else blocks.push(q(f));
  }
  return `<section class="chapter"><h2 class="ch"><span>${bn(n)}</span>${esc(txt(section.title, 'bengali'))}</h2>${photosHtml}${blocks.join('')}</section>`;
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
  // Page 1: the first chapter; pages 2–3: the middle chapters; page 4: the last; page 5: the pledge.
  const [first, ...more] = sections;
  const last = more.length > 1 ? more.at(-1) : undefined;
  const middle = last ? more.slice(0, -1) : more;
  let n = 0;
  const chapters =
    chapterHtml(first, ++n, snapshot, fields, photosHtml) +
    (middle.length ? `<div class="page-break"></div>${middle.map((sec) => chapterHtml(sec, ++n, snapshot, fields)).join('')}` : '') +
    (last ? `<div class="page-break"></div>${chapterHtml(last, ++n, snapshot, fields)}` : '');

  let ruleNo = 0;
  const conduct = s.conduct;
  const consent = (text: string, boxed = false) => `<div class="consent${boxed ? ' boxed' : ''}"><i class="c"></i><div>${esc(text)}</div></div>`;
  const pledgePage = `<div class="page-break"></div><section class="chapter rules"><h2 class="ch"><span>${bn(++n)}</span>${conduct ? 'অভিভাবকদের আচরণবিধি ও অঙ্গীকার' : 'ঘোষণা'}</h2>
${
  conduct
    ? conduct.groups
        .map((g) => `<div class="gh">${esc(txt(g.title, 'bengali'))}</div><ol>${g.rules.map((r) => `<li><b>${bn(++ruleNo)}</b><span>${esc(txt(r, 'bengali'))}</span></li>`).join('')}</ol>`)
        .join('')
    : ''
}
<div class="lbl" style="font-weight:700;margin-top:10px">${conduct ? 'অঙ্গীকার ও ঘোষণা (তিনটি ঘরেই টিক দিন)' : 'ঘোষণা (ঘরে টিক দিন)'}</div>
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
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${d.school.line ? `<div class="small muted">${esc(d.school.line)}</div>` : ''}</div></div>
  <div class="title"><div>প্রি-অ্যাডমিশন ফর্ম</div><div class="muted">শিক্ষাবর্ষ ${bn(s.session)}</div></div>
</header>
<div class="officebox"><b>শুধু অফিসের জন্য</b><span>আবেদন আইডি <span class="small muted">(যেমন KG-P01)</span> <i class="line" style="min-width:100px"></i></span><span>গ্রহণের তারিখ <i class="line" style="min-width:80px"></i></span><span>গ্রহণকারী <i class="line" style="min-width:80px"></i></span></div>
<div class="howto">স্পষ্ট করে লিখুন। <b>*</b> চিহ্নিত প্রশ্নের উত্তর আবশ্যক। <i class="o" style="vertical-align:-1px"></i> চিহ্নে একটি, <i class="c" style="vertical-align:-1px"></i> চিহ্নে একাধিক বাছাই করা যাবে। পূরণ করা পৃষ্ঠা ১ থেকে ${bn(d.formPages ?? 5)} আবেদন ফি <b>${esc(fee)}</b> সহ অফিসে জমা দিন। শেষ পৃষ্ঠা (অভিভাবকের কপি) অফিস পূরণ করে আপনাকে ফেরত দেবে।</div>
${chapters}
${pledgePage}
</body></html>`;
}

/** Repeated on pages 2–5: the school and form, and the application ID line the office fills in (e.g. KG-P01). */
export function offlineHeaderTemplate(session: string, fontCss: string): string {
  return `<div style="width:100%;padding:0 13mm;display:flex;justify-content:space-between;align-items:flex-end;gap:12px;font-size:9.5px;color:#000;font-family:'Inter','Noto Sans Bengali',sans-serif"><style>${fontCss}</style><span>মাদরাসাতুল কুরআন · প্রি-অ্যাডমিশন ফর্ম ${bn(session)}</span><span>আবেদন আইডি (অফিস পূরণ করবে) <span style="display:inline-block;width:42mm;border-bottom:1px solid #000"></span></span></div>`;
}

/** The student's name line and the page number; `total` is given when page 1 is printed on its own. */
export function offlineFooterTemplate(session: string, fontCss: string, total?: number): string {
  const totalHtml = total ? String(total) : '<span class="totalPages"></span>';
  return `<div style="width:100%;padding:0 13mm;display:flex;justify-content:space-between;gap:12px;font-size:9px;color:#000;font-family:'Inter','Noto Sans Bengali',sans-serif"><style>${fontCss}</style><span>শিক্ষার্থীর নাম <span style="display:inline-block;width:60mm;border-bottom:1px solid #000"></span></span><span>প্রি-অ্যাডমিশন ফর্ম ${bn(session)} · অফলাইন · পৃষ্ঠা <span class="pageNumber"></span> / ${totalHtml}</span></div>`;
}

/** Page 6, the guardian's copy: the fee receipt the office fills in and the WhatsApp group. */
export function guardianCopyHtml(d: OfflineData): string {
  const s = d.snapshot.settings;
  const fee = taka(s.applicationFee, 'bengali');
  const field = (name: string) => `<span style="display:flex;flex-direction:column;gap:3px"><span class="small">${name}</span><i class="ans" style="height:8mm"></i></span>`;
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8"><style>${d.fontCss}${CSS}@page{margin:14mm 13mm}</style></head><body>
<header class="top">
  <div class="brand">${d.school.logo ? `<img src="${d.school.logo}" alt="">` : ''}<div><div class="name">${esc(d.school.name)}</div>${d.school.line ? `<div class="small muted">${esc(d.school.line)}</div>` : ''}</div></div>
  <div class="title"><div>অভিভাবকের কপি</div><div class="muted">প্রি-অ্যাডমিশন ${bn(s.session)}</div></div>
</header>
<div class="howto" style="border:2px solid #000;font-weight:700">এই পৃষ্ঠাটি জমা দেবেন না। অফিস রসিদ অংশ পূরণ করে ফেরত দেবে, যত্ন করে রাখুন।</div>
<section class="receipt">
  <div style="grid-column:1/-1;font-size:15px;font-weight:700">আবেদন ফি-র রসিদ <span class="hint">(অফিস পূরণ করবে)</span></div>
  ${field('শিক্ষার্থীর নাম')}${field('আবেদিত শ্রেণী')}${field('আবেদন আইডি (অফিস পূরণ করবে)')}${field('রসিদ নং')}${field('তারিখ')}
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
