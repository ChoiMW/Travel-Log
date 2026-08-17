export type CountryCode = 'KR' | 'JP';

export interface DistrictFeatureProperties {
  code: string;
  name: string;
  fullName: string;
  sdoName: string;
  path: string;
  country?: CountryCode;
  center?: {
    lat: number;
    lng?: number;
    lon?: number;
    svgX: number;
    svgY: number;
  };
}

export interface DistrictGeoJSONFeature {
  type: 'Feature';
  properties: DistrictFeatureProperties;
  geometry: any;
}

// 일본 47개 도도부현 메타데이터
export interface JapanPrefectureProperties {
  code: string;               // ISO 또는 식별코드 (예: "JP-13")
  name: string;               // 한국어 약칭 (예: "도쿄")
  fullName: string;           // 한국어 전체명 (예: "도쿄도")
  nameJa?: string;            // 일본어 (예: "東京都")
  nameRomaji?: string;        // 영문 로마자 (예: "Tokyo")
  regionName: string;         // 8대 지방명 (예: "간토 지방", "간사이 지방", "규슈 지방", "홋카이도 지방")
  centerLat?: number;
  centerLng?: number;
  svgCenter?: [number, number];
  path?: string;
  center?: {
    lat: number;
    lng: number;
    svgX: number;
    svgY: number;
  };
}

// 모바일 티켓 아이템
export interface MobileTicketItem {
  id: string;
  title: string;
  category: 'ktx' | 'flight' | 'hotel' | 'ticket' | 'etc';
  date: string;
  time?: string;
  location?: string;
  bookingNumber?: string;
  memo?: string;
  imageUrl?: string;
  blob?: Blob;
  isUsed: boolean;
}

// 짐싸기 체크리스트 아이템
export interface PackingItem {
  id: string;
  text: string;
  category: string;
  checked: boolean;
}

// 가계부 지출 아이템
export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string;
  currency?: 'KRW' | 'JPY';
}

// 일자별 트리플 스타일 일정/루트 아이템 (Day-by-Day Route Itinerary)
export interface ItineraryItem {
  id: string;
  day: number; // 1일차, 2일차...
  date?: string; // '2026-08-17'
  time?: string; // '10:30'
  placeName: string;
  category: 'spot' | 'food' | 'cafe' | 'shopping' | 'hotel' | 'transit' | 'etc';
  memo?: string;
  mapUrl?: string; // 네이버지도 / 구글맵 링크
  isCompleted?: boolean; // 방문 완료 여부
  // 다음 장소까지의 이동 정보
  transitType?: 'walk' | 'subway' | 'bus' | 'taxi' | 'car';
  transitDuration?: number; // 분 단위 (예: 15분)
  transitFare?: number; // 요금 (엔화/원화)
  cost?: number; // 해당 장소 예상 비용
  // 현장 사용 모바일 티켓 / 캡처 사진 / 바코드 / QR 바우처
  ticketImageUrl?: string; // 업로드된 캡처 사진, 바코드, 모바일 티켓 이미지 URL
  ticketImageName?: string; // 첨부된 티켓 파일명
  qrImageUrl?: string; // (호환용) QR 이미지 URL
  qrCodeData?: string; // QR 생성 텍스트 또는 URL
}

// 개별 여행(Trip) 엔티티
export interface Trip {
  id: string;
  title: string;
  country?: CountryCode; // 'KR' (기본값) | 'JP' (일본)
  currency?: 'KRW' | 'JPY';
  startDate: string;
  endDate: string;
  districtCodes: string[];
  districtNames: string[];
  color: string;
  rating?: number;
  tags?: string[];
  memo?: string;
  createdAt: string;
  updatedAt?: string;

  // 여행별 독립 포켓 데이터
  tickets?: MobileTicketItem[];
  packingList?: PackingItem[];
  expenses?: ExpenseItem[];
  itinerary?: ItineraryItem[];
}

export interface PhotoItem {
  id: string;
  tripId: string;
  country?: CountryCode;
  districtCode: string;
  districtName: string;
  fileName: string;
  blob?: Blob;
  dataUrl?: string;
  thumbnailUrl?: string;
  takenAt?: string;
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
  caption?: string;
  createdAt: string;
}

export interface VisitedDistrictSummary {
  districtCode: string;
  fullName: string;
  sdoName: string;
  name: string;
  visitCount: number;
  latestVisitDate: string;
  latestTripTitle: string;
  color: string;
  photoCount: number;
  tripIds: string[];
}

export interface BackupPayload {
  appName?: string;
  version: string;
  exportedAt: string;
  trips: Trip[];
  photos: PhotoItem[];
}
