'use client';

import { useEffect, useState } from 'react';
import { Check, CircleCheck, Copy, Download, FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/shadcn/button';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
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

type WhatsAppStep = 'join' | 'opened' | 'joined';
type Done = { pdf: boolean; whatsapp: WhatsAppStep };

/**
 * The two required tasks after payment, remembered on this device. The PDF is done once downloaded;
 * WhatsApp only when the guardian confirms they joined (opening the link is not enough).
 */
export function ConfirmationTasks({ locale, publicRef, pdfUrl, pdfName, whatsappUrl, qrSvg, emailed }: Props) {
  const t = useTranslations('preAdmission.status');
  const [done, setDone] = useState<Done>({ pdf: false, whatsapp: 'join' });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(publicRef)) ?? '{}');
      setDone({ pdf: !!saved.pdf, whatsapp: saved.whatsapp === 'opened' || saved.whatsapp === 'joined' ? saved.whatsapp : 'join' });
    } catch {}
  }, [publicRef]);

  function save(next: Done) {
    setDone(next);
    try {
      localStorage.setItem(storageKey(publicRef), JSON.stringify(next));
    } catch {}
  }
  const openGroup = () => done.whatsapp === 'join' && save({ ...done, whatsapp: 'opened' });
  const joined = done.whatsapp === 'joined';

  const count = Number(done.pdf) + Number(joined);
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
                <a href={pdfUrl} download={pdfName} onClick={() => save({ ...done, pdf: true })}>
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

        <div className="flex flex-col gap-3.5 rounded-xl border-2 border-whatsapp bg-card p-4">
          <div className="flex gap-3">
            {marker(2, joined)}
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <WhatsAppIcon className="size-[22px] flex-none text-whatsapp-logo" />
                  <h3 className="text-base font-semibold leading-normal">{t('whatsappTitle')}</h3>
                </span>
                <span className="flex-none rounded-md border border-whatsapp px-[7px] text-xs font-semibold leading-5 text-whatsapp">{t('important')}</span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('whatsappLead')}</p>
            </div>
          </div>
          {whatsappUrl ? (
            <>
              {done.whatsapp === 'join' && (
                <Button asChild className="h-11 bg-whatsapp font-semibold text-whatsapp-foreground hover:bg-whatsapp/90">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={openGroup}>
                    <WhatsAppIcon className="size-[18px]" />
                    {t('whatsappJoin')}
                  </a>
                </Button>
              )}
              {done.whatsapp === 'opened' && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-sm leading-relaxed">{t('whatsappOpened')}</p>
                  <Button type="button" className="h-11 bg-whatsapp font-semibold text-whatsapp-foreground hover:bg-whatsapp/90" onClick={() => save({ ...done, whatsapp: 'joined' })}>
                    <Check aria-hidden />
                    {t('whatsappJoined')}
                  </Button>
                  <Button asChild variant="outline" className="h-11 bg-card shadow-none">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      {t('whatsappOpenAgain')}
                    </a>
                  </Button>
                </div>
              )}
              {joined && (
                <div className="flex flex-col gap-2.5">
                  <p className="text-sm leading-relaxed text-muted-foreground">{t('whatsappDone')}</p>
                  <Button asChild variant="outline" className="h-11 bg-card shadow-none">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      {t('whatsappOpenGroup')}
                    </a>
                  </Button>
                </div>
              )}
              {qrSvg && (
                <div className="flex items-center gap-3.5 border-t pt-3.5">
                  <div role="img" aria-label={t('whatsappQrLabel')} className="size-[104px] flex-none overflow-hidden rounded-lg border bg-white p-1.5 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
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
