import React, { useState } from 'react';
import { ChevronRight, Plus, MapPin, Calendar, Sparkles, TrendingUp, Image as ImageIcon, ArrowUpRight, Compass, ShieldCheck } from 'lucide-react';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictFeatureProperties } from '../../../types/travel';
import { MapViewer } from '../../Map/MapViewer';

interface TossHomeViewProps {
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
          <span>내 대한민국 여행 자산</span>
        </div>

        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px 10px' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.3rem)', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            {visitedCount}곳
          </h1>
          <span style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: 800, color: 'var(--primary)' }}>
            정복 중 ({conquestPercent}%)
          </span>
        </div>

        {/* 토스 블루 심플 프로그레스 바 */}
        <div style={{ background: 'var(--bg-hover)', height: '10px', borderRadius: '9999px', overflow: 'hidden', marginTop: '16px' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(Number(conquestPercent), 100)}%`,
              background: '#3182f6',
              borderRadius: '9999px',
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>전국 250개 시·군·구</span>
          <span>남은 지역: {totalDistrictsCount - visitedCount}곳</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
          <button
            className="btn btn-subtle"
            style={{ borderRadius: '16px', padding: '12px', fontWeight: 800, background: 'var(--bg-hover)', color: 'var(--text-main)', minHeight: '48px' }}
            onClick={() => setShowFullMap(prev => !prev)}
          >
            {showFullMap ? '지도 접기' : '🗺️ 지도 크게보기'}
          </button>
          <button
            className="btn btn-primary"
            style={{ borderRadius: '16px', padding: '12px', fontWeight: 800, background: '#3182f6', minHeight: '48px' }}
            onClick={onNewTrip}
          >
            <Plus size={18} />
            <span>새 기록 추가</span>
          </button>
        </div>
      </div>

      {/* 2. 인터랙티브 지도 영역 */}
      {showFullMap && (
        <div style={{ borderRadius: '26px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <MapViewer
            trips={trips}
            photos={photos}
            visitedSummaryMap={visitedSummaryMap}
            onSelectTrip={onSelectTrip}
            onNewTripForDistrict={onSelectDistrict}
          />
        </div>
      )}

      {/* 3. 최근 다녀온 여행 내역 (토스 계좌/거래내역 스타일) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '26px',
          padding: 'clamp(18px, 5vw, 24px)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            여행 기록 내역
          </h3>
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            총 {trips.length}건
          </span>
        </div>

        {trips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>아직 기록된 여행이 없어요</p>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>사진을 올리면 1초 만에 여행이 기록됩니다.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 10px',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  minHeight: '60px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '16px',
                      background: trip.color ? `${trip.color}22` : '#3182f622',
                      color: trip.color || '#3182f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      flexShrink: 0,
                    }}
                  >
                    <MapPin size={22} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {trip.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                      {trip.startDate} • {trip.districtNames?.join(', ') || '지역'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {trip.rating && (
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b' }}>
                      ★ {trip.rating}.0
                    </span>
                  )}
                  <ChevronRight size={18} style={{ color: '#8b95a1' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. 내 여행 사진 모아보기 (가로 스크롤 카드) */}
      {photos.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            padding: 'clamp(18px, 5vw, 24px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              내 여행 갤러리
            </h3>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {photos.length}장 보관 중
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
            {photos.slice(0, 10).map(photo => {
              const url = photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '');
              return (
                <div
                  key={photo.id}
                  onClick={() => onOpenPhoto(photo)}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    cursor: 'pointer',
                    background: '#e5e8eb',
                    position: 'relative',
                  }}
                >
                  <img src={url} alt={photo.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {photo.districtName && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '3px 4px',
                        background: 'rgba(0,0,0,0.65)',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {photo.districtName.split(' ').pop()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 광역시도별 정복 랭킹 리스트 */}
      {topSdos.length > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '26px',
            padding: 'clamp(18px, 5vw, 24px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px' }}>
            가장 많이 방문한 지역
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topSdos.map(([sdo, count], rank) => (
              <div key={sdo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: rank < topSdos.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.96rem', fontWeight: 900, color: rank === 0 ? '#3182f6' : '#8b95a1', width: '20px' }}>
                    {rank + 1}
                  </span>
                  <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {sdo}
                  </span>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#3182f6' }}>
                  {count}개 시·군·구
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
          background: '#3182f6',
          color: 'white',
          border: 'none',
          borderRadius: '9999px',
          padding: '14px 22px',
          fontWeight: 800,
          fontSize: '0.95rem',
          boxShadow: '0 8px 24px rgba(49, 130, 246, 0.4)',
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
        <span>여행 기록하기</span>
      </button>
    </div>
  );
};
