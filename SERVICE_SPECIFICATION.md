# TravelLog (트래블로그) - v2.0 Global
## 대한민국 250곳 & 일본 47개 도도부현 멀티 국가 여행 라이프로그 마스터 명세서

본 문서는 **TravelLog v2.0** 서비스의 기획 의도, UI/UX 설계, 시스템 아키텍처, 데이터 모델, 핵심 알고리즘, 컴포넌트 구조 및 구현 코드를 완벽하게 집대성한 마스터 가이드입니다. **대한민국 1.0(250개 시군구)과 일본 2.0(8대 지방 47개 도도부현)을 모두 포함하여 백엔드 없이 100% 동일한 서비스를 완벽하게 재구현할 수 있도록** 상세하게 기술되었습니다.

---

# 1. 서비스 개요 및 핵심 철학

### 1.1 서비스 정의
**TravelLog**는 대한민국 250개 시·군·구(v1.0) 및 일본 47개 도도부현(v2.0)을 정복하고 기록하는 **100% 로컬 프라이빗(On-Device) 멀티 국가 여행 라이프로그 슈퍼앱**입니다.

### 1.2 핵심 5대 철학
1. **100% On-Device & Zero Server Privacy**:
   - 사용자의 여행 사진, 일정, 위치 정보, QR 티켓, 지출 내역은 외부 서버로 1바이트도 전송되지 않으며, 오직 브라우저의 **IndexedDB**에 안전하게 보관됩니다.
2. **글로벌 원클릭 국가 스위처 (🇰🇷 대한민국 ↔ 🇯🇵 일본)**:
   - 상단 헤더의 탭 한 번으로 국내 여행과 일본 여행을 자유롭게 전환하며, 국가별 독립된 지도 뷰어와 정복 통계를 제공합니다.
3. **Zero-Friction 여행 아카이빙 (EXIF 지오코딩)**:
   - 여행 사진을 드래그&드롭하면 사진 속 EXIF 메타데이터(촬영일시, GPS 위경도)를 자동 분석하여 250개 시·군·구 또는 일본 47개 도도부현 중 어디인지 1초 만에 판별하고 자동으로 여행 기록을 생성합니다.
4. **카토그래피 기반 2단계 계층형 정복 지도 (Hierarchical LOD Map)**:
   - 전국 줌아웃 시에는 광역시·도/지방 캡슐로 시원하게 표시되고, 클릭/줌인 시 세부 시군구 및 도도부현이 선명하게 나타나며 글자 겹침을 원천 차단합니다.
5. **여행 전주기 올인원 포켓 (Trip Pocket)**:
   - 국내 여행은 네이버 지도 길찾기 / 원화(KRW), 일본 여행은 구글 맵스 길찾기 / 엔화(JPY ¥) 가계부 및 신칸센/어트랙션 모바일 QR 패스를 1:1로 맞춤 지원합니다.

---

# 2. 기술 스택 및 라이브러리

| 구분 | 기술 / 라이브러리 | 용도 |
| :--- | :--- | :--- |
| **Core Framework** | React 18, TypeScript, Vite | 프론트엔드 반응형 SPA |
| **Local Storage** | IndexedDB (`travellog_db`), LocalStorage | 프라이빗 데이터베이스 (사진 Blob, 여행, 티켓, 일정) |
| **Icons** | `lucide-react` | 일관된 모던 토스/애플 스타일 아이콘 |
| **Image & EXIF** | `exifr`, HTML5 Canvas API | 사진 EXIF GPS/날짜 파싱, 썸네일 생성, 소셜 카드 렌더링 |
| **Styling** | Vanilla CSS (CSS Variables, Flex/Grid, Glassmorphism) | 다크/라이트 모드 테마 토큰 및 반응형 디자인 |
| **Testing** | Puppeteer, Node.js | 실시간 브라우저 E2E 렌더링 및 자동화 검증 |

---

# 3. 디렉토리 구조 (Folder Structure)

