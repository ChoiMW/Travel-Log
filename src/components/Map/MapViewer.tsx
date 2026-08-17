import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Plus, Calendar, Image as ImageIcon,
  MapPin, Sparkles, Search, Eye, EyeOff, Download, Maximize2, X,
  Share2, Check, Star, ArrowRight, Layers, FileImage, MousePointerClick
} from 'lucide-react';
import districtsData from '../../data/koreaDistricts.json';
import { DistrictGeoJSONFeature, DistrictFeatureProperties, Trip, VisitedDistrictSummary, PhotoItem } from '../../types/travel';
import { sdoList, searchDistricts } from '../../utils/geoMatcher';

const features = (districtsData.features as unknown) as DistrictGeoJSONFeature[];

interface MapViewerProps {
  trips: Trip[];
  photos: PhotoItem[];
  visitedSummaryMap: Map<string, VisitedDistrictSummary>;
  onSelectTrip: (trip: Trip) => void;
  onNewTripForDistrict: (district: DistrictFeatureProperties) => void;
}

const sdoViewBoxes: Record<string, string> = {
  '전국': '0 0 800 1000',
  '서울특별시': '205 155 135 115',
  '경기도': '170 120 220 210',
  '부산광역시': '530 635 150 140',
  '대구광역시': '490 490 170 150',
  '인천광역시': '135 140 180 160',
  '광주광역시': '210 610 150 140',
  '대전광역시': '315 400 140 130',
  '울산광역시': '580 570 150 140',
  '세종특별자치시': '295 360 120 110',
  '강원특별자치도': '330 60 380 340',
  '충청북도': '280 260 280 280',
  '충청남도': '160 330 280 260',
  '전라북도': '190 470 280 240',
  '전라남도': '140 610 360 300',
  '경상북도': '430 330 360 360',
  '경상남도': '360 580 360 300',
  '제주특별자치도': '160 840 280 160',
};

// =========================================================================
// [계층형 줌 핵심 1] 17개 광역시·도 대표 메타데이터 & 중심 좌표
// =========================================================================
interface SdoMeta {
  name: string;
  fullName: string;
  center: { svgX: number; svgY: number };
}

const SDO_METAS: SdoMeta[] = [
  { name: '서울', fullName: '서울특별시', center: { svgX: 255, svgY: 215 } },
  { name: '경기도', fullName: '경기도', center: { svgX: 280, svgY: 260 } },
  { name: '인천', fullName: '인천광역시', center: { svgX: 195, svgY: 220 } },
  { name: '강원도', fullName: '강원특별자치도', center: { svgX: 470, svgY: 200 } },
  { name: '충북', fullName: '충청북도', center: { svgX: 400, svgY: 370 } },
  { name: '충남', fullName: '충청남도', center: { svgX: 260, svgY: 420 } },
  { name: '대전', fullName: '대전광역시', center: { svgX: 345, svgY: 450 } },
  { name: '세종', fullName: '세종특별자치시', center: { svgX: 330, svgY: 395 } },
  { name: '전북', fullName: '전라북도', center: { svgX: 300, svgY: 560 } },
  { name: '전남', fullName: '전라남도', center: { svgX: 260, svgY: 720 } },
  { name: '광주', fullName: '광주광역시', center: { svgX: 235, svgY: 675 } },
  { name: '경북', fullName: '경상북도', center: { svgX: 560, svgY: 450 } },
  { name: '대구', fullName: '대구광역시', center: { svgX: 535, svgY: 535 } },
  { name: '경남', fullName: '경상남도', center: { svgX: 480, svgY: 680 } },
  { name: '울산', fullName: '울산광역시', center: { svgX: 625, svgY: 615 } },
  { name: '부산', fullName: '부산광역시', center: { svgX: 585, svgY: 685 } },
  { name: '제주도', fullName: '제주특별자치도', center: { svgX: 240, svgY: 910 } },
];

function formatDisplayDistrictName(rawName: string): string {
  let name = rawName;
  const cityPrefixes = ['수원시', '성남시', '안양시', '안산시', '고양시', '용인시', '청주시', '천안시', '전주시', '포항시', '창원시'];
  for (const prefix of cityPrefixes) {
    if (name.startsWith(prefix)) {
      return name.replace(prefix, '');
    }
  }
  return name;
}

type ExportTemplate = 'story' | 'toss' | 'passport';

