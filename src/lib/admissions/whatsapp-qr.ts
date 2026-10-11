import QRCode from 'qrcode';
import { WHATSAPP_LOGO_GREEN, WHATSAPP_LOGO_PATH } from '@/lib/whatsapp-logo';

// The WhatsApp group QR (docs/pre-admission-mockups/QRWhatsApp): the strongest error correction
// (H, about 30% of the code may be covered) with the logo on a small white square in the centre.
// The squares stay black; the logo is green on screen and black on paper (PDF, offline form).

export async function whatsappQrSvg(url: string, { size, ink }: { size: number; ink: 'screen' | 'print' }): Promise<string> {
  const svg = await QRCode.toString(url, { type: 'svg', margin: 0, width: size, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#ffffff' } });
  const modules = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1]);
  if (!modules) return svg;
  // A white square a little over a quarter of the width (about 7% of the area), on whole modules.
  const box = Math.round(modules * 0.28) | 1;
  const at = (modules - box) / 2;
  const pad = box * 0.12;
  const logo = `<rect x="${at}" y="${at}" width="${box}" height="${box}" rx="${box * 0.22}" fill="#ffffff" shape-rendering="geometricPrecision"/><svg x="${at + pad}" y="${at + pad}" width="${box - 2 * pad}" height="${box - 2 * pad}" viewBox="0 0 24 24" shape-rendering="geometricPrecision"><path fill="${ink === 'screen' ? WHATSAPP_LOGO_GREEN : '#000000'}" d="${WHATSAPP_LOGO_PATH}"/></svg>`;
  return svg.replace(/<\/svg>\s*$/, `${logo}</svg>`);
}