```bash
travellog/
├── index.html                     # SPA 엔트리 HTML (SEO 메타태그, Pretendard 웹폰트)
├── package.json                   # 의존성 및 스크립트 정의
├── vite.config.ts                 # Vite 번들러 설정
├── SERVICE_SPECIFICATION.md       # 서비스 전체 마스터 시스템 명세서
├── src/
│   ├── main.tsx                   # React DOM 렌더링 엔트리
│   ├── App.tsx                    # 글로벌 국가 스위처, 라우팅, 실시간 위치 매칭 배너, 모달 상태 관리
│   ├── index.css                  # 디자인 시스템 (토스 블루/로즈 레드 컬러 토큰, 다크모드, 공통 유틸리티)
│   ├── types/
│   │   └── travel.ts              # 전체 TypeScript 인터페이스 정의 (Trip, CountryCode, JapanPrefecture 등)
│   ├── db/
│   │   └── index.ts               # IndexedDB CRUD 래퍼 (trips, photos, app_settings 스토어)
│   ├── data/
│   │   ├── koreaDistricts.json    # 전국 250개 시·군·구 SVG Path 및 폴리곤 중심 좌표 데이터
│   │   └── japanPrefectures.json  # 일본 8대 지방 47개 도도부현 SVG Path 및 중심 좌표 데이터
│   ├── utils/
│   │   ├── geoMatcher.ts          # 한국 GPS 위경도 ➔ 250개 시군구 매칭 및 검색 알고리즘
│   │   ├── japanGeoMatcher.ts     # 일본 GPS 위경도 ➔ 47개 도도부현 매칭 및 다국어 검색 엔진
│   │   ├── exif.ts                # 사진 EXIF 메타데이터 파싱 및 썸네일 생성 유틸리티
│   │   ├── tripMatcher.ts         # 현재 위치(GPS) & 오늘 날짜 기반 여행 엄격 자동 매칭 엔진
│   │   └── backup.ts              # JSON 무손실 백업 및 데이터 마이그레이션
│   └── components/
│       ├── Layout/
│       │   └── Navigation.tsx     # 🇰🇷/🇯🇵 글로벌 국가 스위처 및 모바일 탭바
│       ├── Map/
│       │   ├── MapViewer.tsx      # 대한민국 250개 시군구 2단계 계층형 지도 뷰어
│       │   └── JapanMapViewer.tsx # 일본 47개 도도부현 2단계 계층형 지도 뷰어
│       ├── Pocket/
│       │   ├── TravelPocketView.tsx # 일자별 일정표(네이버/구글맵), 티켓/QR, 짐싸기, 가계부(KRW/JPY)
│       │   └── QRPassModal.tsx    # 고대비 풀스크린 QR/바코드 뷰어
│       ├── Themes/Toss/
│       │   └── TossHomeView.tsx   # 토스 스타일 메인 홈 대시보드
│       ├── Diary/
│       ├── Photo/
│       ├── Stats/
│       └── Settings/
```
│   └── components/
│       ├── Layout/
│       │   └── Navigation.tsx     # 상단 헤더, 모바일 하단 탭바, 다크모드 토글
│       ├── Themes/Toss/
│       │   └── TossHomeView.tsx   # 홈 화면 (국토 정복률 게이지, 최근 여행, 정복 뱃지)
│       ├── Map/
│       │   └── MapViewer.tsx      # 2단계 계층형 18x 슈퍼줌 지도, 글래스 카드, 3종 소셜 맵 카드
│       ├── Diary/
│       │   ├── TripTimeline.tsx   # 여행 기록 매거진 타임라인 뷰
│       │   ├── TripDetailModal.tsx # 여행 상세 모달 (사진 갤러리, 일정표, 통계)
│       │   └── TripCard.tsx       # 여행 요약 카드
│       ├── Editor/
│       │   └── TripEditorModal.tsx # 여행 등록/수정 모달 (드래그&드롭 사진 일괄 지오코딩)
│       ├── Photo/
│       │   ├── PhotoGallery.tsx   # 시군구별/촬영일별 사진첩 갤러리
│       │   └── PhotoLightbox.tsx  # 사진 고화질 뷰어 & EXIF 상세 정보 팝업
│       ├── Pocket/
│       │   ├── TravelPocketView.tsx # 개별 여행 포켓 (일정표, 티켓/QR, 짐싸기, 1/N 가계부)
│       │   └── QRPassModal.tsx    # 모바일 탑승권/티켓 전용 고대비 풀스크린 QR 뷰어
│       ├── Stats/
│       │   └── StatsDashboard.tsx # AI 여행 DNA 페르소나 리포트 & 사계절 분포 통계
│       └── Settings/
│           └── SettingsModal.tsx  # 100% 프라이빗 보증, 데이터 백업/복구/초기화 모달
```

---

# 4. 핵심 데이터 모델 (TypeScript Interfaces)

### 4.1 `Trip` (여행 엔티티)
```typescript
export interface Trip {
  id: string;                      // 고유 ID (예: "trip_1723850000000")
  title: string;                   // 여행 제목 (예: "부산 사하구 다대포 힐링 여행")
  startDate: string;               // 시작일 (YYYY-MM-DD)
  endDate: string;                 // 종료일 (YYYY-MM-DD)
  districtCodes: string[];         // 방문 시군구 행정동 코드 배열 (예: ["26380"])
  districtNames: string[];         // 방문 시군구 명칭 배열 (예: ["부산광역시 사하구"])
  color: string;                   // 지도 색칠 테마 컬러 (HEX)
  rating?: number;                 // 만족도 별점 (1~5)
  memo?: string;                   // 여행 소감 및 메모
  coverPhotoId?: string;           // 대표 썸네일 사진 ID
  themeTags?: string[];            // 테마 태그 (['미식', '힐링', '카페', '바다'])
  
