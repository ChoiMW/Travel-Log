import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigation, NavTab } from './components/Layout/Navigation';
import { TossHomeView } from './components/Themes/Toss/TossHomeView';
import { MapViewer } from './components/Map/MapViewer';
import { TripTimeline } from './components/Diary/TripTimeline';
import { TripDetailModal } from './components/Diary/TripDetailModal';
import { TripEditorModal } from './components/Editor/TripEditorModal';
import { PhotoGallery } from './components/Photo/PhotoGallery';
import { PhotoLightbox } from './components/Photo/PhotoLightbox';
import { StatsDashboard } from './components/Stats/StatsDashboard';
import { SettingsModal } from './components/Settings/SettingsModal';
import { TravelPocketView } from './components/Pocket/TravelPocketView';

import { getAllTrips, getAllPhotos, saveTrip, savePhotos, deleteTrip } from './db';
import { Trip, PhotoItem, VisitedDistrictSummary, DistrictFeatureProperties } from './types/travel';
import { ParsedPhotoResult } from './utils/exif';
import { matchActiveTrip, ActiveTripMatchResult } from './utils/tripMatcher';
import districtsData from './data/koreaDistricts.json';
import { MapPin, Calendar, Sparkles, ArrowRight, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ==========================================
  // [신규] 실시간 위치 및 오늘 날짜 기반 자동 매칭 상태
  // ==========================================
  const [activeMatchResult, setActiveMatchResult] = useState<ActiveTripMatchResult | null>(null);
  const [isMatchBannerDismissed, setIsMatchBannerDismissed] = useState<boolean>(false);

  // 다크모드 상태
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('travellog_theme');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('travellog_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // 모달 상태
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [initialDistrictForTrip, setInitialDistrictForTrip] = useState<DistrictFeatureProperties | null>(null);

  const [selectedTripForDetail, setSelectedTripForDetail] = useState<Trip | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const [selectedPhotoForLightbox, setSelectedPhotoForLightbox] = useState<PhotoItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // 데이터 로드
  const loadData = useCallback(async () => {
    try {
      const loadedTrips = await getAllTrips();
      const loadedPhotos = await getAllPhotos();
      setTrips(loadedTrips);
      setPhotos(loadedPhotos);

      // 위치 & 날짜 기반 여행 자동 매칭 실행
      if (loadedTrips.length > 0) {
        const result = await matchActiveTrip(loadedTrips);
        if (result.matchedTrip) {
          setActiveMatchResult(result);
        }
      }
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 방문한 시군구 요약 맵
  const visitedSummaryMap = useMemo(() => {
    const map = new Map<string, VisitedDistrictSummary>();

    trips.forEach(trip => {
      trip.districtCodes.forEach((code, idx) => {
        const fullName = trip.districtNames?.[idx] || code;
        const sdoName = fullName.split(' ')[0] || '';
        const name = fullName.split(' ').slice(1).join(' ') || fullName;

        const existing = map.get(code);
        if (existing) {
          existing.visitCount += 1;
          existing.tripIds.push(trip.id);
          if (trip.startDate > existing.latestVisitDate) {
            existing.latestVisitDate = trip.startDate;
            existing.latestTripTitle = trip.title;
            existing.color = trip.color || existing.color;
          }
        } else {
          map.set(code, {
            districtCode: code,
            fullName,
            sdoName,
            name,
            visitCount: 1,
            latestVisitDate: trip.startDate,
            latestTripTitle: trip.title,
            color: trip.color || '#3b82f6',
            photoCount: 0,
            tripIds: [trip.id],
          });
        }
      });
    });

    photos.forEach(p => {
      if (p.districtCode && map.has(p.districtCode)) {
        const item = map.get(p.districtCode)!;
        item.photoCount += 1;
      }
    });

    return map;
  }, [trips, photos]);

  const totalDistrictsCount = districtsData.features.length;

  const handleOpenNewTrip = (district?: DistrictFeatureProperties) => {
    setEditingTrip(null);
    setInitialDistrictForTrip(district || null);
    setIsEditorOpen(true);
  };

  const handleOpenEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setInitialDistrictForTrip(null);
    setIsEditorOpen(true);
  };

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTripForDetail(trip);
    setIsDetailOpen(true);
  };

  const handleOpenPhoto = (photo: PhotoItem) => {
    setSelectedPhotoForLightbox(photo);
    setIsLightboxOpen(true);
  };

  const handleSaveTrip = async (tripData: Trip, newPhotos: ParsedPhotoResult[]) => {
    await saveTrip(tripData);

    if (newPhotos.length > 0) {
      const photoItems: PhotoItem[] = newPhotos.map(p => {
        const districtCode = p.districtCode || tripData.districtCodes[0] || '';
        const districtName = p.districtName || tripData.districtNames[0] || '';

        return {
          id: p.id || `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tripId: tripData.id,
          districtCode,
          districtName,
          fileName: p.file.name,
          blob: p.blob,
          thumbnailUrl: p.thumbnailUrl,
          takenAt: p.takenAt,
          latitude: p.latitude,
          longitude: p.longitude,
          make: p.make,
          model: p.model,
          createdAt: new Date().toISOString(),
        };
      });

      await savePhotos(photoItems);
    }

    await loadData();
  };

  const handleUpdateTripFromPocket = async (updatedTrip: Trip) => {
    await saveTrip(updatedTrip);
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
  };

  const handleDeleteTrip = async (tripId: string) => {
    await deleteTrip(tripId);
    await loadData();
  };

  // 자동 매칭 배너 클릭 시 여행 포켓으로 이동
  const handleGoToMatchedTrip = () => {
    if (activeMatchResult?.matchedTrip) {
      setCurrentTab('pocket');
    }
  };

  return (
    <div className="app-container">
      {/* 상단 네비게이션 헤더 & 모바일 탭바 */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onNewTrip={() => handleOpenNewTrip()}
        visitedCount={visitedSummaryMap.size}
        totalCount={totalDistrictsCount}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* 🚀 실시간 위치 & 오늘 날짜 자동 매칭 스마트 라이브 배너 */}
      {activeMatchResult?.matchedTrip && !isMatchBannerDismissed && (
        <div
          style={{
            maxWidth: '1200px',
            margin: '12px auto 0',
            padding: '0 20px',
            width: '100%',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.1)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#3182f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}
              >
                📍
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8', fontWeight: 800 }}>
                  <Sparkles size={13} />
                  <span>현재 위치 & 날짜 일치 여행 자동 연결됨</span>
                  {activeMatchResult.currentDistrict && (
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '2px 8px', borderRadius: '9999px' }}>
                      {activeMatchResult.currentDistrict.fullName}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.98rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {activeMatchResult.matchedTrip.title}
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8', marginLeft: '8px' }}>
                    ({activeMatchResult.matchedTrip.startDate} ~ {activeMatchResult.matchedTrip.endDate})
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleGoToMatchedTrip}
                style={{
                  background: '#3182f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s ease',
                }}
              >
                <span>일정/QR 보기</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => setIsMatchBannerDismissed(true)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '10px',
                  padding: '6px',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 뷰 컨텐츠 */}
      <main className="main-content">
        {/* 1. 홈 화면 (토스 원페이지 슈퍼앱) */}
        {currentTab === 'home' && (
          <TossHomeView
            trips={trips}
            photos={photos}
            visitedSummaryMap={visitedSummaryMap}
            totalDistrictsCount={totalDistrictsCount}
            onSelectTrip={handleSelectTrip}
            onNewTrip={() => handleOpenNewTrip()}
            onSelectDistrict={handleOpenNewTrip}
            onOpenPhoto={handleOpenPhoto}
          />
        )}

        {/* 2. 전국 여행 지도 */}
        {currentTab === 'map' && (
          <MapViewer
            trips={trips}
            photos={photos}
            visitedSummaryMap={visitedSummaryMap}
            onSelectTrip={handleSelectTrip}
            onNewTripForDistrict={handleOpenNewTrip}
          />
        )}

        {/* 3. 여행 기록 타임라인 */}
        {currentTab === 'timeline' && (
          <TripTimeline
            trips={trips}
            photos={photos}
            onSelectTrip={handleSelectTrip}
            onNewTrip={() => handleOpenNewTrip()}
          />
        )}

        {/* 4. 사진첩 갤러리 */}
        {currentTab === 'photos' && (
          <PhotoGallery
            photos={photos}
            trips={trips}
            onPhotoClick={handleOpenPhoto}
          />
        )}

        {/* 5. 스마트 여행 포켓 (자동 매칭된 여행 ID 자동 바인딩) */}
        {currentTab === 'pocket' && (
          <TravelPocketView
            trips={trips}
            defaultTripId={activeMatchResult?.matchedTrip?.id}
            onUpdateTrip={handleUpdateTripFromPocket}
            onOpenNewTripPlan={() => handleOpenNewTrip()}
          />
        )}

        {/* 6. 전국 정복 통계 대시보드 */}
        {currentTab === 'stats' && (
          <StatsDashboard
            trips={trips}
            photos={photos}
            visitedSummaryMap={visitedSummaryMap}
          />
        )}

        {/* 7. 백업 및 설정 */}
        {currentTab === 'settings' && (
          <SettingsModal
            isOpen={true}
            onClose={() => setCurrentTab('home')}
            onDataChanged={loadData}
          />
        )}
      </main>

      {/* 여행 작성 / 수정 모달 */}
      <TripEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingTrip(null);
          setInitialDistrictForTrip(null);
        }}
        onSave={handleSaveTrip}
        editingTrip={editingTrip}
        initialDistrict={initialDistrictForTrip}
      />

      {/* 여행 상세 모달 */}
      <TripDetailModal
        trip={selectedTripForDetail}
        photos={photos}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTripForDetail(null);
        }}
        onEdit={handleOpenEditTrip}
        onDelete={handleDeleteTrip}
        onPhotoClick={handleOpenPhoto}
      />

      {/* 사진 라이트박스 */}
      <PhotoLightbox
        photo={selectedPhotoForLightbox}
        trip={trips.find(t => t.id === selectedPhotoForLightbox?.tripId)}
        isOpen={isLightboxOpen}
        onClose={() => {
          setIsLightboxOpen(false);
          setSelectedPhotoForLightbox(null);
        }}
      />
    </div>
  );
};

export default App;
