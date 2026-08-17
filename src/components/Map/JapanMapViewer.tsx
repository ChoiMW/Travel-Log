import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Plus, Calendar, Image as ImageIcon,
  MapPin, Sparkles, Search, Eye, EyeOff, Download, X, Share2
} from 'lucide-react';
import japanData from '../../data/japanPrefectures.json';
import { JapanPrefectureProperties, Trip, VisitedDistrictSummary, PhotoItem, DistrictFeatureProperties } from '../../types/travel';
import { japanRegions, searchJapanPrefectures } from '../../utils/japanGeoMatcher';
import { GoogleMapsPilotViewer } from './GoogleMapsPilotViewer';

const features = (japanData.features as unknown) as { type: string; properties: JapanPrefectureProperties; geometry: { path: string } }[];

interface JapanMapViewerProps {
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  onSelectTrip: (trip: Trip) => void;
  onNewTripForDistrict: (district: DistrictFeatureProperties) => void;
}

const regionViewBoxes: Record<string, string> = {
  '전체 (47개 도도부현)': '-10 10 1120 890',
  '홋카이도 지방': '590 10 540 300',
  '도호쿠 지방': '580 230 220 310',
  '간토 지방': '560 460 200 210',
  '주부 지방': '440 450 200 200',
  '간사이 지방': '370 540 160 160',
  '주고쿠 지방': '210 540 180 140',
  '시코쿠 지방': '260 610 160 120',
  '규슈 지방': '20 580 280 270',
};

// 8대 지방 중심 메타데이터 (저배율 줌아웃 시 단일 캡슐 렌더링)
interface JapanRegionMeta {
  name: string;
  fullName: string;
  center: { svgX: number; svgY: number };
}

const JAPAN_REGION_METAS: JapanRegionMeta[] = [
  { name: '홋카이도', fullName: '홋카이도 지방', center: { svgX: 840, svgY: 150 } },
  { name: '도호쿠', fullName: '도호쿠 지방', center: { svgX: 690, svgY: 390 } },
  { name: '간토 (도쿄)', fullName: '간토 지방', center: { svgX: 640, svgY: 545 } },
  { name: '주부 (나고야)', fullName: '주부 지방', center: { svgX: 530, svgY: 545 } },
  { name: '간사이 (오사카)', fullName: '간사이 지방', center: { svgX: 430, svgY: 610 } },
  { name: '주고쿠 (히로시마)', fullName: '주고쿠 지방', center: { svgX: 300, svgY: 605 } },
  { name: '시코쿠', fullName: '시코쿠 지방', center: { svgX: 335, svgY: 660 } },
  { name: '규슈 (후쿠오카)', fullName: '규슈 지방', center: { svgX: 180, svgY: 700 } },
];

type ExportTemplate = 'story' | 'toss' | 'passport';

