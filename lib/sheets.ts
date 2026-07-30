import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

// ============================================================
// COLUMN INDEX MAPPING  (0-indexed, matches new CSV header)
// 0:Sr# | 1:Article Code | 2:Style | 3:Style Color/Shade |
// 4:Fabric Code | 5:B1 Fabric Code | 6:Composition |
// 7:Shrinkage Warp | 8:Shrinkage Weft | 9:Weight AW |
// 10:Weave/Fabrication | 11:Stretch & Recovery |
// 12:Fabric Cuttable Width | 13:Colors in Family |
// 14:No Of Washes Made | 15:Fabric Price | 16:Gender | 17:Fit |
// 18:Customer (omit) | 19:Garment Supplier (omit) |
// 20:Fabric Supplier | 21:Idea Garment Price |
// 22:Garment Fabric Consumption (omit) | 23:Fabric MOQ |
// 24:Target Season | 25:Physical Sample Location |
// 26:Notes | 27:Event (if any)
// ============================================================
const COL = {
  SR_NUM:             0,
  ARTICLE_CODE:       1,  // articleCode
  STYLE:              2,
  COLOR_SHADE:        3,
  FABRIC_CODE:        4,   // ⚠️ PRIVATE
  B1_FABRIC_CODE:     5,
  COMPOSITION:        6,
  SHRINKAGE_WARP:     7,   // ⚠️ PRIVATE
  SHRINKAGE_WEFT:     8,   // ⚠️ PRIVATE
  WEIGHT_AW:          9,
  WEAVE:              10,
  STRETCH_RECOVERY:   11,  // ⚠️ PRIVATE
  FABRIC_WIDTH:       12,  // ⚠️ PRIVATE
  COLORS_IN_FAMILY:   13,
  NUM_WASHES:         14,
  FABRIC_PRICE:       15,  // ⚠️ PRIVATE
  GENDER:             16,
  FIT:                17,
  CUSTOMER:           18,  // ⚠️ PRIVATE
  GARMENT_SUPPLIER:   19,  // ⚠️ PRIVATE
  FABRIC_SUPPLIER:    20,  // ⚠️ PRIVATE
  IDEA_GARMENT_PRICE: 21,  // ⚠️ PRIVATE
  GARMENT_FABRIC_CONSUMPTION: 22,  // ⚠️ PRIVATE
  FABRIC_MOQ:         23,  // ⚠️ PRIVATE
  TARGET_SEASON:      24,  // ⚠️ PRIVATE
  SAMPLE_LOCATION:    25,  // ⚠️ PRIVATE
  NOTES:              26,  // ⚠️ PRIVATE
  EVENT:              27,  // ⚠️ PRIVATE
} as const;

// ============================================================
// TYPES
// ============================================================
export interface GarmentPublic {
  srNum:          string;
  articleCode:    string;  // Article Code (col 1)
  style:          string;
  colorShade:     string;
  b1FabricCode:   string;
  composition:    string;
  weave:          string;
  weightAw:       string;
  colorsInFamily: string;
  numWashes:      string;
  gender:         string;
  fit:            string;
}