export const MapViewer: React.FC<MapViewerProps> = ({
  trips,
  photos,
  visitedSummaryMap,
  onSelectTrip,
  onNewTripForDistrict,
}) => {
  const [selectedSdo, setSelectedSdo] = useState<string>('전국');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictFeatureProperties | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const searchResults = useMemo(() => searchDistricts(searchQuery), [searchQuery]);

  const [showLabels, setShowLabels] = useState<boolean>(true);

  // 🚀 슈퍼 줌(Super Zoom) 시스템: 최대 18배 지원
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // [4단계] 3종 소셜 카드 내보내기 모달 상태
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportTemplate, setExportTemplate] = useState<ExportTemplate>('story');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedFeature = useMemo(() => {
    if (!selectedDistrictCode) return null;
    return features.find(f => f.properties.code === selectedDistrictCode) || null;
  }, [selectedDistrictCode]);

  const selectedDistrictTrips = useMemo(() => {
    if (!selectedDistrictCode) return [];
    return trips.filter(t => t.districtCodes.includes(selectedDistrictCode));
  }, [selectedDistrictCode, trips]);

  const selectedDistrictPhotos = useMemo(() => {
    if (!selectedDistrictCode) return [];
    return photos.filter(p => p.districtCode === selectedDistrictCode);
  }, [selectedDistrictCode, photos]);

  const currentViewBox = useMemo(() => {
    const baseBox = sdoViewBoxes[selectedSdo] || sdoViewBoxes['전국'];
    const [minX, minY, width, height] = baseBox.split(' ').map(Number);
    
    const scaledWidth = width / zoomLevel;
    const scaledHeight = height / zoomLevel;
    const offsetX = panOffset.x;
    const offsetY = panOffset.y;

    return `${minX + (width - scaledWidth) / 2 + offsetX} ${minY + (height - scaledHeight) / 2 + offsetY} ${scaledWidth} ${scaledHeight}`;
  }, [selectedSdo, zoomLevel, panOffset]);

  const handleSdoChange = (sdo: string) => {
    setSelectedSdo(sdo);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoom = (factor: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev * factor, 0.6), 18.0));
  };

  const handleResetZoom = () => {
    setSelectedSdo('전국');
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedDistrictCode(null);
  };

  const handleDistrictClick = (district: DistrictFeatureProperties) => {
    setSelectedDistrictCode(district.code);
  };

  const handleDistrictDoubleClick = (district: DistrictFeatureProperties) => {
    if (district.center && district.center.svgX && district.center.svgY) {
      setSelectedDistrictCode(district.code);
      setSelectedSdo('전국');
      setZoomLevel(5.0);
      const centerX = district.center.svgX;
      const centerY = district.center.svgY;
      setPanOffset({ x: centerX - 400, y: centerY - 500 });
    }
  };

  // ==========================================
  // [계층형 줌 핵심 2] 광역시도 캡슐 클릭 시 해당 도로 자동 줌인 (Drill-down)
  // ==========================================
  const handleSdoClusterClick = (sdo: SdoMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    handleSdoChange(sdo.fullName);
  };

  const handleSelectSearchResult = (district: DistrictFeatureProperties) => {
    setSelectedDistrictCode(district.code);
    setSelectedSdo(district.sdoName);
    setZoomLevel(2.5);
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
      const dx = (e.clientX - dragStart.x) * (800 / (containerRef.current?.clientWidth || 800)) / zoomLevel;
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

  const dynamicFontSize = useMemo(() => {
    const baseBox = sdoViewBoxes[selectedSdo] || sdoViewBoxes['전국'];
    const [, , width] = baseBox.split(' ').map(Number);
    const viewWidth = width / zoomLevel;
    if (viewWidth < 40) return 1.2;
    if (viewWidth < 70) return 1.8;
    if (viewWidth < 120) return 2.8;
    if (viewWidth < 200) return 4.2;
    if (viewWidth < 300) return 5.5;
    return 7.5;
  }, [selectedSdo, zoomLevel]);

  // ==========================================
  // [계층형 줌 핵심 3] 줌 레벨에 따른 2단계 표시 분기
  // - 줌아웃 전국 뷰 (zoomLevel < 1.7 && selectedSdo === '전국'): 17개 광역시도 대단위 라벨만 표시!
  // - 줌인 세부 뷰 (zoomLevel >= 1.7 || selectedSdo !== '전국'): 250개 세부 시군구 라벨 표시!
  // ==========================================
  const isNationalOverview = (selectedSdo === '전국' && zoomLevel < 1.7);

  // 3종 소셜 템플릿 카드 캔버스 렌더링 & 다운로드
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

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 36px sans-serif';
          ctx.fillText('TRAVEL LOG KOREA', 80, 160);

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 68px sans-serif';
          ctx.fillText('나의 대한민국 여행 지도', 80, 240);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 34px sans-serif';
          ctx.fillText(`전국 250개 시군구 중 ${visitedSummaryMap.size}곳 정복 완료 (${((visitedSummaryMap.size / 250) * 100).toFixed(1)}%)`, 80, 300);

          ctx.drawImage(image, 90, 360, 900, 1125);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.roundRect(80, 1560, 920, 180, 30);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 42px sans-serif';
          ctx.fillText(`✨ 누적 여행 ${trips.length}회 • 사진 ${photos.length}장 아카이빙`, 130, 1665);

        } else if (exportTemplate === 'toss') {
          canvas.width = 1200;
          canvas.height = 1200;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1200, 1200);

          ctx.fillStyle = '#3182f6';
          ctx.font = 'bold 40px sans-serif';
          ctx.fillText('TravelLog', 80, 120);

          ctx.fillStyle = '#191f28';
          ctx.font = '900 72px sans-serif';
          ctx.fillText('대한민국 방방곡곡 자산', 80, 210);

          ctx.fillStyle = '#3182f6';
          ctx.font = 'bold 80px sans-serif';
          ctx.fillText(`${((visitedSummaryMap.size / 250) * 100).toFixed(1)}%`, 80, 310);

          ctx.drawImage(image, 250, 340, 700, 875);

        } else {
          canvas.width = 1200;
          canvas.height = 1600;

          ctx.fillStyle = '#064e3b';
          ctx.fillRect(0, 0, 1200, 1600);

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 12;
          ctx.strokeRect(40, 40, 1120, 1520);

          ctx.fillStyle = '#fef3c7';
          ctx.font = '900 64px serif';
          ctx.textAlign = 'center';
          ctx.fillText('대한민국 국토정복 증명서', 600, 180);

          ctx.font = 'bold 36px serif';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(`방문 시군구: ${visitedSummaryMap.size}개 행정구역 완료`, 600, 250);

          ctx.drawImage(image, 150, 320, 900, 1125);
          ctx.textAlign = 'left';
        }

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `korea_travel_map_${exportTemplate}_${Date.now()}.png`;
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

  const totalCount = features.length;
  const visitedCount = visitedSummaryMap.size;
  const visitPercent = ((visitedCount / totalCount) * 100).toFixed(1);

  const selectedSummary = selectedFeature ? visitedSummaryMap.get(selectedFeature.properties.code) : null;
  const selectedThumbnailPhoto = selectedDistrictPhotos[0];

  return (
    <div className="map-viewer-container" ref={containerRef}>
      {/* 좌측: 메인 지도 캔버스 */}
      <div className="map-main-canvas">
        {/* 상단 툴바 */}
        <div className="map-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
            <select
              className="map-sdo-select"
              value={selectedSdo}
              onChange={e => handleSdoChange(e.target.value)}
            >
              <option value="전국">전국 (17개 광역시·도)</option>
              {sdoList.map(sdo => (
                <option key={sdo} value={sdo}>
                  {sdo}
                </option>
              ))}
            </select>

            {/* 실시간 시군구 검색창 */}
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
                  placeholder="시·군·구 검색 (예: 사하구, 강남구)"
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
                    width: '160px',
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
                          <MapPin size={14} style={{ color: isVisited ? '#3182f6' : 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 700 }}>{dist.fullName}</span>
                        </div>
                        {isVisited && (
                          <span style={{ fontSize: '0.72rem', background: '#e8f3ff', color: '#3182f6', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
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
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#3182f6', background: '#e8f3ff', padding: '6px 12px', borderRadius: '9999px' }}>
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
            setHoveredDistrict(null);
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
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#3182f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                  ✓
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.74rem', color: '#3182f6', fontWeight: 800 }}>
                  {selectedSummary.visitCount}회 방문 • {selectedSummary.latestVisitDate}
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSummary.fullName}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedSummary.latestTripTitle}
                </div>
              </div>

              <button
                onClick={() => setSelectedDistrictCode(null)}
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
            {/* 1. 전국 250개 시군구 폴리곤 */}
            <g>
              {features.map(feature => {
                const props = feature.properties;
                const summary = visitedSummaryMap.get(props.code);
                const isVisited = !!summary;
                const isSelected = selectedDistrictCode === props.code;
                const fillColor = isVisited ? summary.color : undefined;

                return (
                  <path
                    key={props.code}
                    d={props.path}
                    className={`district-path ${isVisited ? 'visited' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{
                      fill: fillColor,
                      opacity: selectedSdo === '전국' || props.sdoName === selectedSdo ? 1 : 0.22,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      handleDistrictClick(props);
                    }}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      handleDistrictDoubleClick(props);
                    }}
                    onMouseEnter={() => setHoveredDistrict(props)}
                  />
                );
              })}
            </g>

            {/* 2. [계층형 줌 1단계: 줌아웃 전국 뷰] 17개 광역시·도 대표 라벨 렌더링 */}
            {showLabels && isNationalOverview && (
              <g className="sdo-cluster-labels">
                {SDO_METAS.map(sdo => {
                  const sdoDistricts = features.filter(f => f.properties.sdoName === sdo.fullName);
                  const totalInSdo = sdoDistricts.length;
                  const visitedInSdo = sdoDistricts.filter(f => visitedSummaryMap.has(f.properties.code)).length;
                  const hasVisited = visitedInSdo > 0;
                  const isAllVisited = visitedInSdo === totalInSdo && totalInSdo > 0;

                  return (
                    <g
                      key={`sdo_${sdo.name}`}
                      transform={`translate(${sdo.center.svgX}, ${sdo.center.svgY})`}
                      onClick={e => handleSdoClusterClick(sdo, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* 배경 캡슐 알약 */}
                      <rect
                        x="-44"
                        y="-15"
                        width="88"
                        height="30"
                        rx="15"
                        fill={isAllVisited ? '#10b981' : hasVisited ? '#3182f6' : '#1e293b'}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        filter="drop-shadow(0 4px 8px rgba(0,0,0,0.35))"
                      />
                      {/* 텍스트: 도명 & 방문 수 */}
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
                        {sdo.name} {hasVisited ? `(${visitedInSdo}/${totalInSdo})` : `(${totalInSdo}곳)`}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 3. [계층형 줌 2단계: 줌인 세부 뷰] 250개 세부 시·군·구 지명 렌더링 */}
            {showLabels && !isNationalOverview && (
              <g className="district-labels" style={{ pointerEvents: 'none' }}>
                {features.map(feature => {
                  const props = feature.properties;
                  if (!props.center || !props.center.svgX || !props.center.svgY) return null;
                  if (selectedSdo !== '전국' && props.sdoName !== selectedSdo) return null;

                  const isVisited = visitedSummaryMap.has(props.code);
                  const isSelected = selectedDistrictCode === props.code;
                  const displayName = formatDisplayDistrictName(props.name);

                  return (
                    <text
                      key={`lbl_${props.code}`}
                      x={props.center.svgX}
                      y={props.center.svgY}
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
                      {displayName}
                    </text>
                  );
                })}
              </g>
            )}
          </svg>

          {/* 호버 툴팁 */}
          {hoveredDistrict && (
            <div
              className="map-tooltip"
              style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{hoveredDistrict.fullName}</div>
              {visitedSummaryMap.has(hoveredDistrict.code) ? (
                <div style={{ fontSize: '0.78rem', color: '#60a5fa', marginTop: '2px', fontWeight: 700 }}>
                  ✓ {visitedSummaryMap.get(hoveredDistrict.code)?.visitCount}회 방문 (최근: {visitedSummaryMap.get(hoveredDistrict.code)?.latestVisitDate})
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                  {isNationalOverview ? '클릭 시 해당 도로 확대' : '더블클릭 시 5x 초밀착 확대'}
                </div>
              )}
            </div>
          )}

          {/* 플로팅 컨트롤 */}
          <div className="map-controls">
            <button
              className="map-control-btn"
              onClick={() => setIsExportModalOpen(true)}
              title="3종 소셜 공유 맵 카드 저장 (인스타/토스/여권)"
            >
              <Share2 size={18} />
            </button>
            <button
              className="map-control-btn"
              onClick={() => setShowLabels(prev => !prev)}
              title={showLabels ? '지명 숨기기' : '지명 표시'}
              style={{ color: showLabels ? '#3182f6' : 'inherit' }}
            >
              {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button className="map-control-btn" onClick={() => handleZoom(1.4)} title="확대 (최대 18배 지원)">
              <ZoomIn size={18} />
            </button>
            <button className="map-control-btn" onClick={() => handleZoom(0.7)} title="축소">
              <ZoomOut size={18} />
            </button>
            <button className="map-control-btn" onClick={handleResetZoom} title="전국 지도 초기화">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 우측: 선택된 지역 상세 패널 */}
      <div className="map-side-panel">
        <div className="side-panel-header">
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {selectedFeature ? selectedFeature.properties.fullName : '지역을 선택해주세요'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selectedFeature
                ? visitedSummaryMap.has(selectedFeature.properties.code)
                  ? `총 ${visitedSummaryMap.get(selectedFeature.properties.code)?.visitCount}번의 여행 기록이 있습니다.`
                  : '아직 기록된 여행이 없습니다. 첫 번째 여행을 기록해보세요!'
                : '지도에서 경기도, 강원도 등 시·도를 클릭하면 세부 시·군·구가 표시됩니다.'}
            </p>
          </div>

          {selectedFeature && (
            <button
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.86rem' }}
              onClick={() => onNewTripForDistrict(selectedFeature.properties)}
            >
              <Plus size={16} />
              <span>기록 추가</span>
            </button>
          )}
        </div>

        <div className="side-panel-body">
          {!selectedFeature ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗺️</div>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                대한민국 어디를 다녀오셨나요?
              </p>
              <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                전국 뷰에서 [경기도], [강원도] 등 원하는 지역을 클릭하면 세부 시·군·구로 줌인됩니다.
              </p>
            </div>
          ) : selectedDistrictTrips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Sparkles size={36} style={{ margin: '0 auto 10px', color: '#3182f6' }} />
              <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {selectedFeature.properties.name} 여행 기록이 없습니다
              </p>
              <p style={{ fontSize: '0.84rem', marginTop: '6px', marginBottom: '16px' }}>
                이 지역에서 찍은 사진을 올리면 촬영 날짜와 위치를 분석해 자동으로 기록을 만들어 드립니다.
              </p>
              <button
                className="btn btn-outline"
                onClick={() => onNewTripForDistrict(selectedFeature.properties)}
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
                    borderLeft: `5px solid ${trip.color || '#3182f6'}`,
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

              {/* 지역 사진 프리뷰 */}
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
                📸 소셜 공유 맵 카드 만들기
              </h3>
              <button className="btn-icon" onClick={() => setIsExportModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '-8px' }}>
              내 대한민국 여행 지도를 인스타그램 스토리나 예쁜 카드 형태로 1초 만에 저장하세요.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                onClick={() => setExportTemplate('story')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '18px',
                  border: exportTemplate === 'story' ? '2px solid #3182f6' : '1px solid #e2e8f0',
                  background: exportTemplate === 'story' ? '#eff6ff' : '#ffffff',
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
                  border: exportTemplate === 'toss' ? '2px solid #3182f6' : '1px solid #e2e8f0',
                  background: exportTemplate === 'toss' ? '#eff6ff' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🔵</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>토스 미니멀</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>1:1 정사각</span>
              </button>

              <button
                onClick={() => setExportTemplate('passport')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '18px',
                  border: exportTemplate === 'passport' ? '2px solid #3182f6' : '1px solid #e2e8f0',
                  background: exportTemplate === 'passport' ? '#eff6ff' : '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📜</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>여권 증명서</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>클래식 그린</span>
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', fontSize: '0.84rem', color: '#475569' }}>
              {exportTemplate === 'story' && '✨ 인스타그램 스토리(9:16)에 최적화된 다크 모던 테마로, 정복률과 지도가 한눈에 들어옵니다.'}
              {exportTemplate === 'toss' && '✨ 깔끔하고 세련된 토스 스타일 1:1 카드 형태로 피드 게시물에 적합합니다.'}
              {exportTemplate === 'passport' && '✨ 대한민국 공식 여권 감성의 골드 프레임과 정복 뱃지가 포함된 고급 증명서입니다.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-subtle" onClick={() => setIsExportModalOpen(false)}>닫기</button>
              <button
                className="btn btn-primary"
                style={{ padding: '12px 20px', fontSize: '0.92rem', fontWeight: 800 }}
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
    </div>
  );
};
