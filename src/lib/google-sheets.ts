import { google, sheets_v4 } from 'googleapis';

let sheetsClient: sheets_v4.Sheets | null = null;

export function getCredentials() {
  const creds = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!creds) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set');
  return JSON.parse(creds);
}

export function getSpreadsheetId() {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error('GOOGLE_SPREADSHEET_ID not set');
  return id;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (sheetsClient) return sheetsClient;
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function readSheet(range: string): Promise<string[][]> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return (response.data.values as string[][]) || [];
}

export async function writeSheet(range: string, values: (string | number | boolean)[][]): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

export async function appendSheet(range: string, values: (string | number | boolean)[][]): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

export async function clearSheetRange(range: string): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.values.clear({ spreadsheetId, range });
}

export async function batchUpdate(requests: sheets_v4.Schema$Request[]): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}

export async function ensureSheets(): Promise<void> {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = meta.data.sheets?.map((s) => s.properties?.title) || [];

  const required = [
    { title: 'Products', headers: ['id','name','genericName','barcode','categoryId','price','costPrice','stock','unit','minStock','expiryDate','supplierId','description','requirePrescription','status','createdAt','updatedAt'] },
    { title: 'Members', headers: ['id','code','name','phone','email','address','birthDate','points','totalSpent','joinDate','status','notes','createdAt'] },
    { title: 'Categories', headers: ['id','name','description'] },
    { title: 'Suppliers', headers: ['id','name','phone','email','address','notes'] },
    { title: 'Sales', headers: ['id','invoiceNo','memberId','memberName','subtotal','discount','finalAmount','paymentMethod','cashReceived','change','pointsEarned','pointsUsed','notes','status','createdAt'] },
    { title: 'SaleItems', headers: ['id','saleId','productId','productName','barcode','quantity','unitPrice','discount','totalPrice'] },
  ];

  const toCreate = required.filter((r) => !existingSheets.includes(r.title));

  if (toCreate.length > 0) {
    await batchUpdate(
      toCreate.map((s) => ({
        addSheet: { properties: { title: s.title } },
      }))
    );
    for (const s of toCreate) {
      await writeSheet(`${s.title}!A1`, [s.headers]);
    }
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function now(): string {
  return new Date().toISOString();
}
