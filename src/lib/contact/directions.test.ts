import { describe, expect, it } from 'vitest';
import { directionsUrl } from './directions';

describe('directionsUrl', () => {
  it('goes to the school pin, not a name Google may match elsewhere', () => {
    expect(directionsUrl()).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=23.8563215,90.3682335'
    );
  });

  it('asks for walking or driving directions', () => {
    expect(directionsUrl('walking')).toMatch(/&travelmode=walking$/);
    expect(directionsUrl('driving')).toMatch(/&travelmode=driving$/);
  });
});
