import { describe, expect, it } from 'vitest';
import { guardianCopyHtml, offlineFooterTemplate, offlineFormHtml, type OfflineData } from './offline-html';
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

  it('starts with the first chapter on page 1, keeps later chapters whole and the pledge on a page of its own', () => {
    expect(html.match(/class="page-break"/g)).toHaveLength(1);
    expect(html.match(/<section class="chapter first">/g)).toHaveLength(1);
    expect(html.match(/<section class="chapter keep">/g)).toHaveLength(snapshot.sections.length - 1);
    expect(html).toMatch(/\.keep\{break-inside:avoid\}/);
    expect(html.indexOf('শিক্ষার্থীর তথ্য')).toBeLessThan(html.indexOf('অভিভাবকদের আচরণবিধি ও অঙ্গীকার'));
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

  it('names the pages to hand in, and numbers page 1 printed on its own against the whole form', () => {
    expect(html).toContain('পূরণ করা পৃষ্ঠা ১ থেকে ৫');
    expect(offlineFormHtml({ ...data, formPages: 6 })).toContain('পূরণ করা পৃষ্ঠা ১ থেকে ৬');
    expect(offlineFooterTemplate('2027', '', 5)).toContain('/ 5</span>');
    expect(offlineFooterTemplate('2027', '')).toContain('class="totalPages"');
  });
});
