import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import { WHATSAPP_LOGO_PATH } from '@/lib/whatsapp-logo';
import { whatsappQrSvg } from './whatsapp-qr';

const url = 'https://chat.whatsapp.com/AbCdEfGhIjKlMnOpQrStUv';

describe('WhatsApp group QR', () => {
  it('uses the strongest error correction, with the logo on a white square in the centre', async () => {
    const svg = await whatsappQrSvg(url, { size: 120, ink: 'screen' });
    const modules = (s: string) => Number(/viewBox="0 0 (\d+)/.exec(s)?.[1]);
    expect(modules(svg)).toBe(modules(await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'H' })));
    expect(svg).toContain(WHATSAPP_LOGO_PATH);
    expect(svg).toMatch(/<rect x="[\d.]+" y="[\d.]+" width="\d+" height="\d+" rx="[\d.]+" fill="#ffffff"/);
    expect(svg.trimEnd().endsWith('</svg></svg>')).toBe(true);
  });

  it('draws the logo green on screen and black on paper', async () => {
    expect(await whatsappQrSvg(url, { size: 120, ink: 'screen' })).toContain('fill="#25D366"');
    const print = await whatsappQrSvg(url, { size: 120, ink: 'print' });
    expect(print).not.toContain('#25D366');
    expect(print).toContain(`<path fill="#000000" d="${WHATSAPP_LOGO_PATH}"`);
  });
});
