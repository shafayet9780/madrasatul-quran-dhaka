import { normaliseMobile, toAsciiDigits } from './normalise';

// ERP student list → students table. Pure planning: reading the file and writing rows happen elsewhere.

export type ErpRow = {
  line: number;
  id: string;
  roll: string;
  name: string;
  cls: string;
  section: string;
  fatherName: string;
  fatherContact: string;
  motherContact: string;
};

export type ClassMapping = {
  key: string;
  name: string;
  erpClassNames: string[];
  sections: { key: string; name: string; erpSectionNames: string[] }[];
};

export type StudentRecord = {
  erpId: string;
  name: string;
  classKey: string;
  sectionKey: string;
  roll: number | null;
  fatherName: string | null;
  fatherMobile: string | null;
  motherMobile: string | null;
};

export type ExistingStudent = StudentRecord & { active: boolean };

export type ImportProblem = {
  line: number;
  id: string;
  name: string;
  issue: string;
  /** What happens to the row, in words for the admin. */
  action: string;
  outcome: 'skipped' | 'altered';
};

export type Change = 'name' | 'class' | 'section' | 'roll' | 'mobile' | 'father' | 'reactivated';

export type ImportPlan = {
  columns: string[];
  ignoredColumns: string[];
  rowCount: number;
  /** Every ID that appears in the file, including skipped rows: they are not deactivated. */
  fileIds: string[];
  students: StudentRecord[];
  adds: StudentRecord[];
  updates: { student: StudentRecord; changes: Change[] }[];
  unchanged: number;
  deactivations: ExistingStudent[];
  /** Active students before this import. */
  activeBefore: number;
  problems: ImportProblem[];
  mapping: { erp: string; classKey: string | null; sectionKey: string; count: number }[];
};

const COLUMNS = {
  id: 'id',
  roll: 'roll',
  name: 'name',
  cls: 'class',
  section: 'section',
  fatherName: 'father name',
  fatherContact: 'father contact',
  motherContact: 'mother contact',
} as const;
const REQUIRED: (keyof typeof COLUMNS)[] = ['id', 'name', 'cls'];

const norm = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Finds the header row (the first row with ID, Name and Class) and reads the rows below it.
 * Column order does not matter; Photo and any unknown columns are ignored.
 */
export function readTable(table: string[][]): { rows: ErpRow[]; columns: string[]; ignoredColumns: string[] } | { error: string } {
  const headerIndex = table.findIndex((row) => {
    const cells = row.map(norm);
    return REQUIRED.every((field) => cells.includes(COLUMNS[field]));
  });
  if (headerIndex === -1) return { error: 'ফাইলে ID, Name ও Class কলাম পাওয়া যায়নি। ERP-র শিক্ষার্থী তালিকা (CSV বা Excel) দিন।' };

  const header = table[headerIndex].map(norm);
  const index = Object.fromEntries(Object.entries(COLUMNS).map(([field, title]) => [field, header.indexOf(title)])) as Record<keyof typeof COLUMNS, number>;
  const known = new Set<string>(Object.values(COLUMNS));
  const columns = table[headerIndex].filter((title) => known.has(norm(title)));
  const ignoredColumns = table[headerIndex].filter((title) => title.trim() && !known.has(norm(title)));
  const cell = (row: string[], field: keyof typeof COLUMNS) => (index[field] >= 0 ? (row[index[field]] ?? '').trim() : '');

  const rows = table
    .slice(headerIndex + 1)
    .map((row, i) => ({ row, line: headerIndex + i + 2 }))
    .filter(({ row }) => row.some((value) => value.trim()))
    .map(({ row, line }) => ({
      line,
      id: cell(row, 'id'),
      roll: cell(row, 'roll'),
      name: cell(row, 'name'),
      cls: cell(row, 'cls'),
      section: cell(row, 'section'),
      fatherName: cell(row, 'fatherName'),
      fatherContact: cell(row, 'fatherContact'),
      motherContact: cell(row, 'motherContact'),
    }));
  return { rows, columns, ignoredColumns };
}

type Place = { classKey: string; sectionKey: string; ignoredSection?: string };

function resolvePlace(classes: ClassMapping[], row: ErpRow): Place | { problem: string; action: string } {
  const cls = classes.find((c) => c.erpClassNames.some((name) => norm(name) === norm(row.cls)));
  if (!cls) {
    return {
      problem: `Class “${row.cls || 'ফাঁকা'}” · কোনো শ্রেণির সাথে ম্যাপ করা নেই`,
      action: 'Studio-তে শ্রেণি যোগ বা ম্যাপ করুন; না হলে সারিটি বাদ যাবে',
    };
  }
  if (!cls.sections.length) return { classKey: cls.key, sectionKey: '', ...(row.section ? { ignoredSection: `Section “${row.section}” · ${cls.name}-এ কোনো শাখা নেই` } : {}) };
  const section = cls.sections.find((s) => s.erpSectionNames.some((name) => norm(name) === norm(row.section)));
  if (!section) {
    return {
      problem: `Section “${row.section || 'ফাঁকা'}” · ${cls.name}-এর কোনো শাখার সাথে ম্যাপ করা নেই`,
      action: 'Studio-তে শাখার ERP নাম যোগ করুন; না হলে সারিটি বাদ যাবে',
    };
  }
  return { classKey: cls.key, sectionKey: section.key };
}

