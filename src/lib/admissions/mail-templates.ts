import { num, taka, type Locale } from './display';

// The two admissions emails, in the guardian's language. Plain single-column HTML with inline
// styles (email clients ignore stylesheets) and a text version.

export type Email = { subject: string; html: string; text: string };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(locale: Locale, title: string, body: string): string {
  const font = locale === 'bengali' ? "'Noto Sans Bengali','Kalpurush',Arial,sans-serif" : "Inter,Arial,sans-serif";
  return `<!doctype html><html lang="${locale === 'bengali' ? 'bn' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#fafafa;color:#171717;font-family:${font};font-size:15px;line-height:1.6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e5e5;border-radius:12px">
<tr><td style="padding:20px 24px;border-bottom:1px solid #e5e5e5;font-weight:600">${locale === 'bengali' ? 'মাদরাসাতুল কুরআন' : 'Madrasatul Quran'}</td></tr>
<tr><td style="padding:24px">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#7a4d32;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px">${esc(label)}</a>`;

export function confirmationEmail(p: {
  locale: Locale;
  session: string;
  publicRef: string;
  studentName: string;
  whatsappUrl: string | null;
  statusUrl: string;
  evaluationFee: number;
}): Email {
  const bn = p.locale === 'bengali';
  const session = num(p.session, p.locale);
  const fee = taka(p.evaluationFee, p.locale);
  const subject = bn ? `আবেদন সম্পন্ন: ${p.publicRef}, প্রি-অ্যাডমিশন ${session}` : `Application complete: ${p.publicRef}, pre-admission ${session}`;
  const lines = bn
    ? {
        title: 'আলহামদুলিল্লাহ, আবেদন জমা হয়েছে',
        id: 'আবেদন আইডি',
        pdf: 'আবেদনপত্র (PDF) এই ইমেইলের সঙ্গে সংযুক্ত। এটি প্রিন্ট করে মূল্যায়নের দিন অবশ্যই সঙ্গে আনবেন।',
        group: 'মূল্যায়নের তারিখ ও সময় শুধু হোয়াটসঅ্যাপ গ্রুপে, আবেদন আইডি অনুযায়ী জানানো হবে।',
        join: 'হোয়াটসঅ্যাপ গ্রুপে যোগ দিন',
        bring: 'সঙ্গে আনবেন: আবেদনপত্রের প্রিন্ট, জন্ম নিবন্ধন সনদের মূল কপি এবং নগদ ' + fee + ' মূল্যায়ন ফি।',
        again: 'আবেদনপত্র আবার ডাউনলোড করতে এখানে যান',
      }
    : {
        title: 'Alhamdulillah, your application is complete',
        id: 'Application ID',
        pdf: 'The application (PDF) is attached. Print it and bring it on evaluation day.',
        group: 'The evaluation date and time are announced only in the WhatsApp group, by application ID.',
        join: 'Join the WhatsApp group',
        bring: `Bring: the printed application, the original birth certificate and the ${fee} evaluation fee in cash.`,
        again: 'To download the application again, open your application page',
      };
  const html = layout(
    p.locale,
    subject,
    `<h1 style="margin:0 0 16px;font-size:20px;line-height:1.4">${esc(lines.title)}</h1>
<p style="margin:0 0 4px;color:#525252;font-size:13px">${esc(lines.id)}</p>
<p style="margin:0 0 4px;font-family:Inter,Arial,sans-serif;font-size:30px;font-weight:700;letter-spacing:.02em">${esc(p.publicRef)}</p>
<p style="margin:0 0 20px;color:#525252">${esc(p.studentName)}</p>
<p style="margin:0 0 16px">${esc(lines.pdf)}</p>
<p style="margin:0 0 12px">${esc(lines.group)}</p>
${p.whatsappUrl ? `<p style="margin:0 0 20px">${button(p.whatsappUrl, lines.join)}</p>` : ''}
<p style="margin:0 0 16px">${esc(lines.bring)}</p>
<p style="margin:0;font-size:13px;color:#525252">${esc(lines.again)}: <a href="${esc(p.statusUrl)}" style="color:#171717">${esc(p.statusUrl)}</a></p>`,
  );
  const text = [lines.title, '', `${lines.id}: ${p.publicRef}`, p.studentName, '', lines.pdf, lines.group, p.whatsappUrl ? `${lines.join}: ${p.whatsappUrl}` : '', lines.bring, '', `${lines.again}: ${p.statusUrl}`]
    .filter((l, i, all) => l !== '' || all[i - 1] !== '')
    .join('\n');
  return { subject, html, text };
}

export function resumeEmail(p: { locale: Locale; session: string; resumeUrl: string; deadline: string | null }): Email {
  const bn = p.locale === 'bengali';
  const session = num(p.session, p.locale);
  const subject = bn ? `আপনার প্রি-অ্যাডমিশন ${session} আবেদনে ফিরে আসার লিংক` : `Your link to continue the pre-admission ${session} application`;
  const lines = bn
    ? {
        title: 'আবেদন শুরু হয়েছে',
        body: 'যেকোনো সময় এই লিংক দিয়ে যেকোনো ফোন বা কম্পিউটার থেকে আবেদন চালিয়ে যেতে পারবেন। লেখা নিজে থেকেই সংরক্ষিত হয়।',
        button: 'আবেদন চালিয়ে যান',
        deadline: p.deadline ? `শেষ সময়: ${p.deadline}` : '',
        private: 'লিংকটি কাউকে দেবেন না: এটি দিয়ে আপনার আবেদন খোলা যায়।',
      }
    : {
        title: 'Your application has started',
        body: 'Use this link any time to continue on any phone or computer. Your answers save automatically.',
        button: 'Continue my application',
        deadline: p.deadline ? `Deadline: ${p.deadline}` : '',
        private: 'Do not share this link: it opens your application.',
      };
  const html = layout(
    p.locale,
    subject,
    `<h1 style="margin:0 0 12px;font-size:20px;line-height:1.4">${esc(lines.title)}</h1>
<p style="margin:0 0 20px">${esc(lines.body)}</p>
<p style="margin:0 0 20px">${button(p.resumeUrl, lines.button)}</p>
${lines.deadline ? `<p style="margin:0 0 12px">${esc(lines.deadline)}</p>` : ''}
<p style="margin:0;font-size:13px;color:#525252">${esc(lines.private)}</p>`,
  );
  const text = [lines.title, '', lines.body, '', `${lines.button}: ${p.resumeUrl}`, lines.deadline, '', lines.private].filter((l, i, all) => l !== '' || all[i - 1] !== '').join('\n');
  return { subject, html, text };
}
