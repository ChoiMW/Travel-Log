import japanData from '../data/japanPrefectures.json';
import { JapanPrefectureProperties } from '../types/travel';

export const japanPrefectures = japanData.features.map(f => f.properties) as JapanPrefectureProperties[];

export const japanRegions: string[] = [
  '전체 (47개 도도부현)',
  '간토 지방',
  '간사이 지방',
  '규슈 지방',
  '홋카이도 지방',
  '주부 지방',
  '도호쿠 지방',
  '주고쿠 지방',
  '시코쿠 지방',
];

/**
 * 일본 GPS 위도/경도 기반 47개 도도부현 최단 거리 / 지오코딩 매칭
 */
export function findJapanPrefectureByCoordinates(lat: number, lng: number): JapanPrefectureProperties | null {
  // 일본 영토 범위 대략 체크 (lat: 24 ~ 46, lng: 122 ~ 146)
  if (lat < 23 || lat > 47 || lng < 122 || lng > 147) {
    return null;
  }

  let closestPrefecture: JapanPrefectureProperties | null = null;
  let minDistance = Infinity;

  for (const pref of japanPrefectures) {
    const dLat = pref.center.lat - lat;
    const dLng = pref.center.lng - lng;
    const dist = dLat * dLat + dLng * dLng;

    if (dist < minDistance) {
      minDistance = dist;
      closestPrefecture = pref;
    }
  }

  // 1.8도 이내(약 200km) 근접 시 매칭 인정
  if (minDistance < 3.24) {
    return closestPrefecture;
  }

  return null;
}

/**
 * 일본 도도부현 검색 (한글, 일본어 한자, 영문 로마자 모두 지원)
 * 예: "도쿄", "Tokyo", "東京", "오사카", "후쿠오카", "홋카이도"
 */
export function searchJapanPrefectures(query: string): JapanPrefectureProperties[] {
  if (!query || !query.trim()) return [];
  const clean = query.trim().toLowerCase();

  return japanPrefectures.filter(pref => {
    return (
      pref.name.toLowerCase().includes(clean) ||
      pref.fullName.toLowerCase().includes(clean) ||
      pref.nameJa.includes(clean) ||
      pref.nameRomaji.toLowerCase().includes(clean) ||
      pref.regionName.toLowerCase().includes(clean)
    );
  });
}
