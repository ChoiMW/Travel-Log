import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./src/data/japanPrefectures.json', 'utf-8'));

data.features.forEach(f => {
  const p = f.properties;
  console.log(`${p.code} ${p.name} (${p.regionName}): svgCenter=[${p.svgCenter[0]}, ${p.svgCenter[1]}]`);
});
