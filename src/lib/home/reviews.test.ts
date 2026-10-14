import { describe, expect, it } from 'vitest';
import type { Testimonial } from '@/types/home';
import { reviewsFor } from './reviews';

const review = (id: string, o: Partial<Testimonial> = {}): Testimonial => ({
  _id: id,
  originalLanguage: 'bengali',
  quote: { bengali: `কথা ${id}` },
  who: { bengali: 'অভিভাবক', english: 'Guardian' },
  classLine: { bengali: '৩য় শ্রেণি', english: 'Class 3' },
  consent: true,
  ...o,
});

describe('reviewsFor', () => {
  it('shows only reviews with recorded consent that are not hidden, at most three', () => {
    const list = [review('a'), review('b', { consent: false }), review('c', { consent: undefined }), review('d', { show: false }), review('e'), review('f'), review('g')];
    expect(reviewsFor(list, 'bengali').map((r) => r.id)).toEqual(['a', 'e', 'f']);
  });

  it('keeps the guardian’s own words, and marks a translation', () => {
    expect(reviewsFor([review('a')], 'english')[0]).toEqual({ id: 'a', text: 'কথা a', language: 'bengali', who: 'Guardian', classLine: 'Class 3', translated: false });
    expect(reviewsFor([review('a', { quote: { bengali: 'কথা', english: 'Words' } })], 'english')[0]).toMatchObject({ text: 'Words', language: 'english', translated: true });
    expect(reviewsFor([review('a', { quote: { bengali: 'কথা', english: 'Words' } })], 'bengali')[0]).toMatchObject({ text: 'কথা', translated: false });
  });

  it('leaves out a review without words', () => {
    expect(reviewsFor([review('a', { quote: { english: 'Only a translation' } })], 'bengali')).toEqual([]);
  });
});
