'use client';

import { useEffect, useState } from 'react';
import { Check, CircleCheck, Copy, Download, FileText, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { num, type Locale } from '@/lib/admissions/display';

type Props = { locale: Locale; publicRef: string; pdfUrl: string | null; pdfName: string; whatsappUrl: string | null; qrSvg: string | null; emailed: boolean };

const storageKey = (ref: string) => `mq-admission-tasks:${ref}`;

export function CopyId({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-10 flex-none bg-card shadow-none"
      aria-label={label}
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
    </Button>
  );
}

/** The two required tasks after payment, each ticked when done (remembered on this device). */
export function ConfirmationTasks({ locale, publicRef, pdfUrl, pdfName, whatsappUrl, qrSvg, emailed }: Props) {
  const t = useTranslations('preAdmission.status');
  const [done, setDone] = useState({ pdf: false, whatsapp: false });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(publicRef)) ?? '{}');
      setDone({ pdf: !!saved.pdf, whatsapp: !!saved.whatsapp });
    } catch {}
  }, [publicRef]);

  function mark(task: 'pdf' | 'whatsapp') {
    const next = { ...done, [task]: true };
    setDone(next);
    try {
      localStorage.setItem(storageKey(publicRef), JSON.stringify(next));
    } catch {}
  }

  const count = Number(done.pdf) + Number(done.whatsapp);
  const marker = (n: number, isDone: boolean) =>
    isDone ? (
      <CircleCheck className="size-7 flex-none text-success" aria-hidden />
    ) : (
      <span className="flex size-7 flex-none items-center justify-center rounded-full border border-input text-[13.5px] font-semibold" aria-hidden>
        {num(n, locale)}
      </span>
    );

  return (
    <section aria-labelledby="tasks-title" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 pt-2">
        <h2 id="tasks-title" className="text-lg font-semibold md:text-xl">
          {t('tasksTitle')}
        </h2>
        <span className="text-[13.5px] text-muted-foreground" aria-live="polite">
          {t('tasksDone', { done: num(count, locale) })}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <div className="flex flex-col gap-3.5 rounded-xl border bg-card p-4">
          <div className="flex gap-3">
            {marker(1, done.pdf)}
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold leading-normal">{t('pdfTitle')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('pdfLead')}</p>
            </div>
          </div>
          {pdfUrl ? (
            <>
              <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
                <FileText className="size-5 flex-none text-muted-foreground" aria-hidden />
                <span className="min-w-0 break-all text-[13.5px] font-medium">{pdfName}</span>
              </div>
              <Button asChild variant={done.pdf ? 'outline' : 'default'} className={done.pdf ? 'h-11 bg-card shadow-none' : 'h-11'}>
                <a href={pdfUrl} download={pdfName} onClick={() => mark('pdf')}>
                  {!done.pdf && <Download aria-hidden />}
                  {done.pdf ? t('pdfOpenAgain') : t('pdfDownload')}
                </a>
              </Button>
              {emailed && <p className="text-[12.5px] text-muted-foreground">{t('emailCopy')}</p>}
            </>
          ) : (
            <p className="rounded-lg border px-3 py-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{t('pdfPreparing')}</p>
          )}
        </div>

        <div className="flex flex-col gap-3.5 rounded-xl border bg-card p-4">
          <div className="flex gap-3">
            {marker(2, done.whatsapp)}
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold leading-normal">{t('whatsappTitle')}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('whatsappLead')}</p>
            </div>
          </div>
          {whatsappUrl ? (
            <>
              {done.whatsapp ? (
                <p className="text-sm text-muted-foreground">{t('whatsappOpened')}</p>
              ) : (
                <Button asChild className="h-11">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => mark('whatsapp')}>
                    <MessageCircle aria-hidden />
                    {t('whatsappJoin')}
                  </a>
                </Button>
              )}
              {qrSvg && (
                <div className="flex items-center gap-3.5 border-t pt-3.5">
                  <div role="img" aria-label={t('whatsappQrLabel')} className="size-24 flex-none overflow-hidden rounded-lg border bg-white p-1.5 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                  <span className="text-[13.5px] leading-relaxed text-muted-foreground">{t('whatsappQr')}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('whatsappMissing')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
