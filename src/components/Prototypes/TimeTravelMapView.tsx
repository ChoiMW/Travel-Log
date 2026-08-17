import React, { useState, useMemo } from 'react';
import { Calendar, Sparkles, Filter, Sun, CloudRain, Snowflake, Flower2, Clock } from 'lucide-react';
import { Trip, PhotoItem, DistrictFeatureProperties } from '../../types/travel';
import districtsData from '../../data/koreaDistricts.json';

const features = districtsData.features;

interface TimeTravelMapViewProps {
  trips: Trip[];
  photos: PhotoItem[];
  onSelectTrip: (trip: Trip) => void;
}

type Season = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';

export const TimeTravelMapView: React.FC<TimeTravelMapViewProps> = ({
  trips,
  photos,
  onSelectTrip,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<Season>('all');

  // 존재하는 연도 목록 추출
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    trips.forEach(t => {
      const yr = t.startDate?.split('-')[0];
      if (yr) years.add(yr);
    });
    if (years.size === 0) {
      years.add('2024');
      years.add('2025');
      years.add('2026');
    }
    return Array.from(years).sort();
  }, [trips]);

  // 계절 판별 함수 (3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울)
  const getSeason = (dateStr: string): Season => {
    if (!dateStr) return 'spring';
    const month = parseInt(dateStr.split('-')[1], 10);
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  };

  // 필터링된 여행 목록
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const yr = t.startDate?.split('-')[0];
      const season = getSeason(t.startDate);

      if (selectedYear !== 'all' && yr !== selectedYear) return false;
      if (selectedSeason !== 'all' && season !== selectedSeason) return false;
      return true;
    });
  }, [trips, selectedYear, selectedSeason]);

  // 필터링된 활성 시군구 코드 집합
  const activeDistrictCodes = useMemo(() => {
    const set = new Set<string>();
    filteredTrips.forEach(t => {
      t.districtCodes.forEach(code => set.add(code));
    });
    return set;
  }, [filteredTrips]);

  // 계절별 테마 컬러
  const getSeasonTheme = () => {
    switch (selectedSeason) {
      case 'spring': return { color: '#ec4899', name: '🌸 화사한 봄꽃 여행지', bg: '#fdf2f8' };
      case 'summer': return { color: '#0284c7', name: '🌊 시원한 여름 바다/계곡', bg: '#f0f9ff' };
      case 'autumn': return { color: '#f59e0b', name: '🍁 낭만 가득 가을 단풍 여행', bg: '#fffbeb' };
      case 'winter': return { color: '#6366f1', name: '❄️ 눈꽃과 온천의 겨울 여행', bg: '#eef2ff' };
      default: return { color: '#3182f6', name: '✨ 전체 사계절 여행 타임라인', bg: '#f2f4f6' };
    }
  };

  const theme = getSeasonTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* 상단 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 800, color: theme.color }}>
            <Clock size={16} />
            <span>PROTOTYPE A • TIME-TRAVEL & 4-SEASONS MAP</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
            사계절 & 연도별 타임슬립 여행 지도
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: '2px' }}>
            슬라이더를 움직여 내가 작년 봄, 지난 여름에 다녀온 곳들을 시간 여행하듯 회상해 보세요.
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: theme.color }}>{activeDistrictCodes.size}곳</div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>해당 시기 방문지</div>
        </div>
      </div>

      {/* 시간 & 계절 컨트롤러 바 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '22px',
          padding: '18px 24px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* 1. 연도 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            🗓️ 여행 연도 선택
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedYear('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '12px',
                border: 'none',
                background: selectedYear === 'all' ? '#191f28' : 'var(--bg-hover)',
                color: selectedYear === 'all' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              전체 연도
            </button>
            {availableYears.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: selectedYear === yr ? '#3182f6' : 'var(--bg-hover)',
                  color: selectedYear === yr ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                {yr}년
              </button>
            ))}
          </div>
        </div>

        {/* 2. 사계절 선택 버튼 휠 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            🍂 사계절 필터
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSelectedSeason('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: 'none',
                background: selectedSeason === 'all' ? '#191f28' : 'var(--bg-hover)',
                color: selectedSeason === 'all' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              전체 계절
            </button>
            <button
              onClick={() => setSelectedSeason('spring')}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: 'none',
                background: selectedSeason === 'spring' ? '#ec4899' : 'var(--bg-hover)',
                color: selectedSeason === 'spring' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🌸 봄
            </button>
            <button
              onClick={() => setSelectedSeason('summer')}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: 'none',
                background: selectedSeason === 'summer' ? '#0284c7' : 'var(--bg-hover)',
                color: selectedSeason === 'summer' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🌊 여름
            </button>
            <button
              onClick={() => setSelectedSeason('autumn')}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: 'none',
                background: selectedSeason === 'autumn' ? '#f59e0b' : 'var(--bg-hover)',
                color: selectedSeason === 'autumn' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              🍁 가을
            </button>
            <button
              onClick={() => setSelectedSeason('winter')}
              style={{
                padding: '6px 12px',
                borderRadius: '12px',
                border: 'none',
                background: selectedSeason === 'winter' ? '#6366f1' : 'var(--bg-hover)',
                color: selectedSeason === 'winter' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              ❄️ 겨울
            </button>
          </div>
        </div>
      </div>

      {/* 타임슬립 인터랙티브 SVG 지도 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '26px',
          overflow: 'hidden',
          position: 'relative',
          height: '520px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
        }}
      >
        <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 800 1000">
          <g>
            {features.map((f: any) => {
              const code = f.properties.code;
              const isActive = activeDistrictCodes.has(code);

              return (
                <path
                  key={code}
                  d={f.properties.path}
                  fill={isActive ? theme.color : '#e2e8f0'}
                  stroke="#ffffff"
                  strokeWidth={isActive ? 1.2 : 0.6}
                  style={{
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    filter: isActive ? `drop-shadow(0 0 6px ${theme.color}88)` : 'none',
                    opacity: isActive ? 1 : 0.4,
                  }}
                />
              );
            })}
          </g>
        </svg>

        {/* 하단 현재 타임슬립 상태 뱃지 */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(25, 31, 40, 0.88)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            borderRadius: '9999px',
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.color }} />
          <span>{selectedYear === 'all' ? '전체 기간' : `${selectedYear}년`} • {theme.name}</span>
        </div>
      </div>
    </div>
  );
};