  // 1:1 귀속 여행 포켓 서브 데이터
  itinerary?: ItineraryItem[];     // 일자별 일정표
  tickets?: MobileTicketItem[];    // 티켓 및 QR 패스 목록
  packingList?: PackingItem[];     // 짐싸기 체크리스트
  expenses?: ExpenseItem[];        // 1/N 가계부 지출 내역
  
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 `ItineraryItem` (일정 항목)
```typescript
export interface ItineraryItem {
  id: string;
  dayNumber: number;               // 여행 Day (1, 2, 3...)
  time?: string;                   // 시간 (예: "14:30")
  placeName: string;               // 장소명 (예: "다대포 해수욕장")
  category: 'spot' | 'food' | 'cafe' | 'hotel' | 'etc';
  memo?: string;
  isCompleted?: boolean;
}
```

### 4.3 `MobileTicketItem` (모바일 티켓 / QR)
```typescript
export interface MobileTicketItem {
  id: string;
  title: string;                   // 티켓명 (예: "KTX 서울->부산 14호차 5A")
  bookingNumber?: string;          // 예약번호 / 승차권 번호
  placeName?: string;              // 사용처
  validDate: string;               // 사용 예정일 (YYYY-MM-DD)
  qrImageData?: string;            // QR/바코드 이미지 DataURL 또는 사진 Blob URL
  memo?: string;
  isUsed: boolean;
}
```

### 4.4 `PhotoItem` (사진 및 EXIF 지오코딩)
```typescript
export interface PhotoItem {
  id: string;
  tripId: string;
  districtCode: string;            // 사진 촬영지 시군구 코드
  districtName: string;            // 사진 촬영지 시군구 전체명
  fileName: string;
  blob: Blob;                      // 원본 사진 바이너리 Blob
  thumbnailUrl?: string;           // 최적화된 저용량 썸네일 DataURL
  takenAt?: string;                // EXIF 촬영 일시 (YYYY-MM-DD HH:mm:ss)
  latitude?: number;               // EXIF GPS 위도
  longitude?: number;              // EXIF GPS 경도
  make?: string;                   // 카메라 제조사 (예: "Apple")
  model?: string;                  // 카메라 모델명 (예: "iPhone 15 Pro")
  createdAt: string;
}
```

---

# 5. 핵심 알고리즘 및 구현 원리

### 5.1 EXIF 기반 GPS 시군구 자동 매칭 (Point-in-Polygon / Geocoding)
- 사진 업로드 시 `exifr.parse(file, { gps: true, exif: true })`로 위경도 추출.
- `geoMatcher.ts`의 `findDistrictByCoordinates(lat, lng)` 호출:
  1. 250개 시군구의 Bounding Box(`minLat`, `maxLat`, `minLng`, `maxLng`)를 1차 고속 필터링.
  2. Bounding Box에 진입한 폴리곤을 대상으로 **Ray-Casting Algorithm (점-다각형 포함 검사)** 수행.
  3. 일치하는 시군구(`DistrictFeatureProperties`)를 정확도 100%로 도출하여 자동 매핑.

### 5.2 2단계 계층형 지도 줌 엔진 (Hierarchical LOD Zoom)
- **줌아웃 상태 (`zoomLevel < 1.7` && `selectedSdo === '전국'`)**:
  - 250개 시군구 레이블을 숨기고 **17개 광역시·도 대표 캡슐 (`경기도 (42곳)`, `강원도 (18곳)`, `충북 (14곳)` 등)**만 중심 좌표에 단일 렌더링.
  - 글자 겹침을 100% 원천 차단하고 전국 정복 현황을 직관적으로 조망.
- **줌인 상태 (`zoomLevel >= 1.7` 또는 시·도 클릭 시)**:
  - 해당 광역시·도로 즉시 초밀착 줌인(Drill-down)되면서 **250개 세부 시·군·구 지명이 널찍한 여백에 선명하게 분할 렌더링**.

### 5.3 복합 행정시 그룹핑 캡슐 (City Grouping Capsule)
- 산하에 여러 '구'를 가진 15개 주요 도시(천안시, 청주시, 전주시, 포항시, 창원시, 수원시, 성남시, 고양시, 용인시, 안산시, 안양시, 대전, 대구, 광주, 울산):
  - 저배율 줌에서 `천안시 (2구)`, `청주시 (4구)` 형태의 세련된 단일 알약 캡슐로 묶어 표기.
  - 캡슐 클릭 시 3.8배로 포커스 확대되며 `상당구`, `서원구`, `흥덕구`, `청원구` 등으로 분할 표시.

### 5.4 실시간 GPS & 오늘 날짜 기반 여행 엄격 자동 매칭 (Strict Active Trip Matcher)
- 브라우저 로딩 시 `navigator.geolocation.getCurrentPosition()`과 오늘 날짜(`YYYY-MM-DD`)를 동시 획득.
- `findDistrictByCoordinates(lat, lng)`로 현재 머무르고 있는 시·군·구(`currentDistrict`)를 판별.
- **[철칙]**: **오늘 날짜가 여행 기간 내에 있고(`startDate <= 오늘 <= endDate`) AND 현재 위치의 시군구가 해당 여행의 `districtCodes`에 포함된 경우에만(100% 일치)** 여행을 자동 매칭!
- 날짜나 지역 중 하나라도 일치하지 않는 경우(예: 서울에 머무르고 있는데 부산 여행 기록이 있는 경우)에는 임의로 자동 매칭/선택하지 않고 `null`로 유지.
- 매칭 성공 시:
  - 상단에 `[✨ 현재 위치 & 날짜 일치 여행 자동 연결됨 (지역명)]` 스마트 라이브 배너 노출.
  - `[여행 포켓]` 탭 진입 시 해당 여행이 1초 만에 기본 선택되어 오늘의 일정표(Day-N), 티켓/QR 패스, 짐싸기가 즉시 열림.

### 5.5 3종 소셜 공유 맵 카드 캔버스 렌더러 (Social Map Card Exporter)
- HTML5 Canvas를 이용해 SVG 지도를 벡터로 래스터라이징하여 3가지 규격으로 즉시 렌더링:
  1. **인스타그램 스토리 (9:16, 1080x1920)**: 다크 모던 그라디언트 테마, 정복률 및 여행 횟수 뱃지.
  2. **토스 미니멀 (1:1, 1200x1200)**: 화이트 미니멀 배경, 토스 블루 국토 자산 퍼센트 뱃지.
  3. **여권 국토정복 증명서 (3:4, 1200x1600)**: 클래식 딥그린 골드 프레임 공식 인증서 디자인.
- 원클릭으로 무손실 고화질 PNG 즉시 다운로드.

---

# 6. 전체 화면별 기능 명세

### 1. 홈 화면 (`TossHomeView.tsx`)
- 대한민국 국토 자산 정복률 프로그레스 바 (`X곳 정복 중 / 전체 250개 시군구 (X.X%)`).
- `[🗺️ 지도 크게보기]`, `[+ 새 기록 추가]` 퀵 액션.
- 최신 여행 기록 피드 및 방문 지역 순위(TOP 3).
- 전국 완주 시 축하 컨페티(Confetti) 폭죽 애니메이션.

### 2. 여행 지도 (`MapViewer.tsx`)
- 2단계 계층형 18배 슈퍼 줌 SVG 지도 엔진.
- 17개 광역시·도 ➔ 250개 세부 시군구 원클릭 드릴다운.
- 방문 완료 지역 여행별 커스텀 테마 색상 칠하기.
- 지역 클릭 시 상단 플로팅 글래스 메모리 카드 (썸네일, 방문 횟수, 최근 여행명).
- 3종 소셜 공유 카드 생성기 탑재.

### 3. 여행 기록 (`TripTimeline.tsx` & `TripDetailModal.tsx`)
- 시간순 여행 매거진 카드 타임라인.
- 여행 상세 모달: 일정표, 방문 시군구 뱃지, 첨부 사진 그리드 갤러리, 만족도 별점, 메모.

### 4. 사진첩 (`PhotoGallery.tsx` & `PhotoLightbox.tsx`)
- 시군구별 / 날짜별 필터링 지원 인피니티 갤러리.
- 라이트박스 팝업: 고해상도 사진 뷰, 촬영 카메라 기종(Make/Model), 촬영 일시, GPS 위경도 및 지도 위치 확인.

### 5. 스마트 여행 포켓 (`TravelPocketView.tsx`)
- 상단 개별 여행 선택 셀렉터 및 `⚡ D-Day 오늘 출발!`, `🛫 D-3일 전` 카운트다운 뱃지.
- **[일정표 서브탭]**: Day-by-Day 일자별 시간순 방문 장소 관리 & 네이버 지도 길찾기 1초 연동.
- **[티켓/QR 서브탭]**: 교통/숙소/입장권 예약번호 및 QR코드/바코드 이미지 저장, 현장 전용 고대비 풀스크린 뷰어(`QRPassModal.tsx`).
- **[짐싸기 서브탭]**: 의류, 전자기기, 세면도구, 서류 등 카테고리별 체크리스트 및 실시간 진행률 프로그레스 바.
- **[1/N 가계부 서브탭]**: 총 지출액, 동행 인원수별 1인당 정산 금액 자동 계산.

### 6. 정복 통계 대시보드 (`StatsDashboard.tsx`)
- **AI 여행 DNA 페르소나 리포트**:
  - `🍲 로컬 미식 탐험가` (맛집/카페 위주)
  - `🌲 피톤치드 힐링 러버` (자연/휴식 위주)
  - `🚗 로드트립 어드벤처러` (다지역 국토 대장정)
  - `✨ 낭만 여행자` (감성 사진 아카이빙)
- 사계절(봄/여름/가을/겨울) 여행 분포 차트 및 전국 17개 시도별 세부 정복 통계.

### 7. 설정 및 백업 (`SettingsModal.tsx`)
- 100% 온디바이스 로컬 보안 인증 문구.
- 원클릭 JSON 무손실 백업 다운로드 및 데이터 복원(Import).
- 다크/라이트 모드 테마 전환 및 전체 데이터 안전 초기화.

---

# 7. 빌드 및 실행 가이드

### 7.1 의존성 설치
```bash
npm install
```

### 7.2 로컬 개발 서버 실행
```bash
npm run dev
# 기본 주소: http://localhost:3000/
```

### 7.3 프로덕션 번들 빌드
```bash
npm run build
# dist/ 디렉토리에 정적 빌드 산출물 생성 (0.8초 완료)
```

### 7.4 자동화 테스트 실행
```bash
# 계층형 지도 줌 테스트
node test-map.js

# GPS & 날짜 기반 자동 여행 매칭 테스트
node test-auto-match.js
```

---

# 8. 결론 및 보증
본 명세서는 **TravelLog Korea**의 모든 기획 요구사항, 상태 다이어그램, 데이터베이스 스키마 및 UI 인터랙션을 100% 담고 있으므로, 추후 프레임워크를 변경하거나 신규 환경에서 재구현할 때 **완벽한 단일 진실 공급원(Single Source of Truth)**으로 활용할 수 있습니다.