export interface GarmentFull extends GarmentPublic {
  fabricCode:        string;  // ⚠️ PRIVATE
  shrinkageWarp:     string;  // ⚠️ PRIVATE
  shrinkageWeft:     string;  // ⚠️ PRIVATE
  stretchRecovery:   string;  // ⚠️ PRIVATE
  fabricWidth:       string;  // ⚠️ PRIVATE
  fabricPrice:       string;  // ⚠️ PRIVATE
  customer:          string;  // ⚠️ PRIVATE
  garmentSupplier:   string;  // ⚠️ PRIVATE
  fabricSupplier:    string;  // ⚠️ PRIVATE
  ideaGarmentPrice:  string;  // ⚠️ PRIVATE
  garmentFabricConsumption: string; // ⚠️ PRIVATE
  targetSeason:      string;  // ⚠️ PRIVATE
  fabricMoq:         string;  // ⚠️ PRIVATE
  sampleLocation:    string;  // ⚠️ PRIVATE
  event:             string;  // ⚠️ PRIVATE
  notes:             string;  // ⚠️ PRIVATE
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
// FETCH ALL ROWS  (Cached for 60s using Next.js unstable_cache
//   so only 1 Sheets API call is made per minute, regardless
//   of how many concurrent users are searching)
// ============================================================
async function fetchAllRowsRaw(): Promise<string[][]> {
  const sheets  = await getSheets();
  const sheetId = process.env.SPREADSHEET_ID;
  const range   = process.env.SHEET_RANGE ?? 'Database!A2:AB'; // cols A–AB covers all 28 cols

  const res = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  return (res.data.values ?? []) as string[][];
}

// unstable_cache is the ONLY way to cache non-fetch async functions in Next.js.
// The googleapis client does not use native fetch, so { next: { revalidate } }
// on the googleapis call is silently ignored — this is the real cache.
const fetchAllRows = unstable_cache(
  async () => fetchAllRowsRaw(),
  ['google-sheets-database'],
  { revalidate: 60 }
);

// ============================================================
// ROW → OBJECT
// ============================================================
function toGarment(row: string[], includePrivate: boolean): Garment {
  const pub: GarmentPublic = {
    srNum:          String(row[COL.SR_NUM]          ?? ''),
    articleCode:    String(row[COL.ARTICLE_CODE]    ?? ''),
    style:          String(row[COL.STYLE]           ?? ''),
    colorShade:     String(row[COL.COLOR_SHADE]     ?? ''),
    b1FabricCode:   String(row[COL.B1_FABRIC_CODE]  ?? ''),
    composition:    String(row[COL.COMPOSITION]     ?? ''),
    weave:          String(row[COL.WEAVE]           ?? ''),
    weightAw:       String(row[COL.WEIGHT_AW]       ?? ''),
    colorsInFamily: String(row[COL.COLORS_IN_FAMILY]?? ''),
    numWashes:      String(row[COL.NUM_WASHES]      ?? ''),
    gender:         String(row[COL.GENDER]          ?? ''),
    fit:            String(row[COL.FIT]             ?? ''),
  };

  if (!includePrivate) return pub;

  return {
    ...pub,
    fabricCode:       String(row[COL.FABRIC_CODE]        ?? ''),
    shrinkageWarp:    String(row[COL.SHRINKAGE_WARP]     ?? ''),
    shrinkageWeft:    String(row[COL.SHRINKAGE_WEFT]     ?? ''),
    stretchRecovery:  String(row[COL.STRETCH_RECOVERY]   ?? ''),
    fabricWidth:      String(row[COL.FABRIC_WIDTH]       ?? ''),
    fabricPrice:      String(row[COL.FABRIC_PRICE]       ?? ''),
    customer:         String(row[COL.CUSTOMER]           ?? ''),
    garmentSupplier:  String(row[COL.GARMENT_SUPPLIER]   ?? ''),
    fabricSupplier:   String(row[COL.FABRIC_SUPPLIER]    ?? ''),
    ideaGarmentPrice: String(row[COL.IDEA_GARMENT_PRICE] ?? ''),
    garmentFabricConsumption: String(row[COL.GARMENT_FABRIC_CONSUMPTION] ?? ''),
    targetSeason:     String(row[COL.TARGET_SEASON]      ?? ''),
    fabricMoq:        String(row[COL.FABRIC_MOQ]         ?? ''),
    sampleLocation:   String(row[COL.SAMPLE_LOCATION]    ?? ''),
    event:            String(row[COL.EVENT]               ?? ''),
    notes:            String(row[COL.NOTES]               ?? ''),
  } satisfies GarmentFull;
}

// ============================================================
// PUBLIC API FUNCTIONS  (called from API routes — server only)
// ============================================================

/** Find one garment by its Article Code / Form No (e.g. "ART-0008") */
export async function getStyleByRef(
  articleCode: string,
  includePrivate: boolean
): Promise<Garment | null> {
  const rows = await fetchAllRows();
  const row  = rows.find(
    (r) => (r[COL.ARTICLE_CODE] ?? '').trim().toLowerCase() === articleCode.trim().toLowerCase()
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
      r[COL.ARTICLE_CODE] && (
        (r[COL.ARTICLE_CODE]    ?? '').toLowerCase().includes(q) ||
        (r[COL.STYLE]           ?? '').toLowerCase().includes(q) ||
        (r[COL.COLOR_SHADE]     ?? '').toLowerCase().includes(q) ||
        (r[COL.COMPOSITION]     ?? '').toLowerCase().includes(q) ||
        (r[COL.GENDER]          ?? '').toLowerCase().includes(q) ||
        (r[COL.FIT]             ?? '').toLowerCase().includes(q)
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
