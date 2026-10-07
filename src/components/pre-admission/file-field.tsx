'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CircleCheck, FileText, ImageIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import type { FileAnswer } from '@/lib/admissions/answers';
import { compressForUpload } from '@/lib/admissions/compress-image';
import { fileSize, num, type Locale } from '@/lib/admissions/display';
import type { FormField } from '@/lib/admissions/form-config';
import { cn } from '@/lib/utils';
import { CameraDialog, cameraSupported } from './camera-dialog';

type UploadError = 'wrong_type' | 'too_large' | 'empty' | 'failed' | 'locked';

function upload(field: string, file: File, onProgress: (p: number) => void, signal: AbortSignal): Promise<FileAnswer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = new FormData();
    body.append('field', field);
    body.append('file', file);
    xhr.open('POST', '/api/admissions/upload');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      const data = (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return {};
        }
      })();
      if (data.ok) resolve(data.file);
      else reject(new Error(data.error ?? 'failed'));
    };
    xhr.onerror = () => reject(new Error('failed'));
    signal.addEventListener('abort', () => xhr.abort());
    xhr.onabort = () => reject(new DOMException('aborted', 'AbortError'));
    xhr.send(body);
  });
}

export function FileField({
  field,
  value,
  locale,
  error,
  describedBy,
  onUploaded,
}: {
  field: FormField;
  value: FileAnswer | undefined;
  locale: Locale;
  error?: string | null;
  describedBy?: string;
  onUploaded: (file: FileAnswer) => void;
}) {
  const t = useTranslations('preAdmission.file');
  const photo = field.fileKind === 'photo';
  const id = `f-${field.key}`;
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [progress, setProgress] = useState<{ name: string; value: number } | null>(null);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reduced, setReduced] = useState<{ from: number; to: number } | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function handle(original: File | undefined) {
    if (!original) return;
    setUploadError(null);
    const file = await compressForUpload(original, photo ? 'photo' : 'document');
    setReduced(file !== original && original.size > file.size * 1.5 ? { from: original.size, to: file.size } : null);
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ name: original.name, value: 0 });
    try {
      const saved = await upload(field.key, file, (value) => setProgress({ name: original.name, value }), controller.signal);
      if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file));
      onUploaded(saved);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const code = (e as Error).message as UploadError;
        setUploadError(['wrong_type', 'too_large', 'empty', 'locked'].includes(code) ? code : 'failed');
      }
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  }

  const takePhoto = () => (cameraSupported() ? setCameraOpen(true) : cameraInputRef.current?.click());
  const accept = photo ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf';
  const thumb = preview ?? (value && value.type.startsWith('image/') ? `/api/admissions/file?key=${encodeURIComponent(value.key)}` : null);
  const shownError = uploadError ? t(`errors.${uploadError}`) : error;

  const inputs = (
    <>
      <input ref={galleryRef} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => handle(e.target.files?.[0]).then(() => (e.target.value = ''))} />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => handle(e.target.files?.[0]).then(() => (e.target.value = ''))}
      />
      {photo && <CameraDialog open={cameraOpen} onOpenChange={setCameraOpen} onCapture={(file) => handle(file)} />}
    </>
  );

  if (progress) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card py-2.5 pl-3 pr-2" role="status">
        <FileText className="size-5 flex-none text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex justify-between gap-3 text-[13.5px]">
            <span className="truncate">{progress.name}</span>
            <span className="text-muted-foreground">
              {t('uploading')} {num(Math.round(progress.value * 100), locale)}%
            </span>
          </span>
          <span className="h-1 rounded-full bg-muted">
            <span className="block h-1 rounded-full bg-primary transition-[width]" style={{ width: `${Math.round(progress.value * 100)}%` }} />
          </span>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-9" aria-label={t('cancel')} onClick={() => abortRef.current?.abort()}>
          <X aria-hidden />
        </Button>
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-3.5">
        {inputs}
        {photo ? (
          thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb} alt={t('preview')} className="h-[104px] w-[84px] flex-none rounded-lg border object-cover md:h-[90px] md:w-[72px]" />
          ) : null
        ) : (
          <span className="flex size-11 flex-none items-center justify-center rounded-lg border bg-card">
            <FileText className="size-5 text-muted-foreground" aria-hidden />
          </span>
        )}
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <CircleCheck className="size-4" aria-hidden />
            {t('added')}
          </span>
          <span className="max-w-full truncate text-[13px] text-muted-foreground">
            {reduced ? t('compressed', { from: fileSize(reduced.from, locale), to: fileSize(reduced.to, locale) }) : `${value.name}, ${fileSize(value.size, locale)}`}
          </span>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-9 bg-card shadow-none"
            aria-describedby={describedBy}
            onClick={() => (photo ? takePhoto() : galleryRef.current?.click())}
          >
            {t('change')}
          </Button>
          {photo && (
            <button type="button" className="text-[13px] text-muted-foreground underline underline-offset-[3px]" onClick={() => galleryRef.current?.click()}>
              {t('choosePhoto')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-input bg-card p-[18px]',
        shownError && 'border-destructive',
      )}
    >
      {inputs}
      {photo ? <Camera className="size-6 text-muted-foreground" aria-hidden /> : <FileText className="size-6 text-muted-foreground" aria-hidden />}
      <div className="flex flex-wrap justify-center gap-2">
        {photo ? (
          <>
            <Button id={id} type="button" variant="outline" className="h-10 bg-card shadow-none" aria-describedby={describedBy} aria-invalid={!!shownError} onClick={takePhoto}>
              <Camera aria-hidden /> {t('takePhoto')}
            </Button>
            <Button type="button" variant="outline" className="h-10 bg-card shadow-none" onClick={() => galleryRef.current?.click()}>
              <ImageIcon aria-hidden /> {t('choosePhoto')}
            </Button>
          </>
        ) : (
          <>
            <Button id={id} type="button" variant="outline" className="h-10 bg-card shadow-none" aria-describedby={describedBy} aria-invalid={!!shownError} onClick={() => galleryRef.current?.click()}>
              {t('chooseFile')}
            </Button>
            <Button type="button" variant="outline" className="h-10 bg-card shadow-none" onClick={() => cameraInputRef.current?.click()}>
              <Camera aria-hidden /> {t('takePhoto')}
            </Button>
          </>
        )}
      </div>
      {uploadError && (
        <p role="alert" className="text-center text-[13px] text-destructive">
          {t(`errors.${uploadError}`)}
        </p>
      )}
    </div>
  );
}
