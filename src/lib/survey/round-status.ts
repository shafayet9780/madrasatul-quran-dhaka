export type RoundStatus = 'scheduled' | 'open' | 'closed';

export function roundStatus(round: { opensAt: Date; closesAt: Date }, now = new Date()): RoundStatus {
  if (now >= round.closesAt) return 'closed';
  return now < round.opensAt ? 'scheduled' : 'open';
}
