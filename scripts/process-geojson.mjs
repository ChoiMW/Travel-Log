import fs from 'fs';
import path from 'path';

const inputFile = path.resolve('./public/data/korea-districts.json');
const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

// 한국 영역 Bounding Box
// Longitude: ~124.5 ~ 131.0, Latitude: ~33.0 ~ 38.8
// SVG Canvas 크기: 800 x 1000
const SVG_WIDTH = 800;
const SVG_HEIGHT = 1000;
const MIN_LON = 124.5;
const MAX_LON = 131.2;
const MIN_LAT = 33.0;
const MAX_LAT = 38.9;

function project(lon, lat) {
  // Web Mercator / Equirectangular with aspect ratio correction
  const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * SVG_WIDTH;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const minLatRad = (MIN_LAT * Math.PI) / 180;
  const minMercN = Math.log(Math.tan(Math.PI / 4 + minLatRad / 2));
  const maxLatRad = (MAX_LAT * Math.PI) / 180;
  const maxMercN = Math.log(Math.tan(Math.PI / 4 + maxLatRad / 2));
  
  const y = SVG_HEIGHT - ((mercN - minMercN) / (maxMercN - minMercN)) * SVG_HEIGHT;
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

function coordsToSvgPath(coords, type) {
  if (type === 'Polygon') {
    return coords.map(ring => {
      return ring.map((pt, i) => {
        const [x, y] = project(pt[0], pt[1]);
        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
      }).join('') + 'Z';
    }).join(' ');
  } else if (type === 'MultiPolygon') {
    return coords.map(poly => {
      return poly.map(ring => {
        return ring.map((pt, i) => {
          const [x, y] = project(pt[0], pt[1]);
          return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        }).join('') + 'Z';
      }).join(' ');
    }).join(' ');
  }
  return '';
}

// 중심점(Centroid) 계산
function getCentroid(coords, type) {
  let pts = [];
  if (type === 'Polygon') {
    pts = coords[0];
  } else if (type === 'MultiPolygon') {
    // 가장 큰 폴리곤 찾기
    let maxLen = 0;
    let mainRing = coords[0][0];
    coords.forEach(poly => {
      if (poly[0].length > maxLen) {
        maxLen = poly[0].length;
        mainRing = poly[0];
      }
    });
    pts = mainRing;
  }
  if (!pts || pts.length === 0) return [0, 0];
  let sumLon = 0, sumLat = 0;
  pts.forEach(p => { sumLon += p[0]; sumLat += p[1]; });
  const centerLon = sumLon / pts.length;
  const centerLat = sumLat / pts.length;
  const [svgX, svgY] = project(centerLon, centerLat);
  return { lon: centerLon, lat: centerLat, svgX, svgY };
}

// 1. 단순화된 경량 GeoJSON (좌표 소수점 4자리 = 약 10m 오차)
const lightGeoFeatures = rawData.features.map(f => {
  const simplifyCoords = (arr) => {
    if (typeof arr[0] === 'number') {
      return [Number(arr[0].toFixed(4)), Number(arr[1].toFixed(4))];
    }
    return arr.map(simplifyCoords);
  };

  const simplifiedGeometry = {
    type: f.geometry.type,
    coordinates: simplifyCoords(f.geometry.coordinates)
  };

  const pathD = coordsToSvgPath(f.geometry.coordinates, f.geometry.type);
  const center = getCentroid(f.geometry.coordinates, f.geometry.type);

  return {
    type: 'Feature',
    id: f.properties.code,
    properties: {
      code: String(f.properties.code),
      name: f.properties.name,
      sdoCode: f.properties.sdoCode,
      sdoName: f.properties.sdoName,
      fullName: f.properties.fullName,
      center,
      path: pathD
    },
    geometry: simplifiedGeometry
  };
});

const lightGeoJSON = {
  type: 'FeatureCollection',
  features: lightGeoFeatures
};

const outLightFile = path.resolve('./src/data/koreaDistricts.json');
const srcDir = path.dirname(outLightFile);
if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

fs.writeFileSync(outLightFile, JSON.stringify(lightGeoJSON), 'utf8');
console.log(`Generated simplified districts JSON at ${outLightFile} (${(fs.statSync(outLightFile).size / 1024 / 1024).toFixed(2)} MB)`);

// public 폴더에도 복사 (동적 fetch 지원)
fs.writeFileSync(path.resolve('./public/data/korea-districts-light.json'), JSON.stringify(lightGeoJSON), 'utf8');
