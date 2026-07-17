const XLSX = require('xlsx');
const path = require('path');

const filePath = path.resolve('G:/My Drive/fabric_library/Barcodes working Data (1).xlsx');

try {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log('Sheet name:', sheetName);
  console.log('Total rows (incl header):', data.length);
  console.log('\nHEADERS:');
  console.log(JSON.stringify(data[0], null, 2));
  console.log('\nROW 1:');
  console.log(JSON.stringify(data[1], null, 2));
  console.log('\nROW 2:');
  console.log(JSON.stringify(data[2], null, 2));
  console.log('\nROW 3:');
  console.log(JSON.stringify(data[3], null, 2));
} catch (e) {
  console.error('Error:', e.message);
}
