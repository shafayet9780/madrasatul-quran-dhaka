import ExcelJS from 'exceljs';
import { parseCsv } from './erp-import';

const MAX_BYTES = 5 * 1024 * 1024;

/** Reads an uploaded ERP export (CSV or the first sheet of an .xlsx) into rows of text cells. */
export async function readUpload(file: File): Promise<string[][] | { error: string }> {
  if (file.size > MAX_BYTES) return { error: 'ফাইলটি ৫ MB-এর বেশি বড়।' };
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return parseCsv(await file.text());
  if (name.endsWith('.xlsx')) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(await file.arrayBuffer());
    } catch {
      return { error: 'Excel ফাইলটি খোলা যায়নি। ERP থেকে আবার ডাউনলোড করে দিন।' };
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) return { error: 'Excel ফাইলে কোনো শিট নেই।' };
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
  return { error: 'শুধু CSV বা Excel (.xlsx) ফাইল দেওয়া যাবে।' };
}
