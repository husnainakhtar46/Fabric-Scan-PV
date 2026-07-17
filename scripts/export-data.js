const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.resolve('G:/My Drive/fabric_library/Barcodes working Data (1).xlsx');
const outPath = path.resolve('./data/garments.json');

const wb = XLSX.readFile(filePath);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const headers = rows[0];
const data = rows.slice(1).filter(r => r[1]); // filter rows that have a Style Ref

const garments = data.map(row => ({
  srNum: String(row[0] || ''),
  styleRef: String(row[1] || ''),
  style: String(row[2] || ''),
  colorShade: String(row[3] || ''),
  fabricCode: String(row[4] || ''),
  b1FabricCode: String(row[5] || ''),
  composition: String(row[6] || ''),
  shrinkageWarp: String(row[7] || ''),
  shrinkageWeft: String(row[8] || ''),
  weightAw: String(row[9] || ''),
  colorsInFamily: String(row[10] || ''),
  numWashes: String(row[11] || ''),
  formNo: String(row[12] || ''),
  size: String(row[13] || ''),
  fabricPrice: String(row[14] || ''),  // PRIVATE
  gender: String(row[15] || ''),
  notes: String(row[16] || ''),        // PRIVATE
  event: String(row[17] || ''),        // PRIVATE
}));

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
fs.writeFileSync(outPath, JSON.stringify(garments, null, 2));
console.log(`✅ Exported ${garments.length} garments to data/garments.json`);
console.log('Sample:', JSON.stringify(garments[0], null, 2));
