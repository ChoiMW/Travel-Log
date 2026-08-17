import React, { useState } from 'react';
import { ChevronRight, Plus, MapPin, Calendar, Sparkles, TrendingUp, Image as ImageIcon, ArrowUpRight, Compass, ShieldCheck } from 'lucide-react';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictFeatureProperties, CountryCode } from '../../../types/travel';
import { MapViewer } from '../../Map/MapViewer';
import { JapanMapViewer } from '../../Map/JapanMapViewer';

interface TossHomeViewProps {
  country?: CountryCode;
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  totalDistrictsCount: number;
  onSelectTrip: (trip: Trip) => void;
  onNewTrip: () => void;
  onSelectDistrict: (district: DistrictFeatureProperties) => void;
  onOpenPhoto: (photo: PhotoItem) => void;
}

export const TossHomeView: React.FC<TossHomeViewProps> = ({
  country = 'KR',
  trips,
  photos,
  visitedSummaryMap,
  totalDistrictsCount,
  onSelectTrip,
  onNewTrip,
  onSelectDistrict,
  onOpenPhoto,
}) => {
  const [showFullMap, setShowFullMap] = useState<boolean>(false);

  const isJapan = country === 'JP';
  const visitedCount = visitedSummaryMap.size;
  const conquestPercent = totalDistrictsCount > 0 ? ((visitedCount / totalDistrictsCount) * 100).toFixed(1) : '0.0';

  const topSdos = React.useMemo(() => {
    const sdoCountMap = new Map<string, number>();
    visitedSummaryMap.forEach(item => {
      const sdo = item.sdoName || '기타';
      sdoCountMap.set(sdo, (sdoCountMap.get(sdo) || 0) + 1);
    });
    return Array.from(sdoCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [visitedSummaryMap]);

  const brandColor = isJapan ? '#f43f5e' : '#3182f6';
  const brandBg = isJapan ? '#fff1f2' : '#e8f3ff';

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }}>
      {/* 1. 상단 토스 여행 자산 요약 배너 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '26px',
          padding: 'clamp(20px, 5vw, 28px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isJapan ? '🇯🇵 내 일본 여행 자산' : '🇰🇷 내 대한민국 여행 자산'}</span>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px 10px' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.3rem)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {visitedCount}곳
          </h1>
          <span style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: 800, color: brandColor }}>
            정복 중 ({conquestPercent}%)
          </span>
        </div>

        {/* 심플 프로그레스 바 */}
        <div style={{ background: 'var(--bg-hover)', height: '10px', borderRadius: '9999px', overflow: 'hidden', marginTop: '16px' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(Number(conquestPercent), 100)}%`,
              background: brandColor,
              borderRadius: '9999px',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span>{isJapan ? '일본 47개 도도부현 중' : '전국 250개 시·군·구 중'} {visitedCount}곳 완료</span>
          <span>전체 완주까지 {totalDistrictsCount - visitedCount}곳</span>
        </div>
      </div>

      {/* 2. 최근 여행 기록 피드 */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '26px',
          padding: '24px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            최근 {isJapan ? '일본' : '국내'} 여행
          </h3>
          {trips.length > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              총 {trips.length}회
            </span>
          )}
        </div>

        {trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{isJapan ? '🗾' : '🚗'}</div>
            <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.98rem' }}>
              아직 기록된 {isJapan ? '일본' : '국내'} 여행이 없어요
            </p>
            <p style={{ fontSize: '0.82rem', marginTop: '4px', marginBottom: '16px' }}>
              {isJapan ? '후쿠오카, 도쿄, 오사카 등 첫 일본 여행을 기록해보세요!' : '첫 번째 여행지를 기록하고 지도를 채워보세요!'}
            </p>
            <button
              className="btn btn-primary"
              onClick={onNewTrip}
              style={{ padding: '8px 18px', fontSize: '0.86rem', background: brandColor }}
            >
              <Plus size={16} />
              <span>{isJapan ? '일본 여행 기록하기' : '여행 기록하기'}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trips.slice(0, 4).map(trip => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '18px',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: trip.color || brandColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {trip.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {trip.startDate} • {trip.districtNames?.join(', ') || '지역'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 최근 사진 모아보기 그리드 */}
      {photos.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              여행의 순간들 📸
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {photos.length}장의 사진
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {photos.slice(0, 8).map(photo => (
              <div
                key={photo.id}
                onClick={() => onOpenPhoto(photo)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'var(--bg-hover)',
                }}
              >
                <img
                  src={photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '')}
                  alt={photo.fileName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. 지역별 정복 TOP 4 순위 */}
      {topSdos.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
            가장 많이 방문한 {isJapan ? '지방' : '시·도'} TOP
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topSdos.map(([sdo, count], rank) => (
              <div key={sdo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: rank < topSdos.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.96rem', fontWeight: 900, color: rank === 0 ? brandColor : '#8b95a1', width: '20px' }}>
                    {rank + 1}
                  </span>
                  <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {sdo}
                  </span>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: brandColor }}>
                  {count}{isJapan ? '개 도도부현' : '개 시·군·구'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 우측 하단 플로팅 토스 액션 버튼 */}
      <button
        onClick={onNewTrip}
        style={{
          position: 'fixed',
          bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          right: '20px',
          background: brandColor,
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          padding: '14px 22px',
          fontWeight: 800,
          fontSize: '0.95rem',
          boxShadow: `0 8px 24px ${isJapan ? 'rgba(244, 63, 94, 0.4)' : 'rgba(49, 130, 246, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          zIndex: 45,
          minHeight: '48px',
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={20} strokeWidth={2.8} />
        <span>{isJapan ? '일본 여행 기록하기' : '여행 기록하기'}</span>
      </button>
    </div>
  );
};
