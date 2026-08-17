import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Sparkles, Compass, Search, Star, Info, ArrowRight } from 'lucide-react';
import { JapanPrefectureProperties } from '../../types/travel';
import japanData from '../../data/japanPrefectures.json';

interface HotspotItem {
  id: string;
  name: string;
  nameJp: string;
  category: string;
  prefCode: string;
  prefName: string;
  lat: number;
  lng: number;
  zoom: number;
  desc: string;
  rating: number;
}

// 후쿠오카 및 일본 주요 여행 거점 핫스팟 프리셋
const JAPAN_HOTSPOTS: HotspotItem[] = [
  // 후쿠오카 핫스팟
  {
    id: 'spot_fuk_1',
    name: '하카타역 (Hakata Station)',
    nameJp: '博多駅',
    category: '교통/쇼핑',
    prefCode: 'JP-40',
    prefName: '후쿠오카현',
    lat: 33.5902,
    lng: 130.4206,
    zoom: 16,
    desc: '후쿠오카의 중심 철도역. JR 하카타 시티, 아뮤플라자 쇼핑몰과 라멘 스타디움 직결.',
    rating: 4.8,
  },
  {
    id: 'spot_fuk_2',
    name: '텐진 지하상가 & 텐진역',
    nameJp: '天神地下街',
    category: '쇼핑/번화가',
    prefCode: 'JP-40',
    prefName: '후쿠오카현',
    lat: 33.5916,
    lng: 130.4007,
    zoom: 16,
    desc: '유럽풍 벽돌 인테리어의 대규모 지하 쇼핑 거리. 다이묘 거리 및 백화점 연결.',
    rating: 4.7,
  },
  {
    id: 'spot_fuk_3',
    name: '캐널시티 하카타',
    nameJp: 'キャナルシティ博多',
    category: '쇼핑/엔터테인먼트',
    prefCode: 'JP-40',
    prefName: '후쿠오카현',
    lat: 33.5897,
    lng: 130.4109,
    zoom: 17,
    desc: '운하를 따라 조성된 복합 쇼핑타운. 매 시간 진행되는 분수쇼와 라멘 스타디움.',
    rating: 4.6,
  },
  {
    id: 'spot_fuk_4',
    name: '다자이후 텐만구 (신사)',
    nameJp: '太宰府天満宮',
    category: '역사/신사',
    prefCode: 'JP-40',
    prefName: '후쿠오카현',
    lat: 33.5215,
    lng: 130.5348,
    zoom: 16,
    desc: '학문의 신을 모시는 천년 고찰. 우메가에 모치(매화떡)와 스타벅스 콘셉트 스토어.',
    rating: 4.9,
  },
  {
    id: 'spot_fuk_5',
    name: '후쿠오카 타워 & 모모치 해변',
    nameJp: '福岡タワー・シーサイドももち',
    category: '랜드마크/전망대',
    prefCode: 'JP-40',
    prefName: '후쿠오카현',
    lat: 33.5932,
    lng: 130.3515,
    zoom: 16,
    desc: '234m 높이의 해변 타워. 하카타만의 360도 야경과 이국적인 해변 웨딩 빌리지.',
    rating: 4.7,
  },
  {
    id: 'spot_fuk_6',
    name: '나카스 포장마차 거리 (야타이)',
    nameJp: '中洲屋台街',
    category: '미식/야경',
    prefCode: 'JP-40',
    prefName: '후쿠오카현',
    lat: 33.5933,
    lng: 130.4072,
    zoom: 17,
    desc: '나카스 강변을 따라 줄지어 선 후쿠오카 전통 야타이(포장마차). 돈코츠 라멘과 꼬치구이.',
    rating: 4.5,
  },
  {
    id: 'spot_fuk_7',
    name: '유후인 온천마을 & 긴린코 호수',
    nameJp: '由布院温泉・金鱗湖',
    category: '온천/힐링',
    prefCode: 'JP-44',
    prefName: '오이타현',
    lat: 33.2646,
    lng: 131.3556,
    zoom: 15,
    desc: '아기자기한 유노쓰보 상점가와 아침 물안개가 피어오르는 몽환적인 긴린코 호수.',
    rating: 4.9,
  },

  // 도쿄 / 오사카 랜드마크
  {
    id: 'spot_tokyo_1',
    name: '도쿄 시부야 스크램블 & 스카이',
    nameJp: '渋谷スクランブルスクエア',
    category: '랜드마크/전망대',
    prefCode: 'JP-13',
    prefName: '도쿄도',
    lat: 35.6598,
    lng: 139.7024,
    zoom: 16,
    desc: '전 세계에서 가장 번화한 교차로와 229m 루프탑 전망대 SHIBUYA SKY.',
    rating: 4.8,
  },
  {
    id: 'spot_osaka_1',
    name: '오사카 도톤보리 & 글리코상',
    nameJp: '道頓堀・グリコサイン',
    category: '미식/랜드마크',
    prefCode: 'JP-27',
    prefName: '오사카부',
    lat: 34.6687,
    lng: 135.5013,
    zoom: 17,
    desc: '오사카 여행의 필수 인증샷 성지. 타코야키, 오코노미야키 맛집 밀집 지역.',
    rating: 4.7,
  },
];

