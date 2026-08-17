import React, { useState } from 'react';
import { Sparkles, MapPin, Compass, Image as ImageIcon, Calendar, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictFeatureProperties } from '../../../types/travel';
import { MapViewer } from '../../Map/MapViewer';

interface BentoDashboardViewProps {
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  totalDistrictsCount: number;
  onSelectTrip: (trip: Trip) => void;
  onNewTrip: () => void;
  onSelectDistrict: (district: DistrictFeatureProperties) => void;
  onOpenPhoto: (photo: PhotoItem) => void;
}

export const BentoDashboardView: React.FC<BentoDashboardViewProps> = ({
  trips,
  photos,
  visitedSummaryMap,
  totalDistrictsCount,
  onSelectTrip,
  onNewTrip,
  onSelectDistrict,
  onOpenPhoto,
}) => {
  const visitedCount = visitedSummaryMap.size;
  const conquestPercent = totalDistrictsCount > 0 ? ((visitedCount / totalDistrictsCount) * 100).toFixed(1) : '0.0';
  const latestTrip = trips[0];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }}>
      {/* 1. 상단 다이나믹 아일랜드 캡슐 (Apple Style Floating Pill) */}
      <div
        style={{
          margin: '0 auto',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '9999px',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'white',
          boxShadow: '0 8px 30px rgba(0, 242, 254, 0.2)',
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }} />
        <span style={{ fontSize: '0.84rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          대한민국 <b>{visitedCount}개</b> 시·군·구 정복 ({conquestPercent}%)
        </span>
        {latestTrip && (
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
            최근: {latestTrip.districtNames?.[0] || latestTrip.title}
          </span>
        )}
      </div>

      {/* 2. 벤토 그리드 메인 레이아웃 (Bento Grid) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {/* 벤토 카드 1: 대형 인터랙티브 네온 지도 (와이드 2컬럼 차지 가능) */}
        <div
          style={{
            gridColumn: '1 / -1',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(18, 26, 47, 0.7)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <MapViewer
            trips={trips}
            photos={photos}
            visitedSummaryMap={visitedSummaryMap}
            onSelectTrip={onSelectTrip}
            onNewTripForDistrict={onSelectDistrict}
          />
        </div>

        {/* 벤토 카드 2: 3D 네온 정복률 게이지 위젯 */}
        <div
          style={{
            background: 'rgba(18, 26, 47, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe', fontWeight: 700, fontSize: '0.88rem' }}>
              <Zap size={18} />
              <span>정복률 매트릭스</span>
            </div>
            <span style={{ fontSize: '0.76rem', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '3px 8px', borderRadius: '9999px', fontWeight: 700 }}>
              LEVEL {Math.min(Math.floor(visitedCount / 5) + 1, 10)}
            </span>
          </div>

          <div style={{ margin: '20px 0' }}>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
              {conquestPercent}%
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
              전국 250개 행정구역 중 <b>{visitedCount}곳</b> 활성화
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '8px', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(Number(conquestPercent), 100)}%`,
                background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
                borderRadius: '9999px',
                boxShadow: '0 0 12px rgba(0, 242, 254, 0.5)',
              }}
            />
          </div>
        </div>

        {/* 벤토 카드 3: 최근 EXIF 캡처 갤러리 위젯 */}
        <div
          style={{
            background: 'rgba(18, 26, 47, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem' }}>
              <ImageIcon size={18} />
              <span>최근 캡처 사진</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              {photos.length}장 보관
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', margin: '14px 0' }}>
            {photos.slice(0, 4).map(photo => {
              const url = photo.thumbnailUrl || (photo.blob ? URL.createObjectURL(photo.blob) : '');
              return (
                <div
                  key={photo.id}
                  onClick={() => onOpenPhoto(photo)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <img src={url} alt={photo.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            })}
            {photos.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.8rem' }}>
                저장된 사진이 없습니다.
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.86rem' }}
            onClick={onNewTrip}
          >
            <Sparkles size={16} />
            <span>새 여행 기록 추가</span>
          </button>
        </div>
      </div>
    </div>
  );
};
