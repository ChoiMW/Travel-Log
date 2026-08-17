import fs from 'fs';
import path from 'path';
import https from 'https';

const url = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json';
const outDir = path.resolve('./public/data');
const outFile = path.join(outDir, 'korea-districts.json');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Downloading South Korea municipalities GeoJSON...');
https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: status ${res.statusCode}`);
    process.exit(1);
  }
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const geo = JSON.parse(data);
      console.log(`Downloaded successfully! Feature count: ${geo.features?.length}`);
      
      // 행정구역 코드 및 이름 가공 및 표준화
      // code: 2자리(시도) + 3자리(시군구)
      const sdocodeMap = {
        '11': '서울특별시',
        '21': '부산광역시',
        '22': '대구광역시',
        '23': '인천광역시',
        '24': '광주광역시',
        '25': '대전광역시',
        '26': '울산광역시',
        '29': '세종특별자치시',
        '31': '경기도',
        '32': '강원특별자치도',
        '33': '충청북도',
        '34': '충청남도',
        '35': '전라북도',
        '36': '전라남도',
        '37': '경상북도',
        '38': '경상남도',
        '39': '제주특별자치도',
      };

      geo.features.forEach(f => {
        const code = String(f.properties.code);
        const sdoCode = code.substring(0, 2);
        const sdoName = sdocodeMap[sdoCode] || f.properties.sidoname || '';
        f.properties.sdoCode = sdoCode;
        f.properties.sdoName = sdoName;
        f.properties.name = f.properties.name || f.properties.SIG_KOR_NM || '';
        f.properties.fullName = `${sdoName} ${f.properties.name}`.trim();
      });

      fs.writeFileSync(outFile, JSON.stringify(geo), 'utf8');
      console.log(`Saved enriched GeoJSON to ${outFile} (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (e) {
      console.error('Error parsing/processing GeoJSON:', e);
    }
  });
}).on('error', (e) => {
  console.error('Network error downloading GeoJSON:', e);
});