function changesBetween(before: ExistingStudent, after: StudentRecord): Change[] {
  const changes: Change[] = [];
  if (before.name !== after.name) changes.push('name');
  if (before.classKey !== after.classKey) changes.push('class');
  else if (before.sectionKey !== after.sectionKey) changes.push('section');
  if (before.roll !== after.roll) changes.push('roll');
  if (before.fatherMobile !== after.fatherMobile || before.motherMobile !== after.motherMobile) changes.push('mobile');
  if (before.fatherName !== after.fatherName) changes.push('father');
  if (!before.active) changes.push('reactivated');
  return changes;
}

/**
 * Valid rows import; rows without an ID or name, with a repeated ID or an unmapped class/section
 * are skipped; an unreadable roll or mobile is imported blank. Students missing from the file
 * become inactive (never deleted).
 */
export function planImport(
  read: { rows: ErpRow[]; columns: string[]; ignoredColumns: string[] },
  classes: ClassMapping[],
  existing: ExistingStudent[]
): ImportPlan {
  const problems: ImportProblem[] = [];
  const students: StudentRecord[] = [];
  const seen = new Set<string>();
  const mapping = new Map<string, { erp: string; classKey: string | null; sectionKey: string; count: number }>();

  for (const row of read.rows) {
    // Stored as the ERP has it (Bengali digits converted); typed lookups normalise both sides.
    const id = toAsciiDigits(row.id).trim();
    const skip = (issue: string, action = 'সারিটি বাদ যাবে') => problems.push({ line: row.line, id, name: row.name, issue, action, outcome: 'skipped' });
    const alter = (issue: string, action: string) => problems.push({ line: row.line, id, name: row.name, issue, action, outcome: 'altered' });

    const place = resolvePlace(classes, row);
    const erpLabel = `${row.cls || '—'} · ${row.section || '—'}`;
    const entry = mapping.get(erpLabel) ?? { erp: erpLabel, classKey: 'problem' in place ? null : place.classKey, sectionKey: 'problem' in place ? '' : place.sectionKey, count: 0 };
    entry.count += 1;
    mapping.set(erpLabel, entry);

    if (!id) {
      skip('ID ফাঁকা');
      continue;
    }
    if (seen.has(id)) {
      skip('একই ID আগের একটি সারিতে আছে');
      continue;
    }
    seen.add(id);
    if (!row.name) {
      skip('Name ফাঁকা');
      continue;
    }
    if ('problem' in place) {
      skip(place.problem, place.action);
      continue;
    }

    if (place.ignoredSection) alter(place.ignoredSection, 'শাখা ছাড়া ইমপোর্ট হবে; দরকার হলে Studio-তে শাখা যোগ করুন');

    let roll: number | null = null;
    const rollText = toAsciiDigits(row.roll).trim();
    if (rollText) {
      if (/^\d{1,4}$/.test(rollText)) roll = Number(rollText);
      else alter(`Roll “${row.roll}” · সংখ্যা নয়`, 'রোল ছাড়া ইমপোর্ট হবে');
    }
    const mobile = (value: string, label: string) => {
      if (!value) return null;
      const canonical = normaliseMobile(value);
      if (!canonical) alter(`${label} “${value}” · নম্বর সঠিক নয়`, 'নম্বর ছাড়া ইমপোর্ট হবে; এই নম্বরে অভিভাবক যাচাই হবেন না');
      return canonical;
    };

    students.push({
      erpId: id,
      name: row.name,
      classKey: place.classKey,
      sectionKey: place.sectionKey,
      roll,
      fatherName: row.fatherName || null,
      fatherMobile: mobile(row.fatherContact, 'Father Contact'),
      motherMobile: mobile(row.motherContact, 'Mother Contact'),
    });
  }

  const byId = new Map(existing.map((s) => [s.erpId, s]));
  const adds: StudentRecord[] = [];
  const updates: ImportPlan['updates'] = [];
  let unchanged = 0;
  for (const student of students) {
    const before = byId.get(student.erpId);
    if (!before) {
      adds.push(student);
      continue;
    }
    const changes = changesBetween(before, student);
    if (changes.length) updates.push({ student, changes });
    else unchanged += 1;
  }
  const inFile = new Set(seen);
  const deactivations = existing.filter((s) => s.active && !inFile.has(s.erpId));

  return {
    columns: read.columns,
    ignoredColumns: read.ignoredColumns,
    rowCount: read.rows.length,
    fileIds: [...seen],
    students,
    adds,
    updates,
    unchanged,
    deactivations,
    activeBefore: existing.filter((s) => s.active).length,
    problems,
    mapping: [...mapping.values()],
  };
}

/** Minimal CSV reader (RFC 4180 quoting, UTF-8 BOM, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^﻿/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
