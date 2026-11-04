/** The school's pin (also the homepage's JSON-LD). Directions go to it, not to a name Google may match elsewhere. */
export const SCHOOL_LOCATION = {
  latitude: 23.8563215,
  longitude: 90.3682335,
} as const;

/** Google Maps directions from wherever the visitor is to the school, on foot or by car when given. */
export function directionsUrl(mode?: 'walking' | 'driving'): string {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${SCHOOL_LOCATION.latitude},${SCHOOL_LOCATION.longitude}`;
  return mode ? `${url}&travelmode=${mode}` : url;
}
