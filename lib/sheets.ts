import { google } from 'googleapis';

// ============================================================
// COLUMN INDEX MAPPING  (matches your "Database" sheet exactly)
// Sr# | Style Ref | Style | Style Color/Shade | Fabric Code |
// B1 Fabric Code | Composition | Shrinkage Warp | Shrinkage Weft |
// Weight AW | Colors in Family | No Of Washes Made | Form No |
// Size | Fabric Price | Gender | Notes | Event (if any)
// ============================================================
const COL = {
  SR_NUM:           0,
  STYLE_REF:        1,
  STYLE:            2,
  COLOR_SHADE:      3,
  FABRIC_CODE:      4,
  B1_FABRIC_CODE:   5,
  COMPOSITION:      6,
  SHRINKAGE_WARP:   7,
  SHRINKAGE_WEFT:   8,
  WEIGHT_AW:        9,
  COLORS_IN_FAMILY: 10,
  NUM_WASHES:       11,
  FORM_NO:          12,
  SIZE:             13,
  FABRIC_PRICE:     14,   // ⚠️ PRIVATE
  GENDER:           15,
  NOTES:            16,   // ⚠️ PRIVATE
  EVENT:            17,   // ⚠️ PRIVATE
} as const;

// ============================================================
// TYPES
// ============================================================
export interface GarmentPublic {
  srNum: string;
  styleRef: string;
  style: string;
  colorShade: string;
  fabricCode: string;
  b1FabricCode: string;
  composition: string;
  shrinkageWarp: string;
  shrinkageWeft: string;
  weightAw: string;
  colorsInFamily: string;
  numWashes: string;
  formNo: string;
  size: string;
  gender: string;
}

export interface GarmentFull extends GarmentPublic {
  fabricPrice: string;   // PRIVATE
  notes: string;         // PRIVATE
  event: string;         // PRIVATE
}

export type Garment = GarmentPublic | GarmentFull;

// ============================================================
// GOOGLE SHEETS CLIENT  (server-side only — uses .env secrets)
// ============================================================
async function getSheets() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? '';
  // Strip any accidental leading/trailing quotes and replace escaped newlines
  const formattedKey = rawKey
    .replace(/^["']/, '')
    .replace(/["']$/, '')
    .replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: formattedKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

// ============================================================
// FETCH ALL ROWS  (Next.js caches this for 60 s to avoid
//   hammering the Sheets API during a busy fair day)
// ============================================================
async function fetchAllRows(): Promise<string[][]> {
  const sheets  = await getSheets();
  const sheetId = process.env.SPREADSHEET_ID;
  const range   = process.env.SHEET_RANGE ?? 'Database!A2:R'; // "Database" is your sheet tab name

  const res = await sheets.spreadsheets.values.get(
    { spreadsheetId: sheetId, range },
    // Next.js fetch cache — refresh every 60 seconds
    // @ts-ignore
    { next: { revalidate: 60 } }
  );

  return (res.data.values ?? []) as string[][];
}

// ============================================================
// ROW → OBJECT
// ============================================================
function toGarment(row: string[], includePrivate: boolean): Garment {
  const pub: GarmentPublic = {
    srNum:           String(row[COL.SR_NUM]           ?? ''),
    styleRef:        String(row[COL.STYLE_REF]        ?? ''),
    style:           String(row[COL.STYLE]            ?? ''),
    colorShade:      String(row[COL.COLOR_SHADE]      ?? ''),
    fabricCode:      String(row[COL.FABRIC_CODE]      ?? ''),
    b1FabricCode:    String(row[COL.B1_FABRIC_CODE]   ?? ''),
    composition:     String(row[COL.COMPOSITION]      ?? ''),
    shrinkageWarp:   String(row[COL.SHRINKAGE_WARP]   ?? ''),
    shrinkageWeft:   String(row[COL.SHRINKAGE_WEFT]   ?? ''),
    weightAw:        String(row[COL.WEIGHT_AW]        ?? ''),
    colorsInFamily:  String(row[COL.COLORS_IN_FAMILY] ?? ''),
    numWashes:       String(row[COL.NUM_WASHES]       ?? ''),
    formNo:          String(row[COL.FORM_NO]          ?? ''),
    size:            String(row[COL.SIZE]             ?? ''),
    gender:          String(row[COL.GENDER]           ?? ''),
  };

  if (!includePrivate) return pub;

  return {
    ...pub,
    fabricPrice: String(row[COL.FABRIC_PRICE] ?? ''),
    notes:       String(row[COL.NOTES]        ?? ''),
    event:       String(row[COL.EVENT]        ?? ''),
  } satisfies GarmentFull;
}

// ============================================================
// PUBLIC API FUNCTIONS  (called from API routes — server only)
// ============================================================

/** Find one style by its Style Ref (e.g. "REF-0008MO") */
export async function getStyleByRef(
  styleRef: string,
  includePrivate: boolean
): Promise<Garment | null> {
  const rows = await fetchAllRows();
  const row  = rows.find(
    (r) => (r[COL.STYLE_REF] ?? '').trim().toLowerCase() === styleRef.trim().toLowerCase()
  );
  return row ? toGarment(row, includePrivate) : null;
}

/** Full-text search across key columns */
export async function searchStyles(
  query: string,
  includePrivate: boolean
): Promise<Garment[]> {
  const rows = await fetchAllRows();
  const q    = query.toLowerCase().trim();
  if (!q) return [];

  return rows
    .filter((r) =>
      r[COL.STYLE_REF]   && (
        (r[COL.STYLE_REF]        ?? '').toLowerCase().includes(q) ||
        (r[COL.STYLE]            ?? '').toLowerCase().includes(q) ||
        (r[COL.COLOR_SHADE]      ?? '').toLowerCase().includes(q) ||
        (r[COL.FABRIC_CODE]      ?? '').toLowerCase().includes(q) ||
        (r[COL.COMPOSITION]      ?? '').toLowerCase().includes(q) ||
        (r[COL.GENDER]           ?? '').toLowerCase().includes(q)
      )
    )
    .slice(0, 50)
    .map((r) => toGarment(r, includePrivate));
}

/** Fetch specific rows by Sr# list */
export async function getStylesBySrNums(
  srNums: number[],
  includePrivate: boolean
): Promise<Garment[]> {
  const rows  = await fetchAllRows();
  const srSet = new Set(srNums.map(String));
  return rows
    .filter((r) => srSet.has((r[COL.SR_NUM] ?? '').trim()))
    .map((r) => toGarment(r, includePrivate));
}

/** Fetch a range of rows by Sr# (start → start+count-1) */
export async function getStylesBySrRange(
  start: number,
  count: number,
  includePrivate: boolean
): Promise<Garment[]> {
  const rows = await fetchAllRows();
  const end  = start + count - 1;
  return rows
    .filter((r) => {
      const sr = parseInt(r[COL.SR_NUM] ?? '0', 10);
      return sr >= start && sr <= end;
    })
    .map((r) => toGarment(r, includePrivate));
}
