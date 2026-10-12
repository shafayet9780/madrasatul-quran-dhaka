import { WHATSAPP_LOGO_PATH } from '@/lib/whatsapp-logo';

export function WhatsAppIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden {...props}>
      <path d={WHATSAPP_LOGO_PATH} />
    </svg>
  );
}