interface GoogleMapsPilotViewerProps {
  initialPrefCode?: string | null;
}

export const GoogleMapsPilotViewer: React.FC<GoogleMapsPilotViewerProps> = ({
  initialPrefCode = 'JP-40',
}) => {
  const [selectedSpotId, setSelectedSpotId] = useState<string>('spot_fuk_1');
  const [filterPrefCode, setFilterPrefCode] = useState<string>(initialPrefCode || 'all');

  const selectedSpot = JAPAN_HOTSPOTS.find(s => s.id === selectedSpotId) || JAPAN_HOTSPOTS[0];

  const filteredSpots = JAPAN_HOTSPOTS.filter(s => {
    if (filterPrefCode === 'all') return true;
    return s.prefCode === filterPrefCode;
  });

  // 구글 맵스 반응형 인터랙티브 임베드 URL (API Key 불필요)
  const mapEmbedUrl = `https://maps.google.com/maps?q=${selectedSpot.lat},${selectedSpot.lng}&z=${selectedSpot.zoom}&output=embed&hl=ko`;

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. 상단 파일럿 안내 & 필터 바 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '24px',
          padding: '18px 22px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#4285F4', color: 'white', padding: '8px', borderRadius: '12px' }}>
            <Compass size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Google Maps 라이브 파일럿 뷰어
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '9999px', fontWeight: 800 }}>
                PILOT BETA
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              실시간 위성/로드맵 탐색 및 후쿠오카/일본 주요 명소 1초 길찾기 연동
            </p>
          </div>
        </div>

        {/* 지역 필터 셀렉터 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>거점 지역:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
            value={filterPrefCode}
            onChange={e => {
              setFilterPrefCode(e.target.value);
              const firstInPref = JAPAN_HOTSPOTS.find(s => e.target.value === 'all' || s.prefCode === e.target.value);
              if (firstInPref) setSelectedSpotId(firstInPref.id);
            }}
          >
            <option value="all">전체 명소 ({JAPAN_HOTSPOTS.length})</option>
            <option value="JP-40">후쿠오카현 (Fukuoka)</option>
            <option value="JP-44">오이타현 (유후인/벳푸)</option>
            <option value="JP-13">도쿄도 (Tokyo)</option>
            <option value="JP-27">오사카부 (Osaka)</option>
          </select>
        </div>
      </div>

      {/* 2. 핫스팟 퀵 프리셋 칩 목록 */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {filteredSpots.map(spot => {
          const isSelected = spot.id === selectedSpot.id;
          return (
            <button
              key={spot.id}
              onClick={() => setSelectedSpotId(spot.id)}
              style={{
                padding: '10px 16px',
                borderRadius: '16px',
                border: isSelected ? '2px solid #4285F4' : '1px solid var(--border-light)',
                background: isSelected ? '#eff6ff' : 'var(--bg-surface)',
                color: isSelected ? '#1d4ed8' : 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <MapPin size={14} style={{ color: isSelected ? '#2563eb' : '#94a3b8' }} />
              <span>{spot.name.split(' (')[0]}</span>
              <span style={{ fontSize: '0.72rem', background: isSelected ? '#dbeafe' : 'var(--bg-hover)', padding: '2px 6px', borderRadius: '8px' }}>
                {spot.category}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. 구글 맵 임베드 및 명소 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '480px',
            borderRadius: '26px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-light)',
            background: '#e2e8f0',
          }}
        >
          <iframe
            title="Google Maps Live Pilot"
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
          />

          {/* 우측 하단 구글 맵스 공식 길찾기 플로팅 버튼 */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              background: '#4285F4',
              color: 'white',
              borderRadius: '14px',
              padding: '10px 18px',
              fontSize: '0.86rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(66, 133, 244, 0.4)',
              zIndex: 10,
            }}
          >
            <Navigation size={16} />
            <span>Google Maps 앱으로 길찾기</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* 4. 선택된 명소 상세 카드 */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '24px',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 800 }}>
                {selectedSpot.prefName} • {selectedSpot.category}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontSize: '0.82rem', fontWeight: 800 }}>
                <Star size={14} fill="#f59e0b" />
                <span>{selectedSpot.rating}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
              {selectedSpot.name} <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>({selectedSpot.nameJp})</span>
            </h4>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {selectedSpot.desc}
            </p>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSpot.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span>상세 리뷰 & 영업시간</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};
