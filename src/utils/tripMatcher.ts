import { Trip, DistrictFeatureProperties } from '../types/travel';
import { findDistrictByCoordinates } from './geoMatcher';

export interface ActiveTripMatchResult {
  matchedTrip: Trip | null;
  currentDistrict: DistrictFeatureProperties | null;
  matchType: 'both' | null;
  todayStr: string;
}

/**
 * 브라우저 Geolocation API를 Promise 기반으로 안전하게 호출 (최대 6초 타임아웃)
 */
export async function getCurrentCoordinates(): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        console.warn('GPS location access denied or unavailable:', err.message);
        resolve(null);
      },
      { timeout: 6000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  });
}

/**
 * 오늘 날짜 문자열 반환 (YYYY-MM-DD 형식)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 현재 날짜와 현재 위치 좌표를 기반으로 여행(Trip)을 엄격하게 자동 매칭
 * [철칙]: 날짜와 지역이 '둘 다' 완벽히 일치하는 경우에만 매칭! 하나라도 불일치 시 null 반환.
 */
export async function matchActiveTrip(
  trips: Trip[],
  explicitCoords?: { lat: number; lng: number } | null,
  explicitDate?: string
): Promise<ActiveTripMatchResult> {
  const todayStr = explicitDate || getTodayDateString();
  const coords = explicitCoords !== undefined ? explicitCoords : await getCurrentCoordinates();

  let currentDistrict: DistrictFeatureProperties | null = null;
  if (coords) {
    currentDistrict = findDistrictByCoordinates(coords.lat, coords.lng);
  }

  // 위치를 알 수 없거나 등록된 여행이 없으면 매칭하지 않음
  if (!currentDistrict || trips.length === 0) {
    return { matchedTrip: null, currentDistrict, matchType: null, todayStr };
  }

  // 🔥 [엄격 매칭]: 오늘 날짜가 여행 기간 내에 있고(startDate <= today <= endDate) AND
  // 현재 위치의 시군구 코드(code)가 해당 여행의 districtCodes에 포함되어 있어야만 매칭!
  const strictMatch = trips.find((t) => {
    const isDateInRange = t.startDate <= todayStr && todayStr <= t.endDate;
    const isDistrictMatched = t.districtCodes.includes(currentDistrict!.code);
    return isDateInRange && isDistrictMatched;
  });

  if (strictMatch) {
    return {
      matchedTrip: strictMatch,
      currentDistrict,
      matchType: 'both',
      todayStr,
    };
  }

  // 날짜나 지역 중 하나라도 일치하지 않으면 자동 매칭 안 함 (null)
  return {
    matchedTrip: null,
    currentDistrict,
    matchType: null,
    todayStr,
  };
}
