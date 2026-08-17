import React, { useState, useMemo } from 'react';
import { Sparkles, MapPin, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, Plus } from 'lucide-react';
import districtsData from '../../data/koreaDistricts.json';
import { DistrictGeoJSONFeature, DistrictFeatureProperties, Trip, PhotoItem } from '../../types/travel';

const features = (districtsData.features as unknown) as DistrictGeoJSONFeature[];

interface PhotoMosaicMapViewProps {
  trips: Trip[];
  photos: PhotoItem[];
  onSelectTrip: (trip: Trip) => void;
  onNewTrip: () => void;
}

export const PhotoMosaicMapView: React.FC<PhotoMosaicMapViewProps> = ({
  trips,
  photos,
  onSelectTrip,
  onNewTrip,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictFeatureProperties | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictFeatureProperties | null>(null);

  // 시군구별 대표 사진 매핑 (실제 사진이 없으면 고화질 여행 데모 사진 자동 매칭)
  const districtPhotoMap = useMemo(() => {
    const map = new Map<string, string>();

    // 1. 실제 사용자가 올린 사진 매핑
    photos.forEach(p => {
      if (p.districtCode && !map.has(p.districtCode)) {
        const url = p.thumbnailUrl || (p.blob ? URL.createObjectURL(p.blob) : '');
        if (url) map.set(p.districtCode, url);
      }
    });

    // 2. 여행 기록이 있는 지역에 대표 사진이 없으면 데모 풍경 사진 배치
    const samplePhotos: Record<string, string> = {
      '26380': 'https://images.unsplash.com/photo-1578637387939-43c525550085?w=500&auto=format&fit=crop&q=60', // 부산 사하구
      '11680': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=500&auto=format&fit=crop&q=60', // 서울 강남구
      '50110': 'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=500&auto=format&fit=crop&q=60', // 제주시
      '42150': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=60', // 강원 강릉시
      '41135': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60', // 성남 분당구
      '47130': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&auto=format&fit=crop&q=60', // 경북 경주시
      '45111': 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=500&auto=format&fit=crop&q=60', // 전주 완산구
    };

    // 여행 기록된 지역에 매핑
    trips.forEach(t => {
      t.districtCodes.forEach(code => {
        if (!map.has(code)) {
          map.set(code, samplePhotos[code] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=60');
        }
      });
    });

    return map;
  }, [trips, photos]);

  const currentViewBox = useMemo(() => {
    const width = 800 / zoomLevel;
    const height = 1000 / zoomLevel;
    const minX = (800 - width) / 2 + panOffset.x;
    const minY = (1000 - height) / 2 + panOffset.y;
    return `${minX} ${minY} ${width} ${height}`;
  }, [zoomLevel, panOffset]);

  const photoCountOnMap = districtPhotoMap.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 상단 프로토타입 안내 배너 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: 'white',
          borderRadius: '26px',
          padding: '24px 28px',
          boxShadow: '0 12px 30px rgba(49, 46, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 800, color: '#a5b4fc' }}>
            <Sparkles size={16} />
            <span>PROTOTYPE 1 • PHOTO MOSAIC MAP</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: '4px', letterSpacing: '-0.02em' }}>
            내 사진으로 채워지는 250조각 대한민국 포토 퍼즐
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#c7d2fe', marginTop: '4px' }}>
            단순 단색 색칠 대신, 방문한 지역에 내가 찍은 실제 여행 사진이 시·군·구 모양대로 쏙 들어가 채워집니다.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '10px 18px', borderRadius: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>{photoCountOnMap} / 250</div>
            <div style={{ fontSize: '0.72rem', color: '#e0e7ff', fontWeight: 700 }}>사진 퍼즐 완성률</div>
          </div>
          <button className="btn btn-primary" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800 }} onClick={onNewTrip}>
            <Plus size={16} />
            <span>새 사진 조각 추가</span>
          </button>
        </div>
      </div>

      {/* 포토 모자이크 SVG 지도 */}
      <div
        style={{
          background: '#0f172a',
          borderRadius: '26px',
          overflow: 'hidden',
          position: 'relative',
          height: '620px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <svg
          style={{ width: '100%', height: '100%', userSelect: 'none' }}
          viewBox={currentViewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* SVG 패턴 정의 (시군구별 사진 클리핑) */}
          <defs>
            {Array.from(districtPhotoMap.entries()).map(([code, imgUrl]) => {
              const feat = features.find(f => f.properties.code === code);
              if (!feat || !feat.properties.center) return null;
              const cx = feat.properties.center.svgX || 400;
              const cy = feat.properties.center.svgY || 500;
              const size = 120;

              return (
                <pattern
                  key={`pat_${code}`}
                  id={`photo_pat_${code}`}
                  patternUnits="userSpaceOnUse"
                  width={size}
                  height={size}
                  x={cx - size / 2}
                  y={cy - size / 2}
                >
                  <image
                    href={imgUrl}
                    x="0"
                    y="0"
                    width={size}
                    height={size}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </pattern>
              );
            })}
          </defs>

          {/* 시군구 폴리곤 (사진 패턴 또는 기본 배경) */}
          <g>
            {features.map(feature => {
              const props = feature.properties;
              const hasPhoto = districtPhotoMap.has(props.code);
              const isHovered = hoveredDistrict?.code === props.code;
              const isSelected = selectedDistrict?.code === props.code;

              return (
                <path
                  key={props.code}
                  d={props.path}
                  fill={hasPhoto ? `url(#photo_pat_${props.code})` : '#1e293b'}
                  stroke={isSelected ? '#38bdf8' : hasPhoto ? '#f8fafc' : '#334155'}
                  strokeWidth={isSelected ? 2.5 : hasPhoto ? 1.2 : 0.6}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    filter: hasPhoto ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
                    opacity: hasPhoto || isHovered ? 1 : 0.6,
                  }}
                  onMouseEnter={() => setHoveredDistrict(props)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  onClick={() => setSelectedDistrict(props)}
                />
              );
            })}
          </g>

          {/* 지명 레이블 (사진 위 고해상도 아웃라인) */}
          <g style={{ pointerEvents: 'none' }}>
            {features.map(feature => {
              const props = feature.properties;
              if (!props.center?.svgX || !props.center?.svgY) return null;
              const hasPhoto = districtPhotoMap.has(props.code);

              return (
                <text
                  key={`txt_${props.code}`}
                  x={props.center.svgX}
                  y={props.center.svgY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: hasPhoto ? '5.5px' : '4px',
                    fontWeight: hasPhoto ? 900 : 600,
                    fill: hasPhoto ? '#ffffff' : '#64748b',
                    stroke: hasPhoto ? 'rgba(0, 0, 0, 0.85)' : '#0f172a',
                    strokeWidth: '1.5px',
                    paintOrder: 'stroke fill',
                    strokeLinejoin: 'round',
                  }}
                >
                  {props.name}
                </text>
              );
            })}
          </g>
        </svg>

        {/* 줌 컨트롤 */}
        <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="map-control-btn" onClick={() => setZoomLevel(prev => Math.min(prev * 1.4, 8))}>
            <ZoomIn size={18} />
          </button>
          <button className="map-control-btn" onClick={() => setZoomLevel(prev => Math.max(prev * 0.7, 0.8))}>
            <ZoomOut size={18} />
          </button>
          <button className="map-control-btn" onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}>
            <RotateCcw size={18} />
          </button>
        </div>

        {/* 호버/선택 팝업 카드 */}
        {hoveredDistrict && districtPhotoMap.has(hoveredDistrict.code) && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'white',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={districtPhotoMap.get(hoveredDistrict.code)}
              alt="preview"
              style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{hoveredDistrict.fullName}</div>
              <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                📸 포토 퍼즐 조각 활성화 완료
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
