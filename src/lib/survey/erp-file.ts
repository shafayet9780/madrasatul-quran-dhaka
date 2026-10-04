import ExcelJS from 'exceljs';
import { parseCsv, readTable } from './erp-import';

/** Matches serverActions.bodySizeLimit in next.config.ts. */
const MAX_BYTES = 5 * 1024 * 1024;

function sheetTable(sheet: ExcelJS.Worksheet): string[][] {
  const table: string[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const cells: string[] = [];
    for (let i = 1; i <= sheet.columnCount; i++) {
      const cell = row.getCell(i);
      // Long numbers (mobiles, IDs) must keep every digit, whatever the cell format.
      cells.push(typeof cell.value === 'number' ? String(cell.value) : cell.text ?? '');
    }
    table.push(cells);
  });
  return table;
}

/**
 * Reads an uploaded ERP export into rows of text cells: a CSV, or the first sheet of an .xlsx
 * that has the ID / Name / Class header (cover or summary sheets are skipped).
 */
export async function readUpload(file: File): Promise<{ table: string[][]; sheetName?: string } | { error: string }> {
  if (file.size > MAX_BYTES) return { error: 'ফাইলটি ৫ MB-এর বেশি বড়।' };
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return { table: parseCsv(await file.text()) };
  if (name.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(await file.arrayBuffer());
    } catch {
      return { error: 'Excel ফাইলটি খোলা যায়নি। ERP থেকে আবার ডাউনলোড করে দিন।' };
    }
    if (!workbook.worksheets.length) return { error: 'Excel ফাইলে কোনো শিট নেই।' };
    for (const sheet of workbook.worksheets) {
      const table = sheetTable(sheet);
      if (!('error' in readTable(table))) return { table, sheetName: sheet.name };
    }
    return { table: sheetTable(workbook.worksheets[0]), sheetName: workbook.worksheets[0].name };
  }
  return { error: 'শুধু CSV বা Excel (.xlsx) ফাইল দেওয়া যাবে।' };
}
