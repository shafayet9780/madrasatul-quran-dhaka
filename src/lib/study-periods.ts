/** Preserve the original three/five-slot timetable, including intentional gaps. */
export function studyPeriods(
  islamic: string,
  general: string,
  rowIndex: number
) {
  if (rowIndex >= 10)
    return { islamic: [islamic], general: [general], merged: true };
  const islamicSlots = islamic.split(',').map(subject => subject.trim());
  if (rowIndex >= 7 && rowIndex <= 9) islamicSlots.unshift('');
  const generalSlots = general.split(',').map(subject => subject.trim());
  return {
    islamic: [
      ...islamicSlots,
      ...Array(Math.max(0, 3 - islamicSlots.length)).fill(''),
    ],
    general: [
      ...generalSlots,
      ...Array(Math.max(0, 5 - generalSlots.length)).fill(''),
    ],
    merged: false,
  };
}
