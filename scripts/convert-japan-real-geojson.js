import fs from 'fs';
import https from 'https';

const PREFECTURE_META = {
  1: { code: 'JP-01', name: '홋카이도', fullName: '홋카이도 (北海道)', nameJa: '北海道', nameRomaji: 'Hokkaido', regionName: '홋카이도 지방' },
  2: { code: 'JP-02', name: '아오모리현', fullName: '아오모리현 (青森県)', nameJa: '青森県', nameRomaji: 'Aomori', regionName: '도호쿠 지방' },
  3: { code: 'JP-03', name: '이와테현', fullName: '이와테현 (岩手県)', nameJa: '岩手県', nameRomaji: 'Iwate', regionName: '도호쿠 지방' },
  4: { code: 'JP-04', name: '미야기현', fullName: '미야기현 (宮城県)', nameJa: '宮城県', nameRomaji: 'Miyagi', regionName: '도호쿠 지방' },
  5: { code: 'JP-05', name: '아키타현', fullName: '아키타현 (秋田県)', nameJa: '秋田県', nameRomaji: 'Akita', regionName: '도호쿠 지방' },
  6: { code: 'JP-06', name: '야마가타현', fullName: '야마가타현 (山形県)', nameJa: '山形県', nameRomaji: 'Yamagata', regionName: '도호쿠 지방' },
  7: { code: 'JP-07', name: '후쿠시마현', fullName: '후쿠시마현 (福島県)', nameJa: '福島県', nameRomaji: 'Fukushima', regionName: '도호쿠 지방' },
  8: { code: 'JP-08', name: '이바라키현', fullName: '이바라키현 (茨城県)', nameJa: '茨城県', nameRomaji: 'Ibaraki', regionName: '간토 지방' },
  9: { code: 'JP-09', name: '도치기현', fullName: '도치기현 (栃木県)', nameJa: '栃木県', nameRomaji: 'Tochigi', regionName: '간토 지방' },
  10: { code: 'JP-10', name: '군마현', fullName: '군마현 (群馬県)', nameJa: '群馬県', nameRomaji: 'Gunma', regionName: '간토 지방' },
  11: { code: 'JP-11', name: '사이타마현', fullName: '사이타마현 (埼玉県)', nameJa: '埼玉県', nameRomaji: 'Saitama', regionName: '간토 지방' },
  12: { code: 'JP-12', name: '지바현', fullName: '지바현 (千葉県)', nameJa: '千葉県', nameRomaji: 'Chiba', regionName: '간토 지방' },
  13: { code: 'JP-13', name: '도쿄도', fullName: '도쿄도 (東京都)', nameJa: '東京都', nameRomaji: 'Tokyo', regionName: '간토 지방' },
  14: { code: 'JP-14', name: '가나가와현', fullName: '가나가와현 (神奈川県)', nameJa: '神奈川県', nameRomaji: 'Kanagawa', regionName: '간토 지방' },
  15: { code: 'JP-15', name: '니가타현', fullName: '니가타현 (新潟県)', nameJa: '新潟県', nameRomaji: 'Niigata', regionName: '주부 지방' },
  16: { code: 'JP-16', name: '도야마현', fullName: '도야마현 (富山県)', nameJa: '富山県', nameRomaji: 'Toyama', regionName: '주부 지방' },
  17: { code: 'JP-17', name: '이시카와현', fullName: '이시카와현 (石川県)', nameJa: '石川県', nameRomaji: 'Ishikawa', regionName: '주부 지방' },
  18: { code: 'JP-18', name: '후쿠이현', fullName: '후쿠이현 (福井県)', nameJa: '福井県', nameRomaji: 'Fukui', regionName: '주부 지방' },
  19: { code: 'JP-19', name: '야마나시현', fullName: '야마나시현 (山梨県)', nameJa: '山梨県', nameRomaji: 'Yamanashi', regionName: '주부 지방' },
  20: { code: 'JP-20', name: '나가노현', fullName: '나가노현 (長野県)', nameJa: '長野県', nameRomaji: 'Nagano', regionName: '주부 지방' },
  21: { code: 'JP-21', name: '기후현', fullName: '기후현 (岐阜県)', nameJa: '岐阜県', nameRomaji: 'Gifu', regionName: '주부 지방' },
  22: { code: 'JP-22', name: '시즈오카현', fullName: '시즈오카현 (静岡県)', nameJa: '静岡県', nameRomaji: 'Shizuoka', regionName: '주부 지방' },
  23: { code: 'JP-23', name: '아이치현', fullName: '아이치현 (愛知県)', nameJa: '愛知県', nameRomaji: 'Aichi', regionName: '주부 지방' },
  24: { code: 'JP-24', name: '미에현', fullName: '미에현 (三重県)', nameJa: '三重県', nameRomaji: 'Mie', regionName: '간사이 지방' },
  25: { code: 'JP-25', name: '시가현', fullName: '시가현 (滋賀県)', nameJa: '滋賀県', nameRomaji: 'Shiga', regionName: '간사이 지방' },
  26: { code: 'JP-26', name: '교토부', fullName: '교토부 (京都府)', nameJa: '京都府', nameRomaji: 'Kyoto', regionName: '간사이 지방' },
  27: { code: 'JP-27', name: '오사카부', fullName: '오사카부 (大阪府)', nameJa: '大阪府', nameRomaji: 'Osaka', regionName: '간사이 지방' },
  28: { code: 'JP-28', name: '효고현', fullName: '효고현 (兵庫県)', nameJa: '兵庫県', nameRomaji: 'Hyogo', regionName: '간사이 지방' },
  29: { code: 'JP-29', name: '나라현', fullName: '나라현 (奈良県)', nameJa: '奈良県', nameRomaji: 'Nara', regionName: '간사이 지방' },
  30: { code: 'JP-30', name: '와카야마현', fullName: '와카야마현 (和歌山県)', nameJa: '和歌山県', nameRomaji: 'Wakayama', regionName: '간사이 지방' },
  31: { code: 'JP-31', name: '돗토리현', fullName: '돗토리현 (鳥取県)', nameJa: '鳥取県', nameRomaji: 'Tottori', regionName: '주고쿠 지방' },
  32: { code: 'JP-32', name: '시마네현', fullName: '시마네현 (島根県)', nameJa: '島根県', nameRomaji: 'Shimane', regionName: '주고쿠 지방' },
  33: { code: 'JP-33', name: '오카야마현', fullName: '오카야마현 (岡山県)', nameJa: '岡山県', nameRomaji: 'Okayama', regionName: '주고쿠 지방' },
  34: { code: 'JP-34', name: '히로시마현', fullName: '히로시마현 (広島県)', nameJa: '広島県', nameRomaji: 'Hiroshima', regionName: '주고쿠 지방' },
  35: { code: 'JP-35', name: '야마구치현', fullName: '야마구치현 (山口県)', nameJa: '山口県', nameRomaji: 'Yamaguchi', regionName: '주고쿠 지방' },
  36: { code: 'JP-36', name: '도쿠시마현', fullName: '도쿠시마현 (徳島県)', nameJa: '徳島県', nameRomaji: 'Tokushima', regionName: '시코쿠 지방' },
  37: { code: 'JP-37', name: '가가와현', fullName: '가가와현 (香川県)', nameJa: '香川県', nameRomaji: 'Kagawa', regionName: '시코쿠 지방' },
  38: { code: 'JP-38', name: '에히메현', fullName: '에히메현 (愛媛県)', nameJa: '愛媛県', nameRomaji: 'Ehime', regionName: '시코쿠 지방' },
  39: { code: 'JP-39', name: '고치현', fullName: '고치현 (高知県)', nameJa: '高知県', nameRomaji: 'Kochi', regionName: '시코쿠 지방' },
  40: { code: 'JP-40', name: '후쿠오카현', fullName: '후쿠오카현 (福岡県)', nameJa: '福岡県', nameRomaji: 'Fukuoka', regionName: '규슈 지방' },
  41: { code: 'JP-41', name: '사가현', fullName: '사가현 (佐賀県)', nameJa: '佐賀県', nameRomaji: 'Saga', regionName: '규슈 지방' },
  42: { code: 'JP-42', name: '나가사키현', fullName: '나가사키현 (長崎県)', nameJa: '長崎県', nameRomaji: 'Nagasaki', regionName: '규슈 지방' },
  43: { code: 'JP-43', name: '구마모토현', fullName: '구마모토현 (熊本県)', nameJa: '熊本県', nameRomaji: 'Kumamoto', regionName: '규슈 지방' },
  44: { code: 'JP-44', name: '오이타현', fullName: '오이타현 (大分県)', nameJa: '大分県', nameRomaji: 'Oita', regionName: '규슈 지방' },
  45: { code: 'JP-45', name: '미야자키현', fullName: '미야자키현 (宮崎県)', nameJa: '宮崎県', nameRomaji: 'Miyazaki', regionName: '규슈 지방' },
  46: { code: 'JP-46', name: '가고시마현', fullName: '가고시마현 (鹿児島県)', nameJa: '鹿児島県', nameRomaji: 'Kagoshima', regionName: '규슈 지방' },
  47: { code: 'JP-47', name: '오키나와현', fullName: '오키나와현 (沖縄県)', nameJa: '沖縄県', nameRomaji: 'Okinawa', regionName: '규슈 지방' },
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function projectCoord(lng, lat, isOkinawa = false) {
  if (isOkinawa) {
    // 오키나와: 좌측 하단 인셋 영역 (X: 40~140, Y: 720~840)
    const baseLng = 127.8;
    const baseLat = 26.3;
    const targetSvgX = 90;
    const targetSvgY = 780;
    const scale = 25;
    const x = targetSvgX + (lng - baseLng) * scale;
    const y = targetSvgY - (lat - baseLat) * scale * 1.25;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  }

  // 본토 (혼슈, 홋카이도, 시코쿠, 규슈)
  const minLng = 128.2;
  const maxLng = 146.0;
  const minLat = 30.5;
  const maxLat = 45.8;

  const width = 880;
  const height = 780;
  const offsetX = 70;
  const offsetY = 30;

  const x = offsetX + ((lng - minLng) / (maxLng - minLng)) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const minMerc = Math.log(Math.tan(Math.PI / 4 + (minLat * Math.PI) / 360));
  const maxMerc = Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI) / 360));
  
  const y = offsetY + height - ((mercN - minMerc) / (maxMerc - minMerc)) * height;

  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function geometryToSvgPath(geometry, isOkinawa) {
  const type = geometry.type;
  const coords = geometry.coordinates;
  const paths = [];

  const processPolygon = (polygonCoords) => {
    for (const ring of polygonCoords) {
      if (!ring || ring.length < 3) continue;
      let d = '';
      for (let i = 0; i < ring.length; i++) {
        const pt = ring[i];
        const [sx, sy] = projectCoord(pt[0], pt[1], isOkinawa);
        d += (i === 0 ? `M${sx},${sy}` : `L${sx},${sy}`);
      }
      d += 'Z';
      paths.push(d);
    }
  };

  if (type === 'Polygon') {
    processPolygon(coords);
  } else if (type === 'MultiPolygon') {
    for (const polygon of coords) {
      processPolygon(polygon);
    }
  }

  return paths.join(' ');
}

