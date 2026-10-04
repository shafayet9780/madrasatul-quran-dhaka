import 'server-only';
import { google, type sheets_v4 } from 'googleapis';

// Server-only Google Sheets access with the service account. Spreadsheet IDs come from
// server env (FORM_GOOGLE_SHEETS_ID, SURVEY_SHEET_ID), never from a request.

let client: sheets_v4.Sheets | undefined;

export function sheetsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL);
}

export function getSheetsClient(): sheets_v4.Sheets {
  if (!client) {
    if (!sheetsConfigured()) throw new Error('Google Sheets credentials not configured');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: 'service_account',
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        // .env files keep the key on one line with literal \n; Vercel stores real newlines.
        private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    client = google.sheets({ version: 'v4', auth });
  }
  return client;
}
