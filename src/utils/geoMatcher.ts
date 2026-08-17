import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { DistrictFeatureProperties, DistrictGeoJSONFeature } from '../types/travel';
import districtsData from '../data/koreaDistricts.json';

const features = (districtsData.features as unknown) as DistrictGeoJSONFeature[];

// 빠른 코드 검색을 위한 맵
const districtMapByCode = new Map<string, DistrictFeatureProperties>();
export const sdoList = [
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전라북도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
];

features.forEach(f => {
  districtMapByCode.set(f.properties.code, f.properties);
});

// 정밀 폴리곤 캐시
let detailedGeoFeatures: any[] | null = null;
let isFetchingGeo = false;

export async function preloadDetailedGeoJSON(): Promise<void> {
  if (detailedGeoFeatures || isFetchingGeo) return;
  isFetchingGeo = true;
  try {
    const res = await fetch('./data/korea-districts-geo.json');
    if (res.ok) {
      const data = await res.json();
      detailedGeoFeatures = data.features;
    }
  } catch (err) {
    console.warn('Preload detailed GeoJSON failed, falling back to centroid matching', err);
  } finally {
    isFetchingGeo = false;
  }
}

// 백그라운드에서 미리 로드
if (typeof window !== 'undefined') {
  setTimeout(() => preloadDetailedGeoJSON(), 1000);
}

/**
 * 모든 시군구 목록 반환
 */
export function getAllDistricts(): DistrictFeatureProperties[] {
  return features.map(f => f.properties);
}

/**
 * 코드로 시군구 정보 조회
 */
export function getDistrictByCode(code: string): DistrictFeatureProperties | undefined {
  return districtMapByCode.get(code);
}

/**
 * 시/도 이름으로 해당 하위 시/군/구 목록 조회
 */
export function getDistrictsBySdo(sdoName: string): DistrictFeatureProperties[] {
  return features
    .filter(f => f.properties.sdoName === sdoName)
    .map(f => f.properties);
}

/**
 * GPS 좌표(위도, 경도)를 바탕으로 해당하는 시군구를 자동 판별
 */
export function findDistrictByCoordinates(lat: number, lon: number): DistrictFeatureProperties | null {
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) return null;

  const pt = point([lon, lat]);

  // 1차: 상세 GeoJSON 폴리곤이 있으면 Point in Polygon 정밀 검사
  if (detailedGeoFeatures) {
    for (const feature of detailedGeoFeatures) {
      try {
        if (booleanPointInPolygon(pt, feature)) {
          return districtMapByCode.get(String(feature.properties.code)) || feature.properties;
        }
      } catch {
        // ignore
      }
    }
  }

  // 2차: 중심점(Centroid) 기준 가장 가까운 시군구 탐색 (거리 계산)
  let closestDist = Infinity;
  let closestDistrict: DistrictFeatureProperties | null = null;

  for (const feature of features) {
    const center = feature.properties.center;
    if (!center || !center.lon || !center.lat) continue;

    const dLon = (lon - center.lon) * Math.cos((lat * Math.PI) / 180);
    const dLat = lat - center.lat;
    const dist = Math.sqrt(dLon * dLon + dLat * dLat);

    if (dist < closestDist) {
      closestDist = dist;
      closestDistrict = feature.properties;
    }
  }

  // 약 0.3도 (~30km) 이내일 때 가장 가까운 곳 매칭
  if (closestDist < 0.3) {
    return closestDistrict;
  }

  return null;
}

/**
 * 시군구 이름 검색
 */
export function searchDistricts(query: string): DistrictFeatureProperties[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return features
    .filter(f => {
      const name = f.properties.name.toLowerCase();
      const fullName = f.properties.fullName.toLowerCase();
      const sdo = f.properties.sdoName.toLowerCase();
      return name.includes(q) || fullName.includes(q) || (sdo.includes(q) && q.length > 1);
    })
    .map(f => f.properties);
}
