export interface DistrictFeatureProperties {
  code: string;
  name: string;
  fullName: string;
  sdoName: string;
  path: string;
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
}

// 일자별 일정표 아이템 (Day-by-Day Itinerary)
export interface ItineraryItem {
  id: string;
  day: number; // 1일차, 2일차...
  time?: string; // 10:30
  placeName: string;
  category: 'spot' | 'food' | 'cafe' | 'hotel' | 'etc';
  memo?: string;
  mapUrl?: string; // 네이버지도 / 카카오맵 링크
}

// 개별 여행(Trip) 엔티티
export interface Trip {
  id: string;
  title: string;
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
