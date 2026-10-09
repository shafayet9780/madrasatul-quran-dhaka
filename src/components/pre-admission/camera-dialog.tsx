'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, SwitchCamera } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/shadcn/dialog';
import { drawScaled, encodeJpeg } from '@/lib/admissions/compress-image';

// Passport-style capture: the live camera with a 7:9 frame (35 × 45 mm); only the frame is kept.
const FRAME_WIDTH = 0.7; // of the viewfinder width
const FRAME_RATIO = 9 / 7;

export function cameraSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

export function CameraDialog({ open, onOpenChange, onCapture }: { open: boolean; onOpenChange: (open: boolean) => void; onCapture: (file: File) => void }) {
  const t = useTranslations('preAdmission.file.camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;
    setFailed(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, facing, shot, stop]);

  useEffect(() => () => void (shot && URL.revokeObjectURL(shot.url)), [shot]);

  async function capture() {
    const video = videoRef.current;
    const box = boxRef.current;
    if (!video || !box || !video.videoWidth) return;
    // The video fills the viewfinder with object-cover; map the frame back to video pixels.
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    const scale = Math.max(cw / video.videoWidth, ch / video.videoHeight);
    const fw = cw * FRAME_WIDTH;
    const fh = fw * FRAME_RATIO;
    const sx = ((cw - fw) / 2 + (video.videoWidth * scale - cw) / 2) / scale;
    const sy = ((ch - fh) / 2 + (video.videoHeight * scale - ch) / 2) / scale;
    const crop = document.createElement('canvas');
    crop.width = Math.round(fw / scale);
    crop.height = Math.round(fh / scale);
    crop.getContext('2d')!.drawImage(video, sx, sy, crop.width, crop.height, 0, 0, crop.width, crop.height);
    const blob = await encodeJpeg(drawScaled(crop, crop.width, crop.height, 1000), 400 * 1024);
    stop();
    setShot({ url: URL.createObjectURL(blob), blob });
  }

  function close(next: boolean) {
    if (!next) {
      stop();
      setShot(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="adm gap-3 rounded-xl p-4 sm:max-w-md" showCloseButton>
        <DialogTitle className="text-base font-semibold">{t('title')}</DialogTitle>
        <DialogDescription className="text-[13.5px] leading-normal text-muted-foreground">{failed ? t('unavailable') : t('frame')}</DialogDescription>
        {!failed && (
          <div ref={boxRef} className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-900">
            {shot ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shot.url} alt="" className="absolute inset-0 m-auto h-auto w-[70%] rounded-md" />
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className={`size-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`} />
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                  style={{ aspectRatio: '7 / 9' }}
                >
                  <div className="absolute left-1/2 top-[12%] h-[58%] w-[62%] -translate-x-1/2 rounded-[50%] border border-dashed border-white/70" />
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {failed ? (
            <Button variant="outline" className="h-11 shadow-none" onClick={() => close(false)}>
              {t('close')}
            </Button>
          ) : shot ? (
            <>
              <Button variant="outline" className="h-11 shadow-none" onClick={() => setShot(null)}>
                <RefreshCw aria-hidden /> {t('retake')}
              </Button>
              <Button
                className="h-11"
                onClick={() => {
                  onCapture(new File([shot.blob], 'camera.jpg', { type: 'image/jpeg' }));
                  close(false);
                }}
              >
                {t('use')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="h-11 shadow-none" onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}>
                <SwitchCamera aria-hidden /> {t('switch')}
              </Button>
              <Button className="h-11 flex-1 sm:flex-none" onClick={capture}>
                {t('capture')}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
