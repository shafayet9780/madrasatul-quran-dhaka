import { describe, expect, it } from 'vitest';
import { parseCsv, planImport, readTable, type ClassMapping, type ExistingStudent } from './erp-import';

// Real ERP list format: Photo column, empty roll, "Section A", +880 contacts, mixed-case names.
const CSV = [
  'Student List,,,,,,,,',
  'ID,Roll,Photo,Name,Class,Section,Father Name,Father Contact,Mother Contact',
  '10011,1,photo.jpg,ADRUP HOSSAIN MAHAJ,Nursery,Section A,MD. HOSSAIN,+8801712345678,+8801812345678',
  '10012,,photo.jpg,Maryam Binte Rafiq,Nursery,Section A,Rafiqul Islam,+8801912345678,',
  '10013,3,,Zayan Mahmud,KG,Section B,,"+880 1612-345678",01512345678',
  '10014,2,,Tasnia Islam,Play,Section A,Abdul Karim,+88017123,',
  '10172,,,Nafisa Anjum,Seven,,X,,',
  '10194,5,,,Four,,Y,,',
  '10011,9,,Duplicate Row,Four,,Z,,',
  '১০০১৫,৪,,Hamza Rahim,Two,Male,Rahim,০১৯১১২২২৩৩৩,',
  '10016,A1,,Sumaya Akter,Two,Female,,,',
  '10017,6,,Ibrahim,Three,Section C,,,',
  ',,,,,,,,',
].join('\r\n');

const CLASSES: ClassMapping[] = [
  { key: 'play', name: 'প্লে', erpClassNames: ['Play'], sections: [] },
  { key: 'nursery', name: 'নার্সারি', erpClassNames: ['Nursery'], sections: [{ key: 'a', name: 'A', erpSectionNames: ['Section A'] }, { key: 'b', name: 'B', erpSectionNames: ['Section B'] }] },
  { key: 'kg', name: 'কেজি', erpClassNames: ['KG'], sections: [{ key: 'a', name: 'A', erpSectionNames: ['Section A'] }, { key: 'b', name: 'B', erpSectionNames: ['section b'] }] },
  { key: 'two', name: 'দ্বিতীয়', erpClassNames: ['Two'], sections: [{ key: 'male', name: 'বালক', erpSectionNames: ['Male'] }, { key: 'female', name: 'বালিকা', erpSectionNames: ['Female'] }] },
  { key: 'three', name: 'তৃতীয়', erpClassNames: ['Three'], sections: [{ key: 'male', name: 'বালক', erpSectionNames: ['Male'] }] },
  { key: 'four', name: 'চতুর্থ', erpClassNames: ['Four'], sections: [] },
];

const EXISTING: ExistingStudent[] = [
  // Unchanged
  { erpId: '10011', name: 'ADRUP HOSSAIN MAHAJ', classKey: 'nursery', sectionKey: 'a', roll: 1, fatherName: 'MD. HOSSAIN', fatherMobile: '8801712345678', motherMobile: '8801812345678', active: true },
  // Roll and section changed
  { erpId: '10013', name: 'Zayan Mahmud', classKey: 'kg', sectionKey: 'a', roll: 7, fatherName: null, fatherMobile: '8801612345678', motherMobile: '8801512345678', active: true },
  // Inactive, back in the file
  { erpId: '10016', name: 'Sumaya Akter', classKey: 'two', sectionKey: 'female', roll: null, fatherName: null, fatherMobile: null, motherMobile: null, active: false },
  // Left the school
  { erpId: '10099', name: 'Ariyan Sheikh', classKey: 'four', sectionKey: '', roll: 3, fatherName: null, fatherMobile: null, motherMobile: null, active: true },
];

function plan() {
  const read = readTable(parseCsv(CSV));
  if ('error' in read) throw new Error(read.error);
  return { read, plan: planImport(read, CLASSES, EXISTING) };
}

describe('parseCsv', () => {
  it('handles quotes, BOM and CRLF', () => {
    expect(parseCsv('﻿a,"b, ""c""",d\r\n1,2,3')).toEqual([['a', 'b, "c"', 'd'], ['1', '2', '3']]);
  });
});

