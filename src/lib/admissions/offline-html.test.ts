import { describe, expect, it } from 'vitest';
import { conductPageHtml, guardianCopyHtml, offlineFooterTemplate, offlineFormHtml, type OfflineData } from './offline-html';
import { buildSnapshot } from './snapshot';
import published from './testing/published-form.json';
import { liveFeeDocument } from './testing/live-form';
import { applyFormUpdates } from './updates-2027';

const snapshot = buildSnapshot({ ...(published as object), ...applyFormUpdates(published as never), fees: liveFeeDocument() } as never);
const data: OfflineData = {
  snapshot,
  school: { name: 'মাদরাসাতুল কুরআন', line: '', logo: null, phone: '01301226644', website: 'madrasatulquranbd.com' },
  whatsappQrSvg: '<svg id="qr"></svg>',
  fontCss: '',
};

describe('offline form (HTML)', () => {
  const html = offlineFormHtml(data);

  it('runs the chapters on from page 1 and closes with the pledges kept together, without the rules', () => {
    expect(html).not.toContain('class="page-break"');
    expect(html.match(/<section class="chapter first">/g)).toHaveLength(1);
    expect(html).toMatch(/\.keep\{break-inside:avoid\}/);
    expect(html).toContain('<section class="chapter keep pledge">');
    expect(html.indexOf('শিক্ষার্থীর তথ্য')).toBeLessThan(html.indexOf('অঙ্গীকার ও ঘোষণা'));
    expect(html).toContain('অভিভাবকদের আচরণবিধি পৃষ্ঠা ৫-এ দেওয়া আছে');
    expect(html).not.toContain('class="rules');
  });

  it('prints the code of conduct on a page of its own for the family to keep', () => {
    const page = conductPageHtml(data)!;
    const rules = snapshot.settings.conduct!.groups.flatMap((g) => g.rules);
    expect(page.match(/<li>/g)).toHaveLength(rules.length);
    expect(page).toContain('এই পৃষ্ঠাটি জমা দেবেন না, আপনার কাছে রাখুন');
    expect(page).toContain('ফর্মের পৃষ্ঠা ৪-এ');
    expect(conductPageHtml({ ...data, snapshot: { ...snapshot, settings: { ...snapshot.settings, conduct: undefined } } })).toBeNull();
  });

  it("stacks the child's names beside the photo frames and pairs short questions", () => {
    // The fixture mixes Unicode forms of Bengali, so compare normalised text.
    const page = html.normalize('NFC');
    const id = page.slice(page.indexOf('class="idgrid"'), page.indexOf('class="photos"'));
    // The names (gender, a choice, comes next and pairs with the date of birth below the frames).
    expect(id.match(/class="q"/g)).toHaveLength(2);
    expect(id).toContain('নাম (বাংলায়)'.normalize('NFC'));
    expect(id).toContain('Name (in English)');
    expect(id).not.toContain('class="pair"');
    const pairs = page.match(/<div class="pair">.*?<\/div><\/div><\/div>/g) ?? [];
    expect(pairs.some((p) => p.includes('(পিতা)'.normalize('NFC')) && p.includes('(মাতা)'.normalize('NFC')))).toBe(true);
  });

  it('numbers questions per chapter, notes conditions and leaves photos to the frames', () => {
    expect(html).toContain('৬. শিক্ষার্থী কি আগে কোনো শিক্ষা প্রতিষ্ঠানে পড়েছে?');
    expect(html).toContain('(৬-এ ‘হ্যাঁ’ হলে)');
    expect(html).toContain('(প্লে ছাড়া)');
    expect(html.match(/class="frame"/g)).toHaveLength(2);
  });

  it("prints a class's requirements beside it", () => {
    const withRules = structuredClone(snapshot);
    const classField = withRules.sections.flatMap((s) => s.fields).find((f) => f.role === 'classApplied')!;
    classField.options.at(-1)!.requires = [
      { field: 'student_gender', values: ['female'], message: { bengali: 'শুধু মেয়েদের জন্য' } },
      { field: 'arabic_level', values: ['knows_nahw_sarf'], message: { bengali: 'নাহু-সরফ জানা আবশ্যক' } },
    ];
    expect(offlineFormHtml({ ...data, snapshot: withRules })).toContain('<span class="hint">(শুধু মেয়েদের জন্য; নাহু-সরফ জানা আবশ্যক)</span>');
  });

  it('lists every route with its stops and charge, and asks for the area of a guardian off the routes', () => {
    for (const r of snapshot.transport!.routes) expect(html).toContain(r.name.bengali);
    expect(html).toContain('৳৫,০০০ / মাস');
    expect(html).toContain('কোনো রুটে না থাকলে');
    expect(html).toContain('পরিবহন সুবিধা:</b>');
  });

  it('has the three consents, both signatures, the office checks and the ID box', () => {
    expect(html.match(/class="consent/g)).toHaveLength(3);
    expect(html).toContain('এই ফর্মে প্রদত্ত');
    expect(html).toContain('মাতার স্বাক্ষর ও তারিখ');
    expect(html).toContain('ফটোকপি: সর্বশেষ ফলাফল কার্ড');
    expect(html).toContain('(যেমন KG-P01)');
    expect(html).not.toContain('মূল্যায়ন');
  });

  it("gives the guardian's copy the receipt and the WhatsApp QR", () => {
    const copy = guardianCopyHtml(data);
    expect(copy).toContain('আবেদন আইডি (অফিস পূরণ করবে)');
    expect(copy).toContain('<svg id="qr"></svg>');
    expect(guardianCopyHtml({ ...data, whatsappQrSvg: null })).not.toContain('হোয়াটসঅ্যাপ গ্রুপে যোগ দিন');
  });

  it("lists every office number with its label on the guardian's copy", () => {
    const phones = [
      { label: 'সিনিয়র এডমিন', number: '+880 1302-332244' },
      { label: 'এডমিন সেকশন', number: '+880 1301 226644' },
      { label: 'একাউন্টস সেকশন', number: '+880 1304 226644' },
    ];
    const copy = guardianCopyHtml({ ...data, school: { ...data.school, phones } });
    for (const p of phones) expect(copy).toContain(`<span class="small muted">${p.label}</span><b>${p.number}</b>`);
    expect(copy).toContain('madrasatulquranbd.com');
    // Without the list, the single number is shown.
    expect(guardianCopyHtml(data)).toContain('<b>01301226644</b>');
  });

  it('names the pages to hand in, and numbers page 1 printed on its own against the whole form', () => {
    expect(html).toContain('পূরণ করা পৃষ্ঠা ১ থেকে ৪');
    expect(html).toContain('আচরণবিধির পৃষ্ঠা (৫) আপনার কাছে রাখুন');
    const longer = offlineFormHtml({ ...data, formPages: 5 });
    expect(longer).toContain('পূরণ করা পৃষ্ঠা ১ থেকে ৫');
    expect(longer).toContain('আচরণবিধি পৃষ্ঠা ৬-এ');
    expect(offlineFooterTemplate('2027', '', 5)).toContain('/ 5</span>');
    expect(offlineFooterTemplate('2027', '')).toContain('class="totalPages"');
  });
});
