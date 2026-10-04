export type RoundStatus = 'scheduled' | 'open' | 'closed';

export function roundStatus(round: { opensAt: Date; closesAt: Date }, now = new Date()): RoundStatus {
  if (now < round.opensAt) return 'scheduled';
  return now < round.closesAt ? 'open' : 'closed';
}