export const JapanMapViewer: React.FC<JapanMapViewerProps> = ({
  trips,
  photos,
  visitedSummaryMap,
  onSelectTrip,
  onNewTripForDistrict,
}) => {
  const [viewMode, setViewMode] = useState<'vector' | 'google'>('vector');
  const [selectedRegion, setSelectedRegion] = useState<string>('전체 (47개 도도부현)');
  const [selectedPrefCode, setSelectedPrefCode] = useState<string | null>(null);
  const [hoveredPref, setHoveredPref] = useState<JapanPrefectureProperties | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchResults = useMemo(() => searchJapanPrefectures(searchQuery), [searchQuery]);

  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportTemplate, setExportTemplate] = useState<ExportTemplate>('story');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedFeature = useMemo(() => {
    if (!selectedPrefCode) return null;
    return features.find(f => f.properties.code === selectedPrefCode) || null;
  }, [selectedPrefCode]);

  const selectedDistrictTrips = useMemo(() => {
    if (!selectedPrefCode) return [];
    return trips.filter(t => t.districtCodes.includes(selectedPrefCode));
  }, [selectedPrefCode, trips]);

  const selectedDistrictPhotos = useMemo(() => {
    if (!selectedPrefCode) return [];
    return photos.filter(p => p.districtCode === selectedPrefCode);
  }, [selectedPrefCode, photos]);

  const currentViewBox = useMemo(() => {
    const baseBox = regionViewBoxes[selectedRegion] || regionViewBoxes['전체 (47개 도도부현)'];
    const [minX, minY, width, height] = baseBox.split(' ').map(Number);
    
    const scaledWidth = width / zoomLevel;
    const scaledHeight = height / zoomLevel;
    const offsetX = panOffset.x;
    const offsetY = panOffset.y;

    return `${minX + (width - scaledWidth) / 2 + offsetX} ${minY + (height - scaledHeight) / 2 + offsetY} ${scaledWidth} ${scaledHeight}`;
  }, [selectedRegion, zoomLevel, panOffset]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoom = (factor: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev * factor, 0.6), 18.0));
  };

  const handleResetZoom = () => {
    setSelectedRegion('전체 (47개 도도부현)');
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedPrefCode(null);
  };

  const handlePrefClick = (pref: JapanPrefectureProperties) => {
    setSelectedPrefCode(pref.code);
  };

  const handleRegionClusterClick = (reg: JapanRegionMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    handleRegionChange(reg.fullName);
  };

  const handleSelectSearchResult = (pref: JapanPrefectureProperties) => {
    setSelectedPrefCode(pref.code);
    setSelectedRegion(pref.regionName);
    setZoomLevel(2.0);
    setPanOffset({ x: 0, y: 0 });
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.25 : 0.8;
    setZoomLevel(prev => Math.min(Math.max(prev * factor, 0.6), 18.0));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) * (1000 / (containerRef.current?.clientWidth || 1000)) / zoomLevel;
      const dy = (e.clientY - dragStart.y) * (1000 / (containerRef.current?.clientHeight || 1000)) / zoomLevel;
      setPanOffset(prev => ({ x: prev.x - dx, y: prev.y - dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isJapanOverview = (selectedRegion === '전체 (47개 도도부현)' && zoomLevel < 1.7);

  const dynamicFontSize = useMemo(() => {
    const baseBox = regionViewBoxes[selectedRegion] || regionViewBoxes['전체 (47개 도도부현)'];
    const [, , width] = baseBox.split(' ').map(Number);
    const viewWidth = width / zoomLevel;
    if (viewWidth < 80) return 3.0;
    if (viewWidth < 180) return 5.5;
    if (viewWidth < 350) return 8.5;
    return 12.0;
  }, [selectedRegion, zoomLevel]);

  // 일본 3종 소셜 맵 카드 다운로드
  const handleDownloadSocialCard = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (exportTemplate === 'story') {
          canvas.width = 1080;
          canvas.height = 1920;

          const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
          gradient.addColorStop(0, '#0f172a');
          gradient.addColorStop(1, '#1e293b');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1080, 1920);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText('TRAVEL LOG JAPAN', 80, 160);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 68px sans-serif';
          ctx.fillText('나의 일본 도도부현 여행 지도', 80, 240);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 34px sans-serif';
          ctx.fillText(`일본 47개 도도부현 중 ${visitedSummaryMap.size}곳 정복 (${((visitedSummaryMap.size / 47) * 100).toFixed(1)}%)`, 80, 300);

          ctx.drawImage(image, 90, 360, 900, 1125);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.roundRect(80, 1560, 920, 180, 30);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 42px sans-serif';
          ctx.fillText(`🗾 일본 누적 여행 ${trips.length}회 • 사진 ${photos.length}장 아카이빙`, 130, 1665);

        } else if (exportTemplate === 'toss') {
          canvas.width = 1200;
          canvas.height = 1200;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1200, 1200);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 40px sans-serif';
          ctx.fillText('TravelLog Japan', 80, 120);

          ctx.fillStyle = '#191f28';
          ctx.font = '900 72px sans-serif';
          ctx.fillText('일본 47개 도도부현 자산', 80, 210);

          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 80px sans-serif';
          ctx.fillText(`${((visitedSummaryMap.size / 47) * 100).toFixed(1)}%`, 80, 310);

          ctx.drawImage(image, 250, 340, 700, 875);

        } else {
          canvas.width = 1200;
          canvas.height = 1600;

          ctx.fillStyle = '#881337';
          ctx.fillRect(0, 0, 1200, 1600);

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 12;
          ctx.strokeRect(40, 40, 1120, 1520);

          ctx.fillStyle = '#fef3c7';
          ctx.font = '900 64px serif';
          ctx.textAlign = 'center';
          ctx.fillText('일본 도도부현 정복 증명서', 600, 180);

          ctx.font = 'bold 36px serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`방문 도도부현: ${visitedSummaryMap.size} / 47개 지역 완료`, 600, 250);

          ctx.drawImage(image, 150, 320, 900, 1125);
          ctx.textAlign = 'left';
        }

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `japan_travel_map_${exportTemplate}_${Date.now()}.png`;
        link.href = pngUrl;
        link.click();
        URL.revokeObjectURL(blobURL);
        setIsExporting(false);
        setIsExportModalOpen(false);
      };
      image.src = blobURL;
    } catch (err) {
      console.error(err);
      alert('이미지 생성 중 오류가 발생했습니다.');
      setIsExporting(false);
    }
  };

  const totalCount = 47;
  const visitedCount = visitedSummaryMap.size;
  const visitPercent = ((visitedCount / totalCount) * 100).toFixed(1);

  const selectedSummary = selectedFeature ? visitedSummaryMap.get(selectedFeature.properties.code) : null;
  const selectedThumbnailPhoto = selectedDistrictPhotos[0];

  return (
    <div className="map-viewer-container" ref={containerRef}>
      {/* 1. 최상단 뷰 모드 스위처 (정밀 벡터 지도 ↔ 구글 맵스 라이브) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-surface)',
            padding: '4px',
            borderRadius: '9999px',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)',
            gap: '4px',
          }}
        >
          <button
            onClick={() => setViewMode('vector')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              background: viewMode === 'vector' ? '#f43f5e' : 'transparent',
              color: viewMode === 'vector' ? 'white' : 'var(--text-muted)',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🗾</span>
            <span>정밀 벡터 정복 지도</span>
          </button>

          <button
            onClick={() => setViewMode('google')}
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              border: 'none',
              background: viewMode === 'google' ? '#4285F4' : 'transparent',
              color: viewMode === 'google' ? 'white' : 'var(--text-muted)',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🌐</span>
            <span>Google Maps 라이브 (파일럿)</span>
          </button>
        </div>
      </div>

      {viewMode === 'google' ? (
        <GoogleMapsPilotViewer initialPrefCode={selectedPrefCode || 'JP-40'} />
      ) : (
        <>
          {/* 좌측: 메인 일본 지도 캔버스 */}
          <div className="map-main-canvas">
            {/* 상단 툴바 */}
            <div className="map-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                <select
                  className="map-sdo-select"
                  value={selectedRegion}
                  onChange={e => handleRegionChange(e.target.value)}
                >
                  {japanRegions.map(reg => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>

            {/* 일본 도도부현 검색창 */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-hover)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  gap: '6px',
                }}
              >
                <Search size={15} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="도도부현 검색 (도쿄, 오사카, Tokyo)"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.84rem',
                    color: 'var(--text-main)',
                    width: '180px',
                  }}
                />
              </div>

              {isSearchOpen && searchQuery && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '6px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    zIndex: 50,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    minWidth: '220px',
                  }}
                >
                  {searchResults.slice(0, 8).map(dist => {
                    const isVisited = visitedSummaryMap.has(dist.code);
                    return (
                      <div
                        key={dist.code}
                        onClick={() => handleSelectSearchResult(dist)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--border-light)',
                          fontSize: '0.86rem',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} style={{ color: isVisited ? '#f43f5e' : 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 700 }}>{dist.fullName} ({dist.nameJa})</span>
                        </div>
                        {isVisited && (
                          <span style={{ fontSize: '0.72rem', background: '#ffe4e6', color: '#f43f5e', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                            방문 완료
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '6px 10px', borderRadius: '9999px' }}>
              🔍 {zoomLevel.toFixed(1)}x 확대
            </span>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f43f5e', background: '#ffe4e6', padding: '6px 12px', borderRadius: '9999px' }}>
              {visitedCount} / {totalCount} ({visitPercent}%)
            </span>
          </div>
        </div>

        {/* SVG 지도 캔버스 */}
        <div
          className="svg-map-wrapper"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => setIsSearchOpen(false)}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoveredPref(null);
          }}
          style={{ cursor: isDragging ? 'grabbing' : 'grab', position: 'relative' }}
        >
          {/* 플로팅 글래스 메모리 카드 */}
          {selectedFeature && selectedSummary && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 30,
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(16px)',
                borderRadius: '20px',
                padding: '12px 16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                maxWidth: '360px',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {selectedThumbnailPhoto ? (
                <img
                  src={selectedThumbnailPhoto.thumbnailUrl || (selectedThumbnailPhoto.blob ? URL.createObjectURL(selectedThumbnailPhoto.blob) : '')}
                  alt="preview"
                  style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#f43f5e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                  🗾
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.74rem', color: '#f43f5e', fontWeight: 800 }}>
                  {selectedSummary.visitCount}회 방문 • {selectedSummary.latestVisitDate}
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSummary.fullName} ({selectedFeature.properties.nameJa})
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSummary.latestTripTitle}
                </div>
              </div>

              <button
                onClick={() => setSelectedPrefCode(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <svg
            ref={svgRef}
            className="korea-svg-map"
            viewBox={currentViewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 1. 일본 47개 도도부현 폴리곤 */}
            <g>
              {features.map(feature => {
                const props = feature.properties;
                const summary = visitedSummaryMap.get(props.code);
                const isVisited = !!summary;
                const isSelected = selectedPrefCode === props.code;
                const fillColor = isVisited ? (summary.color || '#f43f5e') : '#e2e8f0';

                return (
                  <path
                    key={props.code}
                    d={props.path || feature.geometry.path}
                    className={`district-path ${isVisited ? 'visited' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{
                      fill: fillColor,
                      stroke: '#ffffff',
                      strokeWidth: '2',
                      opacity: selectedRegion === '전체 (47개 도도부현)' || props.regionName === selectedRegion ? 1 : 0.22,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      handlePrefClick(props);
                    }}
                    onMouseEnter={() => setHoveredPref(props)}
                  />
                );
              })}
            </g>

            {/* 2. [계층형 줌 1단계] 8대 지방 대표 라벨 */}
            {showLabels && isJapanOverview && (
              <g className="japan-region-labels">
                {JAPAN_REGION_METAS.map(reg => {
                  const regDistricts = features.filter(f => f.properties.regionName === reg.fullName);
                  const totalInReg = regDistricts.length;
                  const visitedInReg = regDistricts.filter(f => visitedSummaryMap.has(f.properties.code)).length;
                  const hasVisited = visitedInReg > 0;
                  const isAllVisited = visitedInReg === totalInReg && totalInReg > 0;

                  return (
                    <g
                      key={`reg_${reg.name}`}
                      transform={`translate(${reg.center.svgX}, ${reg.center.svgY})`}
                      onClick={e => handleRegionClusterClick(reg, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x="-48"
                        y="-15"
                        width="96"
                        height="30"
                        rx="15"
                        fill={isAllVisited ? '#10b981' : hasVisited ? '#f43f5e' : '#1e293b'}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        filter="drop-shadow(0 4px 8px rgba(0,0,0,0.35))"
                      />
                      <text
                        x="0"
                        y="1.5"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: '11px',
                          fontWeight: 900,
                          fill: '#ffffff',
                          letterSpacing: '-0.02em',
                          userSelect: 'none',
                        }}
                      >
                        {reg.name} {hasVisited ? `(${visitedInReg}/${totalInReg})` : `(${totalInReg}현)`}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 3. [계층형 줌 2단계] 47개 세부 도도부현 지명 */}
            {showLabels && !isJapanOverview && (
              <g className="district-labels" style={{ pointerEvents: 'none' }}>
                {features.map(feature => {
                  const props = feature.properties;
                  const posX = props.svgCenter ? props.svgCenter[0] : (props.center?.svgX || 0);
                  const posY = props.svgCenter ? props.svgCenter[1] : (props.center?.svgY || 0);
                  if (!posX || !posY) return null;
                  if (selectedRegion !== '전체 (47개 도도부현)' && props.regionName !== selectedRegion) return null;

                  const isVisited = visitedSummaryMap.has(props.code);
                  const isSelected = selectedPrefCode === props.code;

                  return (
                    <text
                      key={`lbl_${props.code}`}
                      x={posX}
                      y={posY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: `${isSelected ? dynamicFontSize * 1.3 : dynamicFontSize}px`,
                        fontWeight: isSelected ? 900 : isVisited ? 800 : 700,
                        fill: isVisited ? '#ffffff' : '#191f28',
                        stroke: isVisited ? 'rgba(0,0,0,0.7)' : '#ffffff',
                        strokeWidth: `${Math.max(0.6, dynamicFontSize * 0.38)}px`,
                        paintOrder: 'stroke fill',
                        strokeLinejoin: 'round',
                        letterSpacing: '-0.02em',
                        userSelect: 'none',
                      }}
                    >
                      {props.name}
                    </text>
                  );
                })}
              </g>
            )}
          </svg>

          {/* 호버 툴팁 */}
          {hoveredPref && (
            <div
              className="map-tooltip"
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                {hoveredPref.fullName} ({hoveredPref.nameJa})
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {hoveredPref.regionName} • {hoveredPref.nameRomaji}
              </div>
              {visitedSummaryMap.has(hoveredPref.code) ? (
                <div style={{ fontSize: '0.78rem', color: '#f43f5e', marginTop: '2px', fontWeight: 700 }}>
                  ✓ {visitedSummaryMap.get(hoveredPref.code)?.visitCount}회 방문 (최근: {visitedSummaryMap.get(hoveredPref.code)?.latestVisitDate})
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                  {isJapanOverview ? '클릭 시 해당 지방으로 확대' : '클릭하여 여행 기록 추가'}
                </div>
              )}
            </div>
          )}

          {/* 플로팅 컨트롤 */}
          <div className="map-controls">
            <button
              className="map-control-btn"
              onClick={() => setIsExportModalOpen(true)}
              title="일본 여행 정복 맵 카드 저장 (인스타/토스/여권)"
            >
              <Share2 size={18} />
            </button>
            <button
              className="map-control-btn"
              onClick={() => setShowLabels(prev => !prev)}
              title={showLabels ? '지명 숨기기' : '지명 표시'}
              style={{ color: showLabels ? '#f43f5e' : 'inherit' }}
            >
              {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button className="map-control-btn" onClick={() => handleZoom(1.4)} title="확대">
              <ZoomIn size={18} />
            </button>
            <button className="map-control-btn" onClick={() => handleZoom(0.7)} title="축소">
              <ZoomOut size={18} />
            </button>
            <button className="map-control-btn" onClick={handleResetZoom} title="일본 지도 초기화">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 우측: 선택된 일본 지역 상세 패널 */}
      <div className="map-side-panel">
        <div className="side-panel-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {selectedFeature ? `${selectedFeature.properties.fullName} (${selectedFeature.properties.nameJa})` : '일본 지역을 선택해주세요'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selectedFeature
                ? visitedSummaryMap.has(selectedFeature.properties.code)
                  ? `총 ${visitedSummaryMap.get(selectedFeature.properties.code)?.visitCount}번의 여행 기록이 있습니다.`
                  : '아직 기록된 여행이 없습니다. 첫 번째 일본 여행을 기록해보세요!'
                : '지도에서 도쿄, 오사카, 후쿠오카 등 47개 도도부현을 클릭해보세요.'}
            </p>
          </div>

          {selectedFeature && (
            <button
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.86rem', background: '#f43f5e' }}
              onClick={() => {
                onNewTripForDistrict({
                  code: selectedFeature.properties.code,
                  name: selectedFeature.properties.name,
                  fullName: selectedFeature.properties.fullName,
                  sdoName: selectedFeature.properties.regionName,
                  path: selectedFeature.properties.path,
                  country: 'JP',
                });
              }}
            >
              <Plus size={16} />
              <span>기록 추가</span>
            </button>
          )}
        </div>

        <div className="side-panel-body">
          {!selectedFeature ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗾</div>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                일본 어디를 다녀오셨나요?
              </p>
              <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                도쿄, 오사카, 후쿠오카, 삿포로 등 47개 도도부현을 정복해보세요.
              </p>
            </div>
          ) : selectedDistrictTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Sparkles size={36} style={{ margin: '0 auto 10px', color: '#f43f5e' }} />
              <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {selectedFeature.properties.name} 여행 기록이 없습니다
              </p>
              <p style={{ fontSize: '0.84rem', marginTop: '6px', marginBottom: '16px' }}>
                이 지역에서 찍은 사진을 올리면 촬영 날짜와 위치를 분석해 자동으로 기록을 만들어 드립니다.
              </p>
              <button
                className="btn btn-outline"
                onClick={() => {
                  onNewTripForDistrict({
                    code: selectedFeature.properties.code,
                    name: selectedFeature.properties.name,
                    fullName: selectedFeature.properties.fullName,
                    sdoName: selectedFeature.properties.regionName,
                    path: selectedFeature.properties.path,
                    country: 'JP',
                  });
                }}
              >
                <Plus size={16} />
                <span>{selectedFeature.properties.name} 여행 기록하기</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDistrictTrips.map(trip => (
                <div
                  key={trip.id}
                  onClick={() => onSelectTrip(trip)}
                  style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: '18px',
                    padding: '16px',
                    cursor: 'pointer',
                    borderLeft: `5px solid ${trip.color || '#f43f5e'}`,
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {trip.title}
                    </h4>
                    {trip.rating && (
                      <span style={{ fontSize: '0.86rem', color: '#f59e0b', fontWeight: 700 }}>
                        ★ {trip.rating}.0
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Calendar size={13} />
                    <span>
                      {trip.startDate} {trip.startDate !== trip.endDate ? `~ ${trip.endDate}` : ''}
                    </span>
                  </div>

                  {trip.memo && (
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '8px', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {trip.memo}
                    </p>
                  )}
                </div>
              ))}

              {selectedDistrictPhotos.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700, marginBottom: '8px' }}>
                    <ImageIcon size={16} />
                    <span>{selectedFeature.properties.name} 사진 ({selectedDistrictPhotos.length}장)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px' }}>
                    {selectedDistrictPhotos.slice(0, 8).map(photo => (
                      <div
                        key={photo.id}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#cbd5e1',
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
            </div>
          )}
        </div>
      </div>

      {/* 3종 소셜 템플릿 카드 생성 모달 */}
      {isExportModalOpen && (
        <div className="modal-backdrop" style={{ background: 'rgba(0,0,0,0.8)', zIndex: 120 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '28px',
              padding: '26px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                📸 일본 여행 공유 맵 카드 만들기
              </h3>
              <button className="btn-icon" onClick={() => setIsExportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '-8px' }}>
              내 일본 47개 도도부현 여행 지도를 인스타그램 스토리나 예쁜 카드 형태로 1초 만에 저장하세요.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                onClick={() => setExportTemplate('story')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '18px',
                  border: exportTemplate === 'story' ? '2px solid #f43f5e' : '1px solid #e2e8f0',
                  background: exportTemplate === 'story' ? '#fff1f2' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📱</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>인스타 스토리</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>9:16 세로형</span>
              </button>

              <button
                onClick={() => setExportTemplate('toss')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '18px',
                  border: exportTemplate === 'toss' ? '2px solid #f43f5e' : '1px solid #e2e8f0',
                  background: exportTemplate === 'toss' ? '#fff1f2' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🔴</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>토스 미니멀</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>1:1 정사각</span>
              </button>

              <button
                onClick={() => setExportTemplate('passport')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '18px',
                  border: exportTemplate === 'passport' ? '2px solid #f43f5e' : '1px solid #e2e8f0',
                  background: exportTemplate === 'passport' ? '#fff1f2' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📜</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>여권 증명서</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>클래식 버건디</span>
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', fontSize: '0.84rem', color: '#475569' }}>
              {exportTemplate === 'story' && '✨ 인스타그램 스토리(9:16)에 최적화된 다크 모던 테마로, 일본 정복률과 지도가 한눈에 들어옵니다.'}
              {exportTemplate === 'toss' && '✨ 깔끔하고 세련된 1:1 카드 형태로 피드 게시물에 적합합니다.'}
              {exportTemplate === 'passport' && '✨ 일본 공식 정복 인증서 느낌의 버건디 프레임과 정복 뱃지가 포함된 고급 증명서입니다.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-subtle" onClick={() => setIsExportModalOpen(false)}>닫기</button>
              <button
                className="btn btn-primary"
                style={{ padding: '12px 20px', fontSize: '0.92rem', fontWeight: 800, background: '#f43f5e' }}
                onClick={handleDownloadSocialCard}
                disabled={isExporting}
              >
                <Download size={18} />
                <span>{isExporting ? '카드 렌더링 중...' : '고화질 PNG 다운로드'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
