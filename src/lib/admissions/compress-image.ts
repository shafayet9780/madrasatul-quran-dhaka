// Browser only: phone photos are 3–5 MB; documents and photos are resized and re-encoded as JPEG
// on the device before upload (no library), so uploads are fast on mobile data and fit the limits.

const TARGETS = {
  photo: { maxEdge: 1000, maxBytes: 400 * 1024 },
  document: { maxEdge: 2000, maxBytes: 1200 * 1024 },
} as const;

async function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', quality));
}

/** Draws any image source onto a canvas no larger than `maxEdge` on its long side. */
export function drawScaled(source: CanvasImageSource, width: number, height: number, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** JPEG at the highest quality that fits the size target. */
export async function encodeJpeg(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob> {
  let blob = await toBlob(canvas, 0.86);
  for (const q of [0.78, 0.7, 0.6, 0.5]) {
    if (blob.size <= maxBytes) break;
    blob = await toBlob(canvas, q);
  }
  return blob;
}

/**
 * Resized JPEG of an image file (EXIF rotation applied), or the file unchanged when it is a PDF,
 * already small enough, or cannot be decoded (the server checks it either way).
 */
export async function compressForUpload(file: File, kind: 'photo' | 'document'): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  const { maxEdge, maxBytes } = TARGETS[kind];
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    if (file.size <= maxBytes && Math.max(bitmap.width, bitmap.height) <= maxEdge && file.type === 'image/jpeg') return file;
    const blob = await encodeJpeg(drawScaled(bitmap, bitmap.width, bitmap.height, maxEdge), maxBytes);
    bitmap.close();
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
