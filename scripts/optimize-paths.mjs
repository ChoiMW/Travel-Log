import fs from 'fs';
import path from 'path';

const inputFile = path.resolve('./public/data/korea-districts.json');
const rawData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

const SVG_WIDTH = 800;
const SVG_HEIGHT = 1000;
const MIN_LON = 124.5;
const MAX_LON = 131.2;
const MIN_LAT = 33.0;
const MAX_LAT = 38.9;

function project(lon, lat) {
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

// 꺾은선 단순화 (Douglas-Peucker 알고리즘 적용으로 path 용량 80% 절감)
function simplifyPoints(points, tolerance = 0.4) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const pt = points[i];
    // 점과 직선 사이의 거리
    const d = getSqSegDist(pt, first, last);
    if (d > maxDist) {
      index = i;
      maxDist = d;
    }
  }

  if (maxDist > tolerance * tolerance) {
    const left = simplifyPoints(points.slice(0, index + 1), tolerance);
    const right = simplifyPoints(points.slice(index), tolerance);
    return left.slice(0, left.length - 1).concat(right);
  }
  return [first, last];
}

function getSqSegDist(p, p1, p2) {
  let x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function coordsToSvgPath(coords, type) {
  if (type === 'Polygon') {
    return coords.map(ring => {
      const proj = ring.map(pt => project(pt[0], pt[1]));
      const simp = simplifyPoints(proj, 0.4);
      return simp.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0]},${pt[1]}`).join('') + 'Z';
    }).join(' ');
  } else if (type === 'MultiPolygon') {
    return coords.map(poly => {
      return poly.map(ring => {
        const proj = ring.map(pt => project(pt[0], pt[1]));
        const simp = simplifyPoints(proj, 0.4);
        return simp.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0]},${pt[1]}`).join('') + 'Z';
      }).join(' ');
    }).join(' ');
  }
  return '';
}

function getCentroid(coords, type) {
  let pts = [];
  if (type === 'Polygon') pts = coords[0];
  else if (type === 'MultiPolygon') {
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
  if (!pts || pts.length === 0) return { lon: 0, lat: 0, svgX: 0, svgY: 0 };
  let sumLon = 0, sumLat = 0;
  pts.forEach(p => { sumLon += p[0]; sumLat += p[1]; });
  const centerLon = Number((sumLon / pts.length).toFixed(4));
  const centerLat = Number((sumLat / pts.length).toFixed(4));
  const [svgX, svgY] = project(centerLon, centerLat);
  return { lon: centerLon, lat: centerLat, svgX, svgY };
}

// 1. 번들용 초경량 메타데이터 (districtsMeta.json)
const featuresMeta = rawData.features.map(f => {
  const pathD = coordsToSvgPath(f.geometry.coordinates, f.geometry.type);
  const center = getCentroid(f.geometry.coordinates, f.geometry.type);

  return {
    type: 'Feature',
    id: String(f.properties.code),
    properties: {
      code: String(f.properties.code),
      name: f.properties.name,
      sdoCode: f.properties.sdoCode,
      sdoName: f.properties.sdoName,
      fullName: f.properties.fullName,
      center,
      path: pathD,
    }
  };
});

const outMetaFile = path.resolve('./src/data/koreaDistricts.json');
fs.writeFileSync(outMetaFile, JSON.stringify({ type: 'FeatureCollection', features: featuresMeta }), 'utf8');
console.log(`Generated ultra-compact districts JSON at ${outMetaFile} (${(fs.statSync(outMetaFile).size / 1024).toFixed(1)} KB)`);

// 2. Point-in-polygon 지오코딩용 GeoJSON
const lightGeoFeatures = rawData.features.map(f => {
  const simplifyCoords = (arr) => {
    if (typeof arr[0] === 'number') {
      return [Number(arr[0].toFixed(4)), Number(arr[1].toFixed(4))];
    }
    return arr.map(simplifyCoords);
  };

  return {
    type: 'Feature',
    id: String(f.properties.code),
    properties: {
      code: String(f.properties.code),
      name: f.properties.name,
      sdoCode: f.properties.sdoCode,
      sdoName: f.properties.sdoName,
      fullName: f.properties.fullName,
    },
    geometry: {
      type: f.geometry.type,
      coordinates: simplifyCoords(f.geometry.coordinates)
    }
  };
});

fs.writeFileSync(path.resolve('./public/data/korea-districts-geo.json'), JSON.stringify({ type: 'FeatureCollection', features: lightGeoFeatures }), 'utf8');
console.log(`Saved public geocoding GeoJSON (${(fs.statSync(path.resolve('./public/data/korea-districts-geo.json')).size / 1024 / 1024).toFixed(2)} MB)`);