async function main() {
  console.log('Downloading official Japan GeoJSON from dataofjapan...');
  const geojsonUrl = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson';
  const rawData = await fetchJson(geojsonUrl);

  console.log(`Downloaded ${rawData.features.length} prefectures.`);

  const convertedFeatures = [];

  for (let i = 0; i < rawData.features.length; i++) {
    const feat = rawData.features[i];
    const prefId = feat.properties.id || feat.id || (i + 1);
    const meta = PREFECTURE_META[prefId] || {
      code: `JP-${String(prefId).padStart(2, '0')}`,
      name: feat.properties.nam_ja || feat.properties.name || `현 ${prefId}`,
      fullName: feat.properties.nam_ja || feat.properties.name,
      nameJa: feat.properties.nam_ja || '',
      nameRomaji: feat.properties.nam || '',
      regionName: '기타'
    };

    const isOkinawa = prefId === 47;
    const svgPath = geometryToSvgPath(feat.geometry, isOkinawa);

    // 중심 좌표 계산
    let sumX = 0, sumY = 0, count = 0;
    let sumLng = 0, sumLat = 0;

    const extractPoints = (arr) => {
      if (typeof arr[0] === 'number') {
        sumLng += arr[0];
        sumLat += arr[1];
        const [sx, sy] = projectCoord(arr[0], arr[1], isOkinawa);
        sumX += sx;
        sumY += sy;
        count++;
      } else {
        arr.forEach(extractPoints);
      }
    };
    extractPoints(feat.geometry.coordinates);

    const avgLng = Math.round((sumLng / count) * 1000) / 1000;
    const avgLat = Math.round((sumLat / count) * 1000) / 1000;
    let svgCenterX = Math.round((sumX / count) * 10) / 10;
    let svgCenterY = Math.round((sumY / count) * 10) / 10;

    // 본토 표시 최적화를 위한 중심 좌표 미세 보정
    if (prefId === 9) { // 도치기현
      svgCenterX = 643.0;
      svgCenterY = 490.0;
    } else if (prefId === 12) { // 지바현
      svgCenterX = 668.0;
      svgCenterY = 580.0;
    } else if (prefId === 13) { // 도쿄도 본토
      svgCenterX = 632.5;
      svgCenterY = 556.0;
    } else if (prefId === 14) { // 가나가와현
      svgCenterX = 605.0;
      svgCenterY = 580.0;
    } else if (prefId === 40) { // 후쿠오카현
      svgCenterX = 205.0;
      svgCenterY = 645.0;
    } else if (prefId === 41) { // 사가현
      svgCenterX = 168.0;
      svgCenterY = 665.0;
    } else if (prefId === 42) { // 나가사키현
      svgCenterX = 132.0;
      svgCenterY = 688.0;
    } else if (prefId === 43) { // 구마모토현
      svgCenterX = 185.0;
      svgCenterY = 705.0;
    } else if (prefId === 44) { // 오이타현
      svgCenterX = 245.0;
      svgCenterY = 665.0;
    } else if (prefId === 45) { // 미야자키현
      svgCenterX = 228.0;
      svgCenterY = 745.0;
    } else if (prefId === 46) { // 가고시마현 본토
      svgCenterX = 175.0;
      svgCenterY = 765.0;
    } else if (prefId === 47) { // 오키나와현
      svgCenterX = 90.0;
      svgCenterY = 790.0;
    }

    convertedFeatures.push({
      type: 'Feature',
      id: meta.code,
      properties: {
        code: meta.code,
        name: meta.name,
        fullName: meta.fullName,
        nameJa: meta.nameJa,
        nameRomaji: meta.nameRomaji,
        regionName: meta.regionName,
        centerLat: avgLat,
        centerLng: avgLng,
        svgCenter: [svgCenterX, svgCenterY],
        path: svgPath
      },
      geometry: {
        type: feat.geometry.type,
        path: svgPath
      }
    });
  }

  // 코드 순(JP-01 ~ JP-47)으로 정렬
  convertedFeatures.sort((a, b) => a.properties.code.localeCompare(b.properties.code));

  const resultCollection = {
    type: 'FeatureCollection',
    name: 'japan_prefectures_official_precision',
    features: convertedFeatures
  };

  fs.writeFileSync('./src/data/japanPrefectures.json', JSON.stringify(resultCollection, null, 2), 'utf-8');
  console.log('✅ Successfully generated src/data/japanPrefectures.json with full precision SVG paths!');
}

main();
