import { conditionMet, isMissingFile, isVisible, type Answers } from './answers';
import { num, txt, type Locale } from './display';
import { allFields, type FormSnapshot } from './form-config';

// "What to bring on assessment day" (Sanity → Cycle settings), personalised: items with "show only
// when" follow the answers, and a document marked "don't have it now" is flagged as a must-bring.
// Shown on the success page, the application PDF and the email. Pure.

export type BringItem = { text: string; missing: boolean };

export function bringItems(snapshot: Pick<FormSnapshot, 'settings' | 'sections'>, answers: Answers, locale: Locale): BringItem[] {
  const fields = new Map(allFields(snapshot).map((f) => [f.key, f]));
  const fee = num(snapshot.settings.evaluationFee.toLocaleString('en-US'), locale);
  return (snapshot.settings.bringList ?? [])
    .filter((item) => conditionMet(item.showWhen, answers))
    .map((item) => {
      const document = item.document ? fields.get(item.document) : undefined;
      return {
        text: txt(item.text, locale).replaceAll('{fee}', fee),
        missing: !!document && isVisible(document, answers) && isMissingFile(document, answers[document.key]),
      };
    });
}

/** The whole list before anyone has answered (intro page): conditional items are marked. */
export function allBringItems(snapshot: Pick<FormSnapshot, 'settings'>, locale: Locale): { text: string; conditional: boolean }[] {
  const fee = num(snapshot.settings.evaluationFee.toLocaleString('en-US'), locale);
  return (snapshot.settings.bringList ?? []).map((item) => ({ text: txt(item.text, locale).replaceAll('{fee}', fee), conditional: !!item.showWhen }));
}
