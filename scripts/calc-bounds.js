import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./src/data/japanPrefectures.json', 'utf-8'));

const regionBounds = {};

data.features.forEach(f => {
  const p = f.properties;
  const reg = p.regionName;
  if (!regionBounds[reg]) {
    regionBounds[reg] = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, prefs: [] };
  }

  // Parse path points
  const matches = f.properties.path.match(/[ML]([0-9.]+),([0-9.]+)/g) || [];
  matches.forEach(m => {
    const [, xStr, yStr] = m.match(/[ML]([0-9.]+),([0-9.]+)/);
    const x = parseFloat(xStr);
    const y = parseFloat(yStr);
    if (x < regionBounds[reg].minX) regionBounds[reg].minX = x;
    if (x > regionBounds[reg].maxX) regionBounds[reg].maxX = x;
    if (y < regionBounds[reg].minY) regionBounds[reg].minY = y;
    if (y > regionBounds[reg].maxY) regionBounds[reg].maxY = y;
  });

  regionBounds[reg].prefs.push({ name: p.name, center: p.svgCenter });
});

console.log('=== REGION BOUNDING BOXES & CENTERS ===');
let overallMinX = Infinity, overallMaxX = -Infinity, overallMinY = Infinity, overallMaxY = -Infinity;

Object.entries(regionBounds).forEach(([reg, b]) => {
  const width = Math.round(b.maxX - b.minX);
  const height = Math.round(b.maxY - b.minY);
  const cx = Math.round((b.minX + b.maxX) / 2);
  const cy = Math.round((b.minY + b.maxY) / 2);

  if (b.minX < overallMinX) overallMinX = b.minX;
  if (b.maxX > overallMaxX) overallMaxX = b.maxX;
  if (b.minY < overallMinY) overallMinY = b.minY;
  if (b.maxY > overallMaxY) overallMaxY = b.maxY;

  // 뷰박스 (패딩 포함)
  const pad = 30;
  const vbX = Math.round(b.minX - pad);
  const vbY = Math.round(b.minY - pad);
  const vbW = Math.round(width + pad * 2);
  const vbH = Math.round(height + pad * 2);

  console.log(`"${reg}": { center: [${cx}, ${cy}], viewBox: "${vbX} ${vbY} ${vbW} ${vbH}" }`);
});

console.log(`OVERALL VIEWBOX: "${Math.round(overallMinX - 20)} ${Math.round(overallMinY - 20)} ${Math.round(overallMaxX - overallMinX + 40)} ${Math.round(overallMaxY - overallMinY + 40)}"`);