describe('readTable', () => {
  it('finds the header below a title row and ignores Photo', () => {
    const { read } = plan();
    expect(read.columns).toEqual(['ID', 'Roll', 'Name', 'Class', 'Section', 'Father Name', 'Father Contact', 'Mother Contact']);
    expect(read.ignoredColumns).toEqual(['Photo']);
    expect(read.rows).toHaveLength(10);
    expect(read.rows[0]).toMatchObject({ line: 3, id: '10011', name: 'ADRUP HOSSAIN MAHAJ', section: 'Section A' });
  });
  it('explains a file without the needed columns', () => {
    expect(readTable([['Name', 'Phone']])).toHaveProperty('error');
  });
});

describe('planImport', () => {
  it('keeps ERP IDs as they are apart from Bengali digits', () => {
    const read = readTable(parseCsv('ID,Name,Class\n2024-001,A,Four\n১০০২,B,Four'));
    if ('error' in read) throw new Error(read.error);
    expect(planImport(read, CLASSES, []).students.map((s) => s.erpId)).toEqual(['2024-001', '1002']);
  });

  it('imports valid rows with canonical mobiles and keeps names as they are', () => {
    const { plan: p } = plan();
    expect(p.students.map((s) => s.erpId)).toEqual(['10011', '10012', '10013', '10014', '10015', '10016']);
    expect(p.students.find((s) => s.erpId === '10013')).toMatchObject({ classKey: 'kg', sectionKey: 'b', roll: 3, fatherMobile: '8801612345678', motherMobile: '8801512345678' });
    expect(p.students.find((s) => s.erpId === '10012')).toMatchObject({ roll: null, motherMobile: null, name: 'Maryam Binte Rafiq' });
    expect(p.students.find((s) => s.erpId === '10015')).toMatchObject({ classKey: 'two', sectionKey: 'male', roll: 4, fatherMobile: '8801911222333' });
  });

  it('skips unusable rows and imports unreadable rolls and mobiles blank', () => {
    const { plan: p } = plan();
    expect(p.problems.map((x) => [x.line, x.outcome, x.issue])).toEqual([
      [6, 'altered', 'Section “Section A” · প্লে-এ কোনো শাখা নেই'],
      [6, 'altered', 'Father Contact “+88017123” · নম্বর সঠিক নয়'],
      [7, 'skipped', 'Class “Seven” · কোনো শ্রেণির সাথে ম্যাপ করা নেই'],
      [8, 'skipped', 'Name ফাঁকা'],
      [9, 'skipped', 'একই ID আগের একটি সারিতে আছে'],
      [11, 'altered', 'Roll “A1” · সংখ্যা নয়'],
      [12, 'skipped', 'Section “Section C” · তৃতীয়-এর কোনো শাখার সাথে ম্যাপ করা নেই'],
    ]);
    expect(p.students.find((s) => s.erpId === '10014')?.fatherMobile).toBeNull();
  });

  it('classifies adds, updates, unchanged and deactivations', () => {
    const { plan: p } = plan();
    expect(p.adds.map((s) => s.erpId)).toEqual(['10012', '10014', '10015']);
    expect(p.updates.map((u) => [u.student.erpId, u.changes])).toEqual([
      ['10013', ['section', 'roll']],
      ['10016', ['reactivated']],
    ]);
    expect(p.unchanged).toBe(1);
    expect(p.deactivations.map((s) => s.erpId)).toEqual(['10099']);
  });

  it('summarises how ERP classes map', () => {
    const { plan: p } = plan();
    expect(p.mapping.find((m) => m.erp === 'Nursery · Section A')).toEqual({ erp: 'Nursery · Section A', classKey: 'nursery', sectionKey: 'a', count: 2 });
    expect(p.mapping.find((m) => m.erp === 'Seven · —')).toMatchObject({ classKey: null, count: 1 });
    expect(p.mapping.find((m) => m.erp === 'Play · Section A')).toMatchObject({ classKey: 'play', sectionKey: '' });
  });
});
