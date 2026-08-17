import exifr from 'exifr';
import { findDistrictByCoordinates } from './geoMatcher';
import { findJapanPrefectureByCoordinates } from './japanGeoMatcher';

export interface ParsedPhotoResult {
  id?: string;
  file: File;
  previewUrl: string;
  thumbnailUrl: string;
  blob: Blob;
  takenAt?: string; // YYYY-MM-DDTHH:mm:ss
  dateFormatted?: string; // YYYY-MM-DD
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
  orientation?: number;
  districtCode?: string;
  districtName?: string;
}

/**
 * EXIF Orientation을 고려한 스마트 캔버스 썸네일 생성
 */
export async function createThumbnail(file: File, maxSize = 500, orientation = 1): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // 90도 또는 270도 회전된 경우 가로 세로 스왑
      const isRotated = orientation === 6 || orientation === 8 || orientation === 5 || orientation === 7;
      let targetW = isRotated ? height : width;
      let targetH = isRotated ? width : height;

      if (targetW > targetH) {
        if (targetW > maxSize) {
          targetH = Math.round((targetH * maxSize) / targetW);
          targetW = maxSize;
        }
      } else {
        if (targetH > maxSize) {
          targetW = Math.round((targetW * maxSize) / targetH);
          targetH = maxSize;
        }
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(url);
        return;
      }

      // Orientation 변환 행렬 적용
      ctx.save();
      switch (orientation) {
        case 2: // 수평 반전
          ctx.translate(targetW, 0);
          ctx.scale(-1, 1);
          break;
        case 3: // 180도 회전
          ctx.translate(targetW, targetH);
          ctx.rotate(Math.PI);
          break;
        case 4: // 수직 반전
          ctx.translate(0, targetH);
          ctx.scale(1, -1);
          break;
        case 5: // 90도 회전 + 수평 반전
          ctx.rotate(0.5 * Math.PI);
          ctx.scale(1, -1);
          break;
        case 6: // 90도 시계방향 회전
          ctx.rotate(0.5 * Math.PI);
          ctx.translate(0, -targetW);
          break;
        case 7: // 270도 회전 + 수평 반전
          ctx.rotate(1.5 * Math.PI);
          ctx.translate(-targetH, 0);
          ctx.scale(1, -1);
          break;
        case 8: // 270도 시계방향 회전 (90도 반시계)
          ctx.rotate(1.5 * Math.PI);
          ctx.translate(-targetH, 0);
          break;
        default:
          break;
      }

      if (isRotated) {
        ctx.drawImage(img, 0, 0, targetH, targetW);
      } else {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      }
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };

    img.onerror = () => {
      resolve(url);
    };

    img.src = url;
  });
}

/**
 * 단일 사진 파일의 EXIF 및 지오로케이션 정밀 파싱
 */
export async function parsePhotoFile(file: File): Promise<ParsedPhotoResult> {
  const previewUrl = URL.createObjectURL(file);

  let takenAt: string | undefined;
  let dateFormatted: string | undefined;
  let latitude: number | undefined;
  let longitude: number | undefined;
  let make: string | undefined;
  let model: string | undefined;
  let orientation = 1;
  let districtCode: string | undefined;
  let districtName: string | undefined;

  try {
    const exifData = await exifr.parse(file, {
      tiff: true,
      xmp: true,
      gps: true,
      translateValues: true,
      reviveValues: true,
    });

    if (exifData) {
      if (typeof exifData.Orientation === 'number') {
        orientation = exifData.Orientation;
      }

      // 촬영 일시
      const dateObj = exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate;
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        takenAt = dateObj.toISOString();
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        dateFormatted = `${yyyy}-${mm}-${dd}`;
      }

      // GPS 좌표 파싱
      if (typeof exifData.latitude === 'number' && typeof exifData.longitude === 'number') {
        latitude = Number(exifData.latitude.toFixed(6));
        longitude = Number(exifData.longitude.toFixed(6));

        const matchedKr = findDistrictByCoordinates(latitude, longitude);
        if (matchedKr) {
          districtCode = matchedKr.code;
          districtName = matchedKr.fullName;
        } else {
          // 일본 도도부현 지오코딩 시도
          const matchedJp = findJapanPrefectureByCoordinates(latitude, longitude);
          if (matchedJp) {
            districtCode = matchedJp.code;
            districtName = matchedJp.fullName;
          }
        }
      }

      make = exifData.Make ? String(exifData.Make).trim() : undefined;
      model = exifData.Model ? String(exifData.Model).trim() : undefined;
    }
  } catch (err) {
    console.warn('EXIF parse error for file:', file.name, err);
  }

  // 촬영 날짜가 없는 경우 파일 수정일 활용
  if (!takenAt && file.lastModified) {
    const d = new Date(file.lastModified);
    takenAt = d.toISOString();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dateFormatted = `${yyyy}-${mm}-${dd}`;
  }

  const thumbnailUrl = await createThumbnail(file, 500, orientation);

  return {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file,
    previewUrl,
    thumbnailUrl,
    blob: file,
    takenAt,
    dateFormatted,
    latitude,
    longitude,
    make,
    model,
    orientation,
    districtCode,
    districtName,
  };
}

/**
 * 업로드된 사진 목록 분석 및 추천 여행 정보 생성
 */
export function analyzePhotosForTrip(parsedList: ParsedPhotoResult[]): {
  suggestedStartDate: string;
  suggestedEndDate: string;
  suggestedDistricts: { code: string; name: string; count: number }[];
} {
  const dates = parsedList.map(p => p.dateFormatted).filter(Boolean) as string[];
  dates.sort();

  const suggestedStartDate = dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];
  const suggestedEndDate = dates.length > 0 ? dates[dates.length - 1] : suggestedStartDate;

  const districtCountMap = new Map<string, { code: string; name: string; count: number }>();
  parsedList.forEach(p => {
    if (p.districtCode && p.districtName) {
      const existing = districtCountMap.get(p.districtCode);
      if (existing) {
        existing.count += 1;
      } else {
        districtCountMap.set(p.districtCode, {
          code: p.districtCode,
          name: p.districtName,
          count: 1,
        });
      }
    }
  });

  const suggestedDistricts = Array.from(districtCountMap.values()).sort((a, b) => b.count - a.count);

  return {
    suggestedStartDate,
    suggestedEndDate,
    suggestedDistricts,
  };
}
