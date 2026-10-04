import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { readUpload } from './erp-file';

async function xlsxFile() {
  const workbook = new ExcelJS.Workbook();
  // A cover sheet first: the reader must skip it.
  workbook.addWorksheet('Cover').addRow(['Madrasatul Quran', 'Student List']);
  const sheet = workbook.addWorksheet('Students');
  sheet.addRow(['ID', 'Roll', 'Photo', 'Name', 'Class', 'Section', 'Father Name', 'Father Contact', 'Mother Contact']);
  // ERP exports often store IDs and mobiles as numbers.
  sheet.addRow([10011, 1, null, 'Maryam Binte Rafiq', 'Nursery', 'Section A', 'Rafiq', 8801712345678, '+8801812345678']);
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer as ArrayBuffer], 'students.xlsx');
}

describe('readUpload', () => {
  it('reads the first sheet of an xlsx keeping every digit of numeric cells', async () => {
    const upload = await readUpload(await xlsxFile());
    if ('error' in upload) throw new Error(upload.error);
    expect(upload.sheetName).toBe('Students');
    expect(upload.table[1]).toEqual(['10011', '1', '', 'Maryam Binte Rafiq', 'Nursery', 'Section A', 'Rafiq', '8801712345678', '+8801812345678']);
  });

  it('reads CSV and refuses other formats', async () => {
    expect(await readUpload(new File(['ID,Name\n1,A'], 'list.csv'))).toEqual({ table: [['ID', 'Name'], ['1', 'A']] });
    expect(await readUpload(new File(['x'], 'list.pdf'))).toEqual({ error: 'শুধু CSV বা Excel (.xlsx) ফাইল দেওয়া যাবে।' });
    expect(await readUpload(new File(['not a zip'], 'broken.xlsx'))).toHaveProperty('error');
  });
});
